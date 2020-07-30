"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCreateActivity = void 0;
const tslib_1 = require("tslib");
const redundancy_1 = require("@server/lib/redundancy");
const database_utils_1 = require("../../../helpers/database-utils");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
const notifier_1 = require("../../notifier");
const cache_file_1 = require("../cache-file");
const playlist_1 = require("../playlist");
const utils_1 = require("../send/utils");
const video_comments_1 = require("../video-comments");
const videos_1 = require("../videos");
const blocklist_1 = require("@server/lib/blocklist");
function processCreateActivity(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        const notify = options.fromFetch !== true;
        const activityObject = activity.object;
        const activityType = activityObject.type;
        if (activityType === 'Video') {
            return processCreateVideo(activity, notify);
        }
        if (activityType === 'Note') {
            return database_utils_1.retryTransactionWrapper(processCreateVideoComment, activity, byActor, notify);
        }
        if (activityType === 'CacheFile') {
            return database_utils_1.retryTransactionWrapper(processCreateCacheFile, activity, byActor);
        }
        if (activityType === 'Playlist') {
            return database_utils_1.retryTransactionWrapper(processCreatePlaylist, activity, byActor);
        }
        logger_1.logger.warn('Unknown activity object type %s when creating activity.', activityType, { activity: activity.id });
        return Promise.resolve(undefined);
    });
}
exports.processCreateActivity = processCreateActivity;
function processCreateVideo(activity, notify) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoToCreateData = activity.object;
        const syncParam = { likes: false, dislikes: false, shares: false, comments: false, thumbnail: true, refreshVideo: false };
        const { video, created } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: videoToCreateData, syncParam });
        if (created && notify)
            notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(video);
        return video;
    });
}
function processCreateCacheFile(activity, byActor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if ((yield redundancy_1.isRedundancyAccepted(activity, byActor)) !== true)
            return;
        const cacheFile = activity.object;
        const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: cacheFile.object });
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            return cache_file_1.createOrUpdateCacheFile(cacheFile, video, byActor, t);
        }));
        if (video.isOwned()) {
            const exceptions = [byActor];
            yield utils_1.forwardVideoRelatedActivity(activity, undefined, exceptions, video);
        }
    });
}
function processCreateVideoComment(activity, byActor, notify) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const commentObject = activity.object;
        const byAccount = byActor.Account;
        if (!byAccount)
            throw new Error('Cannot create video comment with the non account actor ' + byActor.url);
        let video;
        let created;
        let comment;
        try {
            const resolveThreadResult = yield video_comments_1.resolveThread({ url: commentObject.id, isVideo: false });
            video = resolveThreadResult.video;
            created = resolveThreadResult.commentCreated;
            comment = resolveThreadResult.comment;
        }
        catch (err) {
            logger_1.logger.debug('Cannot process video comment because we could not resolve thread %s. Maybe it was not a video thread, so skip it.', commentObject.inReplyTo, { err });
            return;
        }
        if (video.isOwned() && (yield blocklist_1.isBlockedByServerOrAccount(comment.Account, video.VideoChannel.Account))) {
            logger_1.logger.info('Skip comment forward from blocked account or server %s.', comment.Account.Actor.url);
            return;
        }
        if (video.isOwned() && created === true) {
            const exceptions = [byActor];
            yield utils_1.forwardVideoRelatedActivity(activity, undefined, exceptions, video);
        }
        if (created && notify)
            notifier_1.Notifier.Instance.notifyOnNewComment(comment);
    });
}
function processCreatePlaylist(activity, byActor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const playlistObject = activity.object;
        const byAccount = byActor.Account;
        if (!byAccount)
            throw new Error('Cannot create video playlist with the non account actor ' + byActor.url);
        yield playlist_1.createOrUpdateVideoPlaylist(playlistObject, byAccount, activity.to);
    });
}
