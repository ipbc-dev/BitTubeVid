"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoCacheFileActivityPubUrl = exports.getVideoDislikesActivityPubUrl = exports.getVideoLikesActivityPubUrl = exports.getVideoCommentsActivityPubUrl = exports.getVideoSharesActivityPubUrl = exports.getDeleteActivityPubUrl = exports.getVideoCommentActivityPubUrl = exports.getActorFollowRejectActivityPubUrl = exports.getVideoDislikeActivityPubUrl = exports.getVideoLikeActivityPubUrl = exports.getVideoViewActivityPubUrl = exports.getUndoActivityPubUrl = exports.getUpdateActivityPubUrl = exports.getVideoAnnounceActivityPubUrl = exports.getActorFollowAcceptActivityPubUrl = exports.getActorFollowActivityPubUrl = exports.getVideoAbuseActivityPubUrl = exports.getAccountActivityPubUrl = exports.getVideoChannelActivityPubUrl = exports.getVideoCacheStreamingPlaylistActivityPubUrl = exports.getVideoPlaylistActivityPubUrl = exports.getVideoPlaylistElementActivityPubUrl = exports.getVideoActivityPubUrl = void 0;
const constants_1 = require("../../initializers/constants");
function getVideoActivityPubUrl(video) {
    return constants_1.WEBSERVER.URL + '/videos/watch/' + video.uuid;
}
exports.getVideoActivityPubUrl = getVideoActivityPubUrl;
function getVideoPlaylistActivityPubUrl(videoPlaylist) {
    return constants_1.WEBSERVER.URL + '/video-playlists/' + videoPlaylist.uuid;
}
exports.getVideoPlaylistActivityPubUrl = getVideoPlaylistActivityPubUrl;
function getVideoPlaylistElementActivityPubUrl(videoPlaylist, video) {
    return constants_1.WEBSERVER.URL + '/video-playlists/' + videoPlaylist.uuid + '/' + video.uuid;
}
exports.getVideoPlaylistElementActivityPubUrl = getVideoPlaylistElementActivityPubUrl;
function getVideoCacheFileActivityPubUrl(videoFile) {
    const suffixFPS = videoFile.fps && videoFile.fps !== -1 ? '-' + videoFile.fps : '';
    return `${constants_1.WEBSERVER.URL}/redundancy/videos/${videoFile.Video.uuid}/${videoFile.resolution}${suffixFPS}`;
}
exports.getVideoCacheFileActivityPubUrl = getVideoCacheFileActivityPubUrl;
function getVideoCacheStreamingPlaylistActivityPubUrl(video, playlist) {
    return `${constants_1.WEBSERVER.URL}/redundancy/streaming-playlists/${playlist.getStringType()}/${video.uuid}`;
}
exports.getVideoCacheStreamingPlaylistActivityPubUrl = getVideoCacheStreamingPlaylistActivityPubUrl;
function getVideoCommentActivityPubUrl(video, videoComment) {
    return constants_1.WEBSERVER.URL + '/videos/watch/' + video.uuid + '/comments/' + videoComment.id;
}
exports.getVideoCommentActivityPubUrl = getVideoCommentActivityPubUrl;
function getVideoChannelActivityPubUrl(videoChannelName) {
    return constants_1.WEBSERVER.URL + '/video-channels/' + videoChannelName;
}
exports.getVideoChannelActivityPubUrl = getVideoChannelActivityPubUrl;
function getAccountActivityPubUrl(accountName) {
    return constants_1.WEBSERVER.URL + '/accounts/' + accountName;
}
exports.getAccountActivityPubUrl = getAccountActivityPubUrl;
function getVideoAbuseActivityPubUrl(videoAbuse) {
    return constants_1.WEBSERVER.URL + '/admin/video-abuses/' + videoAbuse.id;
}
exports.getVideoAbuseActivityPubUrl = getVideoAbuseActivityPubUrl;
function getVideoViewActivityPubUrl(byActor, video) {
    return byActor.url + '/views/videos/' + video.id + '/' + new Date().toISOString();
}
exports.getVideoViewActivityPubUrl = getVideoViewActivityPubUrl;
function getVideoLikeActivityPubUrl(byActor, video) {
    return byActor.url + '/likes/' + video.id;
}
exports.getVideoLikeActivityPubUrl = getVideoLikeActivityPubUrl;
function getVideoDislikeActivityPubUrl(byActor, video) {
    return byActor.url + '/dislikes/' + video.id;
}
exports.getVideoDislikeActivityPubUrl = getVideoDislikeActivityPubUrl;
function getVideoSharesActivityPubUrl(video) {
    return video.url + '/announces';
}
exports.getVideoSharesActivityPubUrl = getVideoSharesActivityPubUrl;
function getVideoCommentsActivityPubUrl(video) {
    return video.url + '/comments';
}
exports.getVideoCommentsActivityPubUrl = getVideoCommentsActivityPubUrl;
function getVideoLikesActivityPubUrl(video) {
    return video.url + '/likes';
}
exports.getVideoLikesActivityPubUrl = getVideoLikesActivityPubUrl;
function getVideoDislikesActivityPubUrl(video) {
    return video.url + '/dislikes';
}
exports.getVideoDislikesActivityPubUrl = getVideoDislikesActivityPubUrl;
function getActorFollowActivityPubUrl(follower, following) {
    return follower.url + '/follows/' + following.id;
}
exports.getActorFollowActivityPubUrl = getActorFollowActivityPubUrl;
function getActorFollowAcceptActivityPubUrl(actorFollow) {
    const follower = actorFollow.ActorFollower;
    const me = actorFollow.ActorFollowing;
    return follower.url + '/accepts/follows/' + me.id;
}
exports.getActorFollowAcceptActivityPubUrl = getActorFollowAcceptActivityPubUrl;
function getActorFollowRejectActivityPubUrl(follower, following) {
    return follower.url + '/rejects/follows/' + following.id;
}
exports.getActorFollowRejectActivityPubUrl = getActorFollowRejectActivityPubUrl;
function getVideoAnnounceActivityPubUrl(byActor, video) {
    return video.url + '/announces/' + byActor.id;
}
exports.getVideoAnnounceActivityPubUrl = getVideoAnnounceActivityPubUrl;
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
