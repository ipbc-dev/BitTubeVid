"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalVideoDislikesActivityPubUrl = exports.getLocalVideoLikesActivityPubUrl = exports.getLocalVideoCommentsActivityPubUrl = exports.getLocalVideoSharesActivityPubUrl = exports.getDeleteActivityPubUrl = exports.getLocalActorFollowRejectActivityPubUrl = exports.getVideoDislikeActivityPubUrlByLocalActor = exports.getLocalVideoViewActivityPubUrl = exports.getVideoLikeActivityPubUrlByLocalActor = exports.getUndoActivityPubUrl = exports.getUpdateActivityPubUrl = exports.getLocalVideoAnnounceActivityPubUrl = exports.getLocalActorFollowAcceptActivityPubUrl = exports.getLocalActorFollowActivityPubUrl = exports.getLocalAbuseActivityPubUrl = exports.getLocalAccountActivityPubUrl = exports.getLocalVideoChannelActivityPubUrl = exports.getLocalVideoCommentActivityPubUrl = exports.getLocalVideoCacheStreamingPlaylistActivityPubUrl = exports.getLocalVideoCacheFileActivityPubUrl = exports.getLocalVideoPlaylistElementActivityPubUrl = exports.getLocalVideoPlaylistActivityPubUrl = exports.getLocalVideoActivityPubUrl = void 0;
const constants_1 = require("../../initializers/constants");
function getLocalVideoActivityPubUrl(video) {
    return constants_1.WEBSERVER.URL + '/videos/watch/' + video.uuid;
}
exports.getLocalVideoActivityPubUrl = getLocalVideoActivityPubUrl;
function getLocalVideoPlaylistActivityPubUrl(videoPlaylist) {
    return constants_1.WEBSERVER.URL + '/video-playlists/' + videoPlaylist.uuid;
}
exports.getLocalVideoPlaylistActivityPubUrl = getLocalVideoPlaylistActivityPubUrl;
function getLocalVideoPlaylistElementActivityPubUrl(videoPlaylist, videoPlaylistElement) {
    return constants_1.WEBSERVER.URL + '/video-playlists/' + videoPlaylist.uuid + '/videos/' + videoPlaylistElement.id;
}
exports.getLocalVideoPlaylistElementActivityPubUrl = getLocalVideoPlaylistElementActivityPubUrl;
function getLocalVideoCacheFileActivityPubUrl(videoFile) {
    const suffixFPS = videoFile.fps && videoFile.fps !== -1 ? '-' + videoFile.fps : '';
    return `${constants_1.WEBSERVER.URL}/redundancy/videos/${videoFile.Video.uuid}/${videoFile.resolution}${suffixFPS}`;
}
exports.getLocalVideoCacheFileActivityPubUrl = getLocalVideoCacheFileActivityPubUrl;
function getLocalVideoCacheStreamingPlaylistActivityPubUrl(video, playlist) {
    return `${constants_1.WEBSERVER.URL}/redundancy/streaming-playlists/${playlist.getStringType()}/${video.uuid}`;
}
exports.getLocalVideoCacheStreamingPlaylistActivityPubUrl = getLocalVideoCacheStreamingPlaylistActivityPubUrl;
function getLocalVideoCommentActivityPubUrl(video, videoComment) {
    return constants_1.WEBSERVER.URL + '/videos/watch/' + video.uuid + '/comments/' + videoComment.id;
}
exports.getLocalVideoCommentActivityPubUrl = getLocalVideoCommentActivityPubUrl;
function getLocalVideoChannelActivityPubUrl(videoChannelName) {
    return constants_1.WEBSERVER.URL + '/video-channels/' + videoChannelName;
}
exports.getLocalVideoChannelActivityPubUrl = getLocalVideoChannelActivityPubUrl;
function getLocalAccountActivityPubUrl(accountName) {
    return constants_1.WEBSERVER.URL + '/accounts/' + accountName;
}
exports.getLocalAccountActivityPubUrl = getLocalAccountActivityPubUrl;
function getLocalAbuseActivityPubUrl(abuse) {
    return constants_1.WEBSERVER.URL + '/admin/abuses/' + abuse.id;
}
exports.getLocalAbuseActivityPubUrl = getLocalAbuseActivityPubUrl;
function getLocalVideoViewActivityPubUrl(byActor, video) {
    return byActor.url + '/views/videos/' + video.id + '/' + new Date().toISOString();
}
exports.getLocalVideoViewActivityPubUrl = getLocalVideoViewActivityPubUrl;
function getVideoLikeActivityPubUrlByLocalActor(byActor, video) {
    return byActor.url + '/likes/' + video.id;
}
exports.getVideoLikeActivityPubUrlByLocalActor = getVideoLikeActivityPubUrlByLocalActor;
function getVideoDislikeActivityPubUrlByLocalActor(byActor, video) {
    return byActor.url + '/dislikes/' + video.id;
}
exports.getVideoDislikeActivityPubUrlByLocalActor = getVideoDislikeActivityPubUrlByLocalActor;
function getLocalVideoSharesActivityPubUrl(video) {
    return video.url + '/announces';
}
exports.getLocalVideoSharesActivityPubUrl = getLocalVideoSharesActivityPubUrl;
function getLocalVideoCommentsActivityPubUrl(video) {
    return video.url + '/comments';
}
exports.getLocalVideoCommentsActivityPubUrl = getLocalVideoCommentsActivityPubUrl;
function getLocalVideoLikesActivityPubUrl(video) {
    return video.url + '/likes';
}
exports.getLocalVideoLikesActivityPubUrl = getLocalVideoLikesActivityPubUrl;
function getLocalVideoDislikesActivityPubUrl(video) {
    return video.url + '/dislikes';
}
exports.getLocalVideoDislikesActivityPubUrl = getLocalVideoDislikesActivityPubUrl;
function getLocalActorFollowActivityPubUrl(follower, following) {
    return follower.url + '/follows/' + following.id;
}
exports.getLocalActorFollowActivityPubUrl = getLocalActorFollowActivityPubUrl;
function getLocalActorFollowAcceptActivityPubUrl(actorFollow) {
    const follower = actorFollow.ActorFollower;
    const me = actorFollow.ActorFollowing;
    return constants_1.WEBSERVER.URL + '/accepts/follows/' + follower.id + '/' + me.id;
}
exports.getLocalActorFollowAcceptActivityPubUrl = getLocalActorFollowAcceptActivityPubUrl;
function getLocalActorFollowRejectActivityPubUrl(follower, following) {
    return constants_1.WEBSERVER.URL + '/rejects/follows/' + follower.id + '/' + following.id;
}
exports.getLocalActorFollowRejectActivityPubUrl = getLocalActorFollowRejectActivityPubUrl;
function getLocalVideoAnnounceActivityPubUrl(byActor, video) {
    return video.url + '/announces/' + byActor.id;
}
exports.getLocalVideoAnnounceActivityPubUrl = getLocalVideoAnnounceActivityPubUrl;
function getDeleteActivityPubUrl(originalUrl) {
    return originalUrl + '/delete';
}
exports.getDeleteActivityPubUrl = getDeleteActivityPubUrl;
function getUpdateActivityPubUrl(originalUrl, updatedAt) {
    return originalUrl + '/updates/' + updatedAt;
}
exports.getUpdateActivityPubUrl = getUpdateActivityPubUrl;
function getUndoActivityPubUrl(originalUrl) {
    return originalUrl + '/undo';
}
exports.getUndoActivityPubUrl = getUndoActivityPubUrl;
