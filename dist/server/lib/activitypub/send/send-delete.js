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
const video_comment_1 = require("../../../models/video/video-comment");
const video_share_1 = require("../../../models/video/video-share");
const url_1 = require("../url");
const utils_1 = require("./utils");
const audience_1 = require("../audience");
const logger_1 = require("../../../helpers/logger");
const application_1 = require("@server/models/application/application");
function sendDeleteVideo(video, transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to broadcast delete of video %s.', video.url);
        const byActor = video.VideoChannel.Account.Actor;
        const activityBuilder = (audience) => {
            const url = url_1.getDeleteActivityPubUrl(video.url);
            return buildDeleteActivity(url, video.url, byActor, audience);
        };
        return utils_1.sendVideoRelatedActivity(activityBuilder, { byActor, video, transaction });
    });
}
exports.sendDeleteVideo = sendDeleteVideo;
function sendDeleteActor(byActor, t) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to broadcast delete of actor %s.', byActor.url);
        const url = url_1.getDeleteActivityPubUrl(byActor.url);
        const activity = buildDeleteActivity(url, byActor.url, byActor);
        const actorsInvolved = yield video_share_1.VideoShareModel.loadActorsWhoSharedVideosOf(byActor.id, t);
        const serverActor = yield application_1.getServerActor();
        actorsInvolved.push(serverActor);
        actorsInvolved.push(byActor);
        return utils_1.broadcastToFollowers(activity, byActor, actorsInvolved, t);
    });
}
exports.sendDeleteActor = sendDeleteActor;
function sendDeleteVideoComment(videoComment, t) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to send delete of comment %s.', videoComment.url);
        const isVideoOrigin = videoComment.Video.isOwned();
        const url = url_1.getDeleteActivityPubUrl(videoComment.url);
        const byActor = videoComment.isOwned()
            ? videoComment.Account.Actor
            : videoComment.Video.VideoChannel.Account.Actor;
        const threadParentComments = yield video_comment_1.VideoCommentModel.listThreadParentComments(videoComment, t);
        const threadParentCommentsFiltered = threadParentComments.filter(c => !c.isDeleted());
        const actorsInvolvedInComment = yield audience_1.getActorsInvolvedInVideo(videoComment.Video, t);
        actorsInvolvedInComment.push(byActor);
        const audience = audience_1.getVideoCommentAudience(videoComment, threadParentCommentsFiltered, actorsInvolvedInComment, isVideoOrigin);
        const activity = buildDeleteActivity(url, videoComment.url, byActor, audience);
        const actorsException = [byActor];
        yield utils_1.broadcastToActors(activity, byActor, threadParentCommentsFiltered.map(c => c.Account.Actor), t, actorsException);
        yield utils_1.broadcastToFollowers(activity, byActor, [byActor], t);
        if (isVideoOrigin)
            return utils_1.broadcastToFollowers(activity, byActor, actorsInvolvedInComment, t, actorsException);
        t.afterCommit(() => utils_1.unicastTo(activity, byActor, videoComment.Video.VideoChannel.Account.Actor.getSharedInbox()));
    });
}
exports.sendDeleteVideoComment = sendDeleteVideoComment;
function sendDeleteVideoPlaylist(videoPlaylist, t) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to send delete of playlist %s.', videoPlaylist.url);
        const byActor = videoPlaylist.OwnerAccount.Actor;
        const url = url_1.getDeleteActivityPubUrl(videoPlaylist.url);
        const activity = buildDeleteActivity(url, videoPlaylist.url, byActor);
        const serverActor = yield application_1.getServerActor();
        const toFollowersOf = [byActor, serverActor];
        if (videoPlaylist.VideoChannel)
            toFollowersOf.push(videoPlaylist.VideoChannel.Actor);
        return utils_1.broadcastToFollowers(activity, byActor, toFollowersOf, t);
    });
}
exports.sendDeleteVideoPlaylist = sendDeleteVideoPlaylist;
function buildDeleteActivity(url, object, byActor, audience) {
    const activity = {
        type: 'Delete',
        id: url,
        actor: byActor.url,
        object
    };
    if (audience)
        return audience_1.audiencify(activity, audience);
    return activity;
}
