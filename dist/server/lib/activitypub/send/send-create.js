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
const videos_1 = require("../../../../shared/models/videos");
const video_comment_1 = require("../../../models/video/video-comment");
const utils_1 = require("./utils");
const audience_1 = require("../audience");
const logger_1 = require("../../../helpers/logger");
const video_playlist_privacy_model_1 = require("../../../../shared/models/videos/playlist/video-playlist-privacy.model");
const utils_2 = require("../../../helpers/utils");
function sendCreateVideo(video, t) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!video.hasPrivacyForFederation())
            return undefined;
        logger_1.logger.info('Creating job to send video creation of %s.', video.url);
        const byActor = video.VideoChannel.Account.Actor;
        const videoObject = video.toActivityPubObject();
        const audience = audience_1.getAudience(byActor, video.privacy === videos_1.VideoPrivacy.PUBLIC);
        const createActivity = buildCreateActivity(video.url, byActor, videoObject, audience);
        return utils_1.broadcastToFollowers(createActivity, byActor, [byActor], t);
    });
}
exports.sendCreateVideo = sendCreateVideo;
function sendCreateCacheFile(byActor, video, fileRedundancy) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to send file cache of %s.', fileRedundancy.url);
        return sendVideoRelatedCreateActivity({
            byActor,
            video,
            url: fileRedundancy.url,
            object: fileRedundancy.toActivityPubObject()
        });
    });
}
exports.sendCreateCacheFile = sendCreateCacheFile;
function sendCreateVideoPlaylist(playlist, t) {
    return __awaiter(this, void 0, void 0, function* () {
        if (playlist.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE)
            return undefined;
        logger_1.logger.info('Creating job to send create video playlist of %s.', playlist.url);
        const byActor = playlist.OwnerAccount.Actor;
        const audience = audience_1.getAudience(byActor, playlist.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC);
        const object = yield playlist.toActivityPubObject(null, t);
        const createActivity = buildCreateActivity(playlist.url, byActor, object, audience);
        const serverActor = yield utils_2.getServerActor();
        const toFollowersOf = [byActor, serverActor];
        if (playlist.VideoChannel)
            toFollowersOf.push(playlist.VideoChannel.Actor);
        return utils_1.broadcastToFollowers(createActivity, byActor, toFollowersOf, t);
    });
}
exports.sendCreateVideoPlaylist = sendCreateVideoPlaylist;
function sendCreateVideoComment(comment, t) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to send comment %s.', comment.url);
        const isOrigin = comment.Video.isOwned();
        const byActor = comment.Account.Actor;
        const threadParentComments = yield video_comment_1.VideoCommentModel.listThreadParentComments(comment, t);
        const commentObject = comment.toActivityPubObject(threadParentComments);
        const actorsInvolvedInComment = yield audience_1.getActorsInvolvedInVideo(comment.Video, t);
        actorsInvolvedInComment.push(byActor);
        const parentsCommentActors = threadParentComments.map(c => c.Account.Actor);
        let audience;
        if (isOrigin) {
            audience = audience_1.getVideoCommentAudience(comment, threadParentComments, actorsInvolvedInComment, isOrigin);
        }
        else {
            audience = audience_1.getAudienceFromFollowersOf(actorsInvolvedInComment.concat(parentsCommentActors));
        }
        const createActivity = buildCreateActivity(comment.url, byActor, commentObject, audience);
        const actorsException = [byActor];
        yield utils_1.broadcastToActors(createActivity, byActor, parentsCommentActors, t, actorsException);
        yield utils_1.broadcastToFollowers(createActivity, byActor, [byActor], t);
        if (isOrigin)
            return utils_1.broadcastToFollowers(createActivity, byActor, actorsInvolvedInComment, t, actorsException);
        t.afterCommit(() => utils_1.unicastTo(createActivity, byActor, comment.Video.VideoChannel.Account.Actor.getSharedInbox()));
    });
}
exports.sendCreateVideoComment = sendCreateVideoComment;
function buildCreateActivity(url, byActor, object, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    return audience_1.audiencify({
        type: 'Create',
        id: url + '/activity',
        actor: byActor.url,
        object: audience_1.audiencify(object, audience)
    }, audience);
}
exports.buildCreateActivity = buildCreateActivity;
function sendVideoRelatedCreateActivity(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const activityBuilder = (audience) => {
            return buildCreateActivity(options.url, options.byActor, options.object, audience);
        };
        return utils_1.sendVideoRelatedActivity(activityBuilder, options);
    });
}
