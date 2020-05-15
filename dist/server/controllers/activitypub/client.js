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
const express = require("express");
const videos_1 = require("../../../shared/models/videos");
const activitypub_1 = require("../../helpers/activitypub");
const constants_1 = require("../../initializers/constants");
const send_1 = require("../../lib/activitypub/send");
const audience_1 = require("../../lib/activitypub/audience");
const send_create_1 = require("../../lib/activitypub/send/send-create");
const middlewares_1 = require("../../middlewares");
const validators_1 = require("../../middlewares/validators");
const account_1 = require("../../models/account/account");
const actor_follow_1 = require("../../models/activitypub/actor-follow");
const video_1 = require("../../models/video/video");
const video_comment_1 = require("../../models/video/video-comment");
const video_share_1 = require("../../models/video/video-share");
const cache_1 = require("../../middlewares/cache");
const utils_1 = require("./utils");
const account_video_rate_1 = require("../../models/account/account-video-rate");
const activitypub_2 = require("../../lib/activitypub");
const video_caption_1 = require("../../models/video/video-caption");
const redundancy_1 = require("../../middlewares/validators/redundancy");
const utils_2 = require("../../helpers/utils");
const send_dislike_1 = require("../../lib/activitypub/send/send-dislike");
const video_playlists_1 = require("../../middlewares/validators/videos/video-playlists");
const video_playlist_1 = require("../../models/video/video-playlist");
const video_playlist_privacy_model_1 = require("../../../shared/models/videos/playlist/video-playlist-privacy.model");
const activityPubClientRouter = express.Router();
exports.activityPubClientRouter = activityPubClientRouter;
activityPubClientRouter.get('/accounts?/:name', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), accountController);
activityPubClientRouter.get('/accounts?/:name/followers', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), middlewares_1.asyncMiddleware(accountFollowersController));
activityPubClientRouter.get('/accounts?/:name/following', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), middlewares_1.asyncMiddleware(accountFollowingController));
activityPubClientRouter.get('/accounts?/:name/playlists', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), middlewares_1.asyncMiddleware(accountPlaylistsController));
activityPubClientRouter.get('/accounts?/:name/likes/:videoId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.getAccountVideoRateValidator('like')), getAccountVideoRate('like'));
activityPubClientRouter.get('/accounts?/:name/dislikes/:videoId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.getAccountVideoRateValidator('dislike')), getAccountVideoRate('dislike'));
activityPubClientRouter.get('/videos/watch/:id', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.ACTIVITY_PUB.VIDEOS)), middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video-with-rights')), middlewares_1.asyncMiddleware(videoController));
activityPubClientRouter.get('/videos/watch/:id/activity', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video-with-rights')), middlewares_1.asyncMiddleware(videoController));
activityPubClientRouter.get('/videos/watch/:id/announces', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video')), middlewares_1.asyncMiddleware(videoAnnouncesController));
activityPubClientRouter.get('/videos/watch/:id/announces/:actorId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosShareValidator), middlewares_1.asyncMiddleware(videoAnnounceController));
activityPubClientRouter.get('/videos/watch/:id/likes', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video')), middlewares_1.asyncMiddleware(videoLikesController));
activityPubClientRouter.get('/videos/watch/:id/dislikes', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video')), middlewares_1.asyncMiddleware(videoDislikesController));
activityPubClientRouter.get('/videos/watch/:id/comments', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video')), middlewares_1.asyncMiddleware(videoCommentsController));
activityPubClientRouter.get('/videos/watch/:videoId/comments/:commentId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.videoCommentGetValidator), middlewares_1.asyncMiddleware(videoCommentController));
activityPubClientRouter.get('/videos/watch/:videoId/comments/:commentId/activity', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.videoCommentGetValidator), middlewares_1.asyncMiddleware(videoCommentController));
activityPubClientRouter.get('/video-channels/:name', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localVideoChannelValidator), middlewares_1.asyncMiddleware(videoChannelController));
activityPubClientRouter.get('/video-channels/:name/followers', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localVideoChannelValidator), middlewares_1.asyncMiddleware(videoChannelFollowersController));
activityPubClientRouter.get('/video-channels/:name/following', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localVideoChannelValidator), middlewares_1.asyncMiddleware(videoChannelFollowingController));
activityPubClientRouter.get('/redundancy/videos/:videoId/:resolution([0-9]+)(-:fps([0-9]+))?', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(redundancy_1.videoFileRedundancyGetValidator), middlewares_1.asyncMiddleware(videoRedundancyController));
activityPubClientRouter.get('/redundancy/streaming-playlists/:streamingPlaylistType/:videoId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(redundancy_1.videoPlaylistRedundancyGetValidator), middlewares_1.asyncMiddleware(videoRedundancyController));
activityPubClientRouter.get('/video-playlists/:playlistId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsGetValidator('all')), middlewares_1.asyncMiddleware(videoPlaylistController));
activityPubClientRouter.get('/video-playlists/:playlistId/:videoId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistElementAPGetValidator), middlewares_1.asyncMiddleware(videoPlaylistElementController));
function accountController(req, res) {
    const account = res.locals.account;
    return utils_1.activityPubResponse(activitypub_1.activityPubContextify(account.toActivityPubObject()), res);
}
function accountFollowersController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const activityPubResult = yield actorFollowers(req, account.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function accountFollowingController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const activityPubResult = yield actorFollowing(req, account.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function accountPlaylistsController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const activityPubResult = yield actorPlaylists(req, account);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function getAccountVideoRate(rateType) {
    return (req, res) => {
        const accountVideoRate = res.locals.accountVideoRate;
        const byActor = accountVideoRate.Account.Actor;
        const url = activitypub_2.getRateUrl(rateType, byActor, accountVideoRate.Video);
        const APObject = rateType === 'like'
            ? send_1.buildLikeActivity(url, byActor, accountVideoRate.Video)
            : send_dislike_1.buildDislikeActivity(url, byActor, accountVideoRate.Video);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(APObject), res);
    };
}
function videoController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = yield video_1.VideoModel.loadForGetAPI({ id: res.locals.onlyVideoWithRights.id });
        if (video.url.startsWith(constants_1.WEBSERVER.URL) === false)
            return res.redirect(video.url);
        const captions = yield video_caption_1.VideoCaptionModel.listVideoCaptions(video.id);
        const videoWithCaptions = Object.assign(video, { VideoCaptions: captions });
        const audience = audience_1.getAudience(videoWithCaptions.VideoChannel.Account.Actor, videoWithCaptions.privacy === videos_1.VideoPrivacy.PUBLIC);
        const videoObject = audience_1.audiencify(videoWithCaptions.toActivityPubObject(), audience);
        if (req.path.endsWith('/activity')) {
            const data = send_create_1.buildCreateActivity(videoWithCaptions.url, video.VideoChannel.Account.Actor, videoObject, audience);
            return utils_1.activityPubResponse(activitypub_1.activityPubContextify(data), res);
        }
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(videoObject), res);
    });
}
function videoAnnounceController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const share = res.locals.videoShare;
        if (share.url.startsWith(constants_1.WEBSERVER.URL) === false)
            return res.redirect(share.url);
        const { activity } = yield send_1.buildAnnounceWithVideoAudience(share.Actor, share, res.locals.videoAll, undefined);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activity), res);
    });
}
function videoAnnouncesController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const handler = (start, count) => __awaiter(this, void 0, void 0, function* () {
            const result = yield video_share_1.VideoShareModel.listAndCountByVideoId(video.id, start, count);
            return {
                total: result.count,
                data: result.rows.map(r => r.url)
            };
        });
        const json = yield activitypub_1.activityPubCollectionPagination(activitypub_2.getVideoSharesActivityPubUrl(video), handler, req.query.page);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoLikesController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const json = yield videoRates(req, 'like', video, activitypub_2.getVideoLikesActivityPubUrl(video));
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoDislikesController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const json = yield videoRates(req, 'dislike', video, activitypub_2.getVideoDislikesActivityPubUrl(video));
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoCommentsController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const handler = (start, count) => __awaiter(this, void 0, void 0, function* () {
            const result = yield video_comment_1.VideoCommentModel.listAndCountByVideoId(video.id, start, count);
            return {
                total: result.count,
                data: result.rows.map(r => r.url)
            };
        });
        const json = yield activitypub_1.activityPubCollectionPagination(activitypub_2.getVideoCommentsActivityPubUrl(video), handler, req.query.page);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoChannelController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoChannel = res.locals.videoChannel;
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(videoChannel.toActivityPubObject()), res);
    });
}
function videoChannelFollowersController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoChannel = res.locals.videoChannel;
        const activityPubResult = yield actorFollowers(req, videoChannel.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function videoChannelFollowingController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoChannel = res.locals.videoChannel;
        const activityPubResult = yield actorFollowing(req, videoChannel.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function videoCommentController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoComment = res.locals.videoCommentFull;
        if (videoComment.url.startsWith(constants_1.WEBSERVER.URL) === false)
            return res.redirect(videoComment.url);
        const threadParentComments = yield video_comment_1.VideoCommentModel.listThreadParentComments(videoComment, undefined);
        const isPublic = true;
        let videoCommentObject = videoComment.toActivityPubObject(threadParentComments);
        if (videoComment.Account) {
            const audience = audience_1.getAudience(videoComment.Account.Actor, isPublic);
            videoCommentObject = audience_1.audiencify(videoCommentObject, audience);
            if (req.path.endsWith('/activity')) {
                const data = send_create_1.buildCreateActivity(videoComment.url, videoComment.Account.Actor, videoCommentObject, audience);
                return utils_1.activityPubResponse(activitypub_1.activityPubContextify(data), res);
            }
        }
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(videoCommentObject), res);
    });
}
function videoRedundancyController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoRedundancy = res.locals.videoRedundancy;
        if (videoRedundancy.url.startsWith(constants_1.WEBSERVER.URL) === false)
            return res.redirect(videoRedundancy.url);
        const serverActor = yield utils_2.getServerActor();
        const audience = audience_1.getAudience(serverActor);
        const object = audience_1.audiencify(videoRedundancy.toActivityPubObject(), audience);
        if (req.path.endsWith('/activity')) {
            const data = send_create_1.buildCreateActivity(videoRedundancy.url, serverActor, object, audience);
            return utils_1.activityPubResponse(activitypub_1.activityPubContextify(data), res);
        }
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(object), res);
    });
}
function videoPlaylistController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const playlist = res.locals.videoPlaylistFull;
        playlist.OwnerAccount = yield account_1.AccountModel.load(playlist.ownerAccountId);
        const json = yield playlist.toActivityPubObject(req.query.page, null);
        const audience = audience_1.getAudience(playlist.OwnerAccount.Actor, playlist.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC);
        const object = audience_1.audiencify(json, audience);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(object), res);
    });
}
function videoPlaylistElementController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylistElement = res.locals.videoPlaylistElementAP;
        const json = videoPlaylistElement.toActivityPubObject();
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function actorFollowing(req, actor) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = (start, count) => {
            return actor_follow_1.ActorFollowModel.listAcceptedFollowingUrlsForApi([actor.id], undefined, start, count);
        };
        return activitypub_1.activityPubCollectionPagination(constants_1.WEBSERVER.URL + req.path, handler, req.query.page);
    });
}
function actorFollowers(req, actor) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = (start, count) => {
            return actor_follow_1.ActorFollowModel.listAcceptedFollowerUrlsForAP([actor.id], undefined, start, count);
        };
        return activitypub_1.activityPubCollectionPagination(constants_1.WEBSERVER.URL + req.path, handler, req.query.page);
    });
}
function actorPlaylists(req, account) {
    return __awaiter(this, void 0, void 0, function* () {
        const handler = (start, count) => {
            return video_playlist_1.VideoPlaylistModel.listPublicUrlsOfForAP(account.id, start, count);
        };
        return activitypub_1.activityPubCollectionPagination(constants_1.WEBSERVER.URL + req.path, handler, req.query.page);
    });
}
function videoRates(req, rateType, video, url) {
    const handler = (start, count) => __awaiter(this, void 0, void 0, function* () {
        const result = yield account_video_rate_1.AccountVideoRateModel.listAndCountAccountUrlsByVideoId(rateType, video.id, start, count);
        return {
            total: result.count,
            data: result.rows.map(r => r.url)
        };
    });
    return activitypub_1.activityPubCollectionPagination(url, handler, req.query.page);
}
