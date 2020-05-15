"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../helpers/utils");
const video_share_1 = require("../../models/video/video-share");
const send_1 = require("./send");
const url_1 = require("./url");
const Bluebird = require("bluebird");
const requests_1 = require("../../helpers/requests");
const actor_1 = require("./actor");
const logger_1 = require("../../helpers/logger");
const constants_1 = require("../../initializers/constants");
const activitypub_1 = require("../../helpers/activitypub");
function shareVideoByServerAndChannel(video, t) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!video.hasPrivacyForFederation())
            return undefined;
        return Promise.all([
            shareByServer(video, t),
            shareByVideoChannel(video, t)
        ]);
    });
}
exports.shareVideoByServerAndChannel = shareVideoByServerAndChannel;
function changeVideoChannelShare(video, oldVideoChannel, t) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Updating video channel of video %s: %s -> %s.', video.uuid, oldVideoChannel.name, video.VideoChannel.name);
        yield undoShareByVideoChannel(video, oldVideoChannel, t);
        yield shareByVideoChannel(video, t);
    });
}
exports.changeVideoChannelShare = changeVideoChannelShare;
function addVideoShares(shareUrls, video) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Bluebird.map(shareUrls, (shareUrl) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = yield requests_1.doRequest({
                    uri: shareUrl,
                    json: true,
                    activityPub: true
                });
                if (!body || !body.actor)
                    throw new Error('Body or body actor is invalid');
                const actorUrl = activitypub_1.getAPId(body.actor);
                if (activitypub_1.checkUrlsSameHost(shareUrl, actorUrl) !== true) {
                    throw new Error(`Actor url ${actorUrl} has not the same host than the share url ${shareUrl}`);
                }
                const actor = yield actor_1.getOrCreateActorAndServerAndModel(actorUrl);
                const entry = {
                    actorId: actor.id,
                    videoId: video.id,
                    url: shareUrl
                };
                yield video_share_1.VideoShareModel.upsert(entry);
            }
            catch (err) {
                logger_1.logger.warn('Cannot add share %s.', shareUrl, { err });
            }
        }), { concurrency: constants_1.CRAWL_REQUEST_CONCURRENCY });
    });
}
exports.addVideoShares = addVideoShares;
function shareByServer(video, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverActor = yield utils_1.getServerActor();
        const serverShareUrl = url_1.getVideoAnnounceActivityPubUrl(serverActor, video);
        const [serverShare] = yield video_share_1.VideoShareModel.findOrCreate({
            defaults: {
                actorId: serverActor.id,
                videoId: video.id,
                url: serverShareUrl
            },
            where: {
                url: serverShareUrl
            },
            transaction: t
        });
        return send_1.sendVideoAnnounce(serverActor, serverShare, video, t);
    });
}
function shareByVideoChannel(video, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoChannelShareUrl = url_1.getVideoAnnounceActivityPubUrl(video.VideoChannel.Actor, video);
        const [videoChannelShare] = yield video_share_1.VideoShareModel.findOrCreate({
            defaults: {
                actorId: video.VideoChannel.actorId,
                videoId: video.id,
                url: videoChannelShareUrl
            },
            where: {
                url: videoChannelShareUrl
            },
            transaction: t
        });
        return send_1.sendVideoAnnounce(video.VideoChannel.Actor, videoChannelShare, video, t);
    });
}
function undoShareByVideoChannel(video, oldVideoChannel, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const oldShare = yield video_share_1.VideoShareModel.load(oldVideoChannel.actorId, video.id, t);
        if (!oldShare)
            return new Error('Cannot find old video channel share ' + oldVideoChannel.actorId + ' for video ' + video.id);
        yield send_1.sendUndoAnnounce(oldVideoChannel.Actor, oldShare, video, t);
        yield oldShare.destroy({ transaction: t });
    });
}
