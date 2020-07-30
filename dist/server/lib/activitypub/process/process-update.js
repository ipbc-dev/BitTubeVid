"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUpdateActivity = void 0;
const tslib_1 = require("tslib");
const database_utils_1 = require("../../../helpers/database-utils");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
const actor_1 = require("../../../models/activitypub/actor");
const video_channel_1 = require("../../../models/video/video-channel");
const actor_2 = require("../actor");
const videos_1 = require("../videos");
const videos_2 = require("../../../helpers/custom-validators/activitypub/videos");
const cache_file_1 = require("../../../helpers/custom-validators/activitypub/cache-file");
const cache_file_2 = require("../cache-file");
const utils_1 = require("../send/utils");
const playlist_1 = require("../playlist");
const redundancy_1 = require("@server/lib/redundancy");
function processUpdateActivity(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        const objectType = activity.object.type;
        if (objectType === 'Video') {
            return database_utils_1.retryTransactionWrapper(processUpdateVideo, byActor, activity);
        }
        if (objectType === 'Person' || objectType === 'Application' || objectType === 'Group') {
            const byActorFull = yield actor_1.ActorModel.loadByUrlAndPopulateAccountAndChannel(byActor.url);
            return database_utils_1.retryTransactionWrapper(processUpdateActor, byActorFull, activity);
        }
        if (objectType === 'CacheFile') {
            const byActorFull = yield actor_1.ActorModel.loadByUrlAndPopulateAccountAndChannel(byActor.url);
            return database_utils_1.retryTransactionWrapper(processUpdateCacheFile, byActorFull, activity);
        }
        if (objectType === 'Playlist') {
            return database_utils_1.retryTransactionWrapper(processUpdatePlaylist, byActor, activity);
        }
        return undefined;
    });
}
exports.processUpdateActivity = processUpdateActivity;
function processUpdateVideo(actor, activity) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoObject = activity.object;
        if (videos_2.sanitizeAndCheckVideoTorrentObject(videoObject) === false) {
            logger_1.logger.debug('Video sent by update is not valid.', { videoObject });
            return undefined;
        }
        const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: videoObject.id, allowRefresh: false, fetchType: 'all' });
        const channelActor = yield videos_1.getOrCreateVideoChannelFromVideoObject(videoObject);
        const account = actor.Account;
        account.Actor = actor;
        const updateOptions = {
            video,
            videoObject,
            account,
            channel: channelActor.VideoChannel,
            overrideTo: activity.to
        };
        return videos_1.updateVideoFromAP(updateOptions);
    });
}
function processUpdateCacheFile(byActor, activity) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if ((yield redundancy_1.isRedundancyAccepted(activity, byActor)) !== true)
            return;
        const cacheFileObject = activity.object;
        if (!cache_file_1.isCacheFileObjectValid(cacheFileObject)) {
            logger_1.logger.debug('Cache file object sent by update is not valid.', { cacheFileObject });
            return undefined;
        }
        const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: cacheFileObject.object });
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield cache_file_2.createOrUpdateCacheFile(cacheFileObject, video, byActor, t);
        }));
        if (video.isOwned()) {
            const exceptions = [byActor];
            yield utils_1.forwardVideoRelatedActivity(activity, undefined, exceptions, video);
        }
    });
}
function processUpdateActor(actor, activity) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const actorAttributesToUpdate = activity.object;
        logger_1.logger.debug('Updating remote account "%s".', actorAttributesToUpdate.url);
        let accountOrChannelInstance;
        let actorFieldsSave;
        let accountOrChannelFieldsSave;
        const avatarInfo = yield actor_2.getAvatarInfoIfExists(actorAttributesToUpdate);
        try {
            yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                actorFieldsSave = actor.toJSON();
                if (actorAttributesToUpdate.type === 'Group')
                    accountOrChannelInstance = actor.VideoChannel;
                else
                    accountOrChannelInstance = actor.Account;
                accountOrChannelFieldsSave = accountOrChannelInstance.toJSON();
                yield actor_2.updateActorInstance(actor, actorAttributesToUpdate);
                if (avatarInfo !== undefined) {
                    const avatarOptions = Object.assign({}, avatarInfo, { onDisk: false });
                    yield actor_2.updateActorAvatarInstance(actor, avatarOptions, t);
                }
                yield actor.save({ transaction: t });
                accountOrChannelInstance.name = actorAttributesToUpdate.name || actorAttributesToUpdate.preferredUsername;
                accountOrChannelInstance.description = actorAttributesToUpdate.summary;
                if (accountOrChannelInstance instanceof video_channel_1.VideoChannelModel)
                    accountOrChannelInstance.support = actorAttributesToUpdate.support;
                yield accountOrChannelInstance.save({ transaction: t });
            }));
            logger_1.logger.info('Remote account %s updated', actorAttributesToUpdate.url);
        }
        catch (err) {
            if (actor !== undefined && actorFieldsSave !== undefined) {
                database_utils_1.resetSequelizeInstance(actor, actorFieldsSave);
            }
            if (accountOrChannelInstance !== undefined && accountOrChannelFieldsSave !== undefined) {
                database_utils_1.resetSequelizeInstance(accountOrChannelInstance, accountOrChannelFieldsSave);
            }
            logger_1.logger.debug('Cannot update the remote account.', { err });
            throw err;
        }
    });
}
function processUpdatePlaylist(byActor, activity) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const playlistObject = activity.object;
        const byAccount = byActor.Account;
        if (!byAccount)
            throw new Error('Cannot update video playlist with the non account actor ' + byActor.url);
        yield playlist_1.createOrUpdateVideoPlaylist(playlistObject, byAccount, activity.to);
    });
}
