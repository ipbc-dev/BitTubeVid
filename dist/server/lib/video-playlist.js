"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWatchLaterPlaylist = void 0;
const tslib_1 = require("tslib");
const video_playlist_1 = require("../models/video/video-playlist");
const video_playlist_privacy_model_1 = require("../../shared/models/videos/playlist/video-playlist-privacy.model");
const url_1 = require("./activitypub/url");
const video_playlist_type_model_1 = require("../../shared/models/videos/playlist/video-playlist-type.model");
function createWatchLaterPlaylist(account, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoPlaylist = new video_playlist_1.VideoPlaylistModel({
            name: 'Watch later',
            privacy: video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE,
            type: video_playlist_type_model_1.VideoPlaylistType.WATCH_LATER,
            ownerAccountId: account.id
        });
        videoPlaylist.url = url_1.getVideoPlaylistActivityPubUrl(videoPlaylist);
        yield videoPlaylist.save({ transaction: t });
        videoPlaylist.OwnerAccount = account;
        return videoPlaylist;
    });
}
exports.createWatchLaterPlaylist = createWatchLaterPlaylist;
