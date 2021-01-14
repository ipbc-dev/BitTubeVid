"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityPubClientRouter = void 0;
const tslib_1 = require("tslib");
const cors = require("cors");
const express = require("express");
const application_1 = require("@server/models/application/application");
const activitypub_1 = require("../../helpers/activitypub");
const constants_1 = require("../../initializers/constants");
const audience_1 = require("../../lib/activitypub/audience");
const send_1 = require("../../lib/activitypub/send");
const send_create_1 = require("../../lib/activitypub/send/send-create");
const send_dislike_1 = require("../../lib/activitypub/send/send-dislike");
const url_1 = require("../../lib/activitypub/url");
const middlewares_1 = require("../../middlewares");
const cache_1 = require("../../middlewares/cache");
const validators_1 = require("../../middlewares/validators");
const redundancy_1 = require("../../middlewares/validators/redundancy");
const video_playlists_1 = require("../../middlewares/validators/videos/video-playlists");
const account_1 = require("../../models/account/account");
const account_video_rate_1 = require("../../models/account/account-video-rate");
const actor_follow_1 = require("../../models/activitypub/actor-follow");
const video_1 = require("../../models/video/video");
const video_caption_1 = require("../../models/video/video-caption");
const video_comment_1 = require("../../models/video/video-comment");
const video_playlist_1 = require("../../models/video/video-playlist");
const video_share_1 = require("../../models/video/video-share");
const utils_1 = require("./utils");
const activityPubClientRouter = express.Router();
exports.activityPubClientRouter = activityPubClientRouter;
activityPubClientRouter.use(cors());
activityPubClientRouter.get('/accounts?/:name', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), accountController);
activityPubClientRouter.get('/accounts?/:name/followers', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), middlewares_1.asyncMiddleware(accountFollowersController));
activityPubClientRouter.get('/accounts?/:name/following', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), middlewares_1.asyncMiddleware(accountFollowingController));
activityPubClientRouter.get('/accounts?/:name/playlists', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localAccountValidator), middlewares_1.asyncMiddleware(accountPlaylistsController));
activityPubClientRouter.get('/accounts?/:name/likes/:videoId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.getAccountVideoRateValidatorFactory('like')), getAccountVideoRateFactory('like'));
activityPubClientRouter.get('/accounts?/:name/dislikes/:videoId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.getAccountVideoRateValidatorFactory('dislike')), getAccountVideoRateFactory('dislike'));
activityPubClientRouter.get('/videos/watch/:id', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.ACTIVITY_PUB.VIDEOS)), middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video-with-rights')), middlewares_1.asyncMiddleware(videoController));
activityPubClientRouter.get('/videos/watch/:id/activity', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video-with-rights')), middlewares_1.asyncMiddleware(videoController));
activityPubClientRouter.get('/videos/watch/:id/announces', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-immutable-attributes')), middlewares_1.asyncMiddleware(videoAnnouncesController));
activityPubClientRouter.get('/videos/watch/:id/announces/:actorId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosShareValidator), middlewares_1.asyncMiddleware(videoAnnounceController));
activityPubClientRouter.get('/videos/watch/:id/likes', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-immutable-attributes')), middlewares_1.asyncMiddleware(videoLikesController));
activityPubClientRouter.get('/videos/watch/:id/dislikes', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-immutable-attributes')), middlewares_1.asyncMiddleware(videoDislikesController));
activityPubClientRouter.get('/videos/watch/:id/comments', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-immutable-attributes')), middlewares_1.asyncMiddleware(videoCommentsController));
activityPubClientRouter.get('/videos/watch/:videoId/comments/:commentId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.videoCommentGetValidator), middlewares_1.asyncMiddleware(videoCommentController));
activityPubClientRouter.get('/videos/watch/:videoId/comments/:commentId/activity', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(validators_1.videoCommentGetValidator), middlewares_1.asyncMiddleware(videoCommentController));
activityPubClientRouter.get('/video-channels/:name', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localVideoChannelValidator), videoChannelController);
activityPubClientRouter.get('/video-channels/:name/followers', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localVideoChannelValidator), middlewares_1.asyncMiddleware(videoChannelFollowersController));
activityPubClientRouter.get('/video-channels/:name/following', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localVideoChannelValidator), middlewares_1.asyncMiddleware(videoChannelFollowingController));
activityPubClientRouter.get('/video-channels/:name/playlists', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(middlewares_1.localVideoChannelValidator), middlewares_1.asyncMiddleware(videoChannelPlaylistsController));
activityPubClientRouter.get('/redundancy/videos/:videoId/:resolution([0-9]+)(-:fps([0-9]+))?', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(redundancy_1.videoFileRedundancyGetValidator), middlewares_1.asyncMiddleware(videoRedundancyController));
activityPubClientRouter.get('/redundancy/streaming-playlists/:streamingPlaylistType/:videoId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(redundancy_1.videoPlaylistRedundancyGetValidator), middlewares_1.asyncMiddleware(videoRedundancyController));
activityPubClientRouter.get('/video-playlists/:playlistId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsGetValidator('all')), middlewares_1.asyncMiddleware(videoPlaylistController));
activityPubClientRouter.get('/video-playlists/:playlistId/videos/:playlistElementId', middlewares_1.executeIfActivityPub, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistElementAPGetValidator), videoPlaylistElementController);
function accountController(req, res) {
    const account = res.locals.account;
    return utils_1.activityPubResponse(activitypub_1.activityPubContextify(account.toActivityPubObject()), res);
}
function accountFollowersController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const activityPubResult = yield actorFollowers(req, account.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function accountFollowingController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const activityPubResult = yield actorFollowing(req, account.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function accountPlaylistsController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const activityPubResult = yield actorPlaylists(req, { account });
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function videoChannelPlaylistsController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const channel = res.locals.videoChannel;
        const activityPubResult = yield actorPlaylists(req, { channel });
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function getAccountVideoRateFactory(rateType) {
    return (req, res) => {
        const accountVideoRate = res.locals.accountVideoRate;
        const byActor = accountVideoRate.Account.Actor;
        const APObject = rateType === 'like'
            ? send_1.buildLikeActivity(accountVideoRate.url, byActor, accountVideoRate.Video)
            : send_dislike_1.buildDislikeActivity(accountVideoRate.url, byActor, accountVideoRate.Video);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(APObject), res);
    };
}
function videoController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(res.locals.onlyVideoWithRights.id);
        if (redirectIfNotOwned(video.url, res))
            return;
        const captions = yield video_caption_1.VideoCaptionModel.listVideoCaptions(video.id);
        const videoWithCaptions = Object.assign(video, { VideoCaptions: captions });
        const audience = audience_1.getAudience(videoWithCaptions.VideoChannel.Account.Actor, videoWithCaptions.privacy === 1);
        const videoObject = audience_1.audiencify(videoWithCaptions.toActivityPubObject(), audience);
        if (req.path.endsWith('/activity')) {
            const data = send_create_1.buildCreateActivity(videoWithCaptions.url, video.VideoChannel.Account.Actor, videoObject, audience);
            return utils_1.activityPubResponse(activitypub_1.activityPubContextify(data), res);
        }
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(videoObject), res);
    });
}
function videoAnnounceController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const share = res.locals.videoShare;
        if (redirectIfNotOwned(share.url, res))
            return;
        const { activity } = yield send_1.buildAnnounceWithVideoAudience(share.Actor, share, res.locals.videoAll, undefined);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activity, 'Announce'), res);
    });
}
function videoAnnouncesController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyImmutableVideo;
        if (redirectIfNotOwned(video.url, res))
            return;
        const handler = (start, count) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = yield video_share_1.VideoShareModel.listAndCountByVideoId(video.id, start, count);
            return {
                total: result.count,
                data: result.rows.map(r => r.url)
            };
        });
        const json = yield activitypub_1.activityPubCollectionPagination(url_1.getLocalVideoSharesActivityPubUrl(video), handler, req.query.page);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoLikesController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyImmutableVideo;
        if (redirectIfNotOwned(video.url, res))
            return;
        const json = yield videoRates(req, 'like', video, url_1.getLocalVideoLikesActivityPubUrl(video));
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoDislikesController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyImmutableVideo;
        if (redirectIfNotOwned(video.url, res))
            return;
        const json = yield videoRates(req, 'dislike', video, url_1.getLocalVideoDislikesActivityPubUrl(video));
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoCommentsController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyImmutableVideo;
        if (redirectIfNotOwned(video.url, res))
            return;
        const handler = (start, count) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = yield video_comment_1.VideoCommentModel.listAndCountByVideoForAP(video, start, count);
            return {
                total: result.count,
                data: result.rows.map(r => r.url)
            };
        });
        const json = yield activitypub_1.activityPubCollectionPagination(url_1.getLocalVideoCommentsActivityPubUrl(video), handler, req.query.page);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function videoChannelController(req, res) {
    const videoChannel = res.locals.videoChannel;
    return utils_1.activityPubResponse(activitypub_1.activityPubContextify(videoChannel.toActivityPubObject()), res);
}
function videoChannelFollowersController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannel = res.locals.videoChannel;
        const activityPubResult = yield actorFollowers(req, videoChannel.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function videoChannelFollowingController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannel = res.locals.videoChannel;
        const activityPubResult = yield actorFollowing(req, videoChannel.Actor);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(activityPubResult), res);
    });
}
function videoCommentController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoComment = res.locals.videoCommentFull;
        if (redirectIfNotOwned(videoComment.url, res))
            return;
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoRedundancy = res.locals.videoRedundancy;
        if (redirectIfNotOwned(videoRedundancy.url, res))
            return;
        const serverActor = yield application_1.getServerActor();
        const audience = audience_1.getAudience(serverActor);
        const object = audience_1.audiencify(videoRedundancy.toActivityPubObject(), audience);
        if (req.path.endsWith('/activity')) {
            const data = send_create_1.buildCreateActivity(videoRedundancy.url, serverActor, object, audience);
            return utils_1.activityPubResponse(activitypub_1.activityPubContextify(data, 'CacheFile'), res);
        }
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(object, 'CacheFile'), res);
    });
}
function videoPlaylistController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const playlist = res.locals.videoPlaylistFull;
        if (redirectIfNotOwned(playlist.url, res))
            return;
        playlist.OwnerAccount = yield account_1.AccountModel.load(playlist.ownerAccountId);
        const json = yield playlist.toActivityPubObject(req.query.page, null);
        const audience = audience_1.getAudience(playlist.OwnerAccount.Actor, playlist.privacy === 1);
        const object = audience_1.audiencify(json, audience);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(object), res);
    });
}
function videoPlaylistElementController(req, res) {
    const videoPlaylistElement = res.locals.videoPlaylistElementAP;
    if (redirectIfNotOwned(videoPlaylistElement.url, res))
        return;
    const json = videoPlaylistElement.toActivityPubObject();
    return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
}
function actorFollowing(req, actor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const handler = (start, count) => {
            return actor_follow_1.ActorFollowModel.listAcceptedFollowingUrlsForApi([actor.id], undefined, start, count);
        };
        return activitypub_1.activityPubCollectionPagination(constants_1.WEBSERVER.URL + req.path, handler, req.query.page);
    });
}
function actorFollowers(req, actor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const handler = (start, count) => {
            return actor_follow_1.ActorFollowModel.listAcceptedFollowerUrlsForAP([actor.id], undefined, start, count);
        };
        return activitypub_1.activityPubCollectionPagination(constants_1.WEBSERVER.URL + req.path, handler, req.query.page);
    });
}
function actorPlaylists(req, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const handler = (start, count) => {
            return video_playlist_1.VideoPlaylistModel.listPublicUrlsOfForAP(options, start, count);
        };
        return activitypub_1.activityPubCollectionPagination(constants_1.WEBSERVER.URL + req.path, handler, req.query.page);
    });
}
function videoRates(req, rateType, video, url) {
    const handler = (start, count) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield account_video_rate_1.AccountVideoRateModel.listAndCountAccountUrlsByVideoId(rateType, video.id, start, count);
        return {
            total: result.count,
            data: result.rows.map(r => r.url)
        };
    });
    return activitypub_1.activityPubCollectionPagination(url, handler, req.query.page);
}
function redirectIfNotOwned(url, res) {
    if (url.startsWith(constants_1.WEBSERVER.URL) === false) {
        res.redirect(url);
        return true;
    }
    return false;
}
