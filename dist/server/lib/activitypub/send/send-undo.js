"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUndoCacheFile = exports.sendUndoAnnounce = exports.sendUndoDislike = exports.sendUndoLike = exports.sendUndoFollow = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../../helpers/logger");
const video_1 = require("../../../models/video/video");
const audience_1 = require("../audience");
const url_1 = require("../url");
const send_announce_1 = require("./send-announce");
const send_create_1 = require("./send-create");
const send_dislike_1 = require("./send-dislike");
const send_follow_1 = require("./send-follow");
const send_like_1 = require("./send-like");
const utils_1 = require("./utils");
function sendUndoFollow(actorFollow, t) {
    const me = actorFollow.ActorFollower;
    const following = actorFollow.ActorFollowing;
    if (!following.serverId)
        return;
    logger_1.logger.info('Creating job to send an unfollow request to %s.', following.url);
    const undoUrl = url_1.getUndoActivityPubUrl(actorFollow.url);
    const followActivity = send_follow_1.buildFollowActivity(actorFollow.url, me, following);
    const undoActivity = undoActivityData(undoUrl, me, followActivity);
    t.afterCommit(() => utils_1.unicastTo(undoActivity, me, following.inboxUrl));
}
exports.sendUndoFollow = sendUndoFollow;
function sendUndoAnnounce(byActor, videoShare, video, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to undo announce %s.', videoShare.url);
        const undoUrl = url_1.getUndoActivityPubUrl(videoShare.url);
        const { activity: announceActivity, actorsInvolvedInVideo } = yield send_announce_1.buildAnnounceWithVideoAudience(byActor, videoShare, video, t);
        const undoActivity = undoActivityData(undoUrl, byActor, announceActivity);
        const followersException = [byActor];
        return utils_1.broadcastToFollowers(undoActivity, byActor, actorsInvolvedInVideo, t, followersException);
    });
}
exports.sendUndoAnnounce = sendUndoAnnounce;
function sendUndoLike(byActor, video, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to undo a like of video %s.', video.url);
        const likeUrl = url_1.getVideoLikeActivityPubUrlByLocalActor(byActor, video);
        const likeActivity = send_like_1.buildLikeActivity(likeUrl, byActor, video);
        return sendUndoVideoRelatedActivity({ byActor, video, url: likeUrl, activity: likeActivity, transaction: t });
    });
}
exports.sendUndoLike = sendUndoLike;
function sendUndoDislike(byActor, video, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to undo a dislike of video %s.', video.url);
        const dislikeUrl = url_1.getVideoDislikeActivityPubUrlByLocalActor(byActor, video);
        const dislikeActivity = send_dislike_1.buildDislikeActivity(dislikeUrl, byActor, video);
        return sendUndoVideoRelatedActivity({ byActor, video, url: dislikeUrl, activity: dislikeActivity, transaction: t });
    });
}
exports.sendUndoDislike = sendUndoDislike;
function sendUndoCacheFile(byActor, redundancyModel, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to undo cache file %s.', redundancyModel.url);
        const associatedVideo = redundancyModel.getVideo();
        if (!associatedVideo) {
            logger_1.logger.warn('Cannot send undo activity for redundancy %s: no video files associated.', redundancyModel.url);
            return;
        }
        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(associatedVideo.id);
        const createActivity = send_create_1.buildCreateActivity(redundancyModel.url, byActor, redundancyModel.toActivityPubObject());
        return sendUndoVideoRelatedActivity({ byActor, video, url: redundancyModel.url, activity: createActivity, transaction: t });
    });
}
exports.sendUndoCacheFile = sendUndoCacheFile;
function undoActivityData(url, byActor, object, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    return audience_1.audiencify({
        type: 'Undo',
        id: url,
        actor: byActor.url,
        object
    }, audience);
}
function sendUndoVideoRelatedActivity(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const activityBuilder = (audience) => {
            const undoUrl = url_1.getUndoActivityPubUrl(options.url);
            return undoActivityData(undoUrl, options.byActor, options.activity, audience);
        };
        return utils_1.sendVideoRelatedActivity(activityBuilder, options);
    });
}
