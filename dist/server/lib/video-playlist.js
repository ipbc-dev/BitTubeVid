"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWatchLaterPlaylist = void 0;
const tslib_1 = require("tslib");
const video_playlist_1 = require("../models/video/video-playlist");
const url_1 = require("./activitypub/url");
function createWatchLaterPlaylist(account, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoPlaylist = new video_playlist_1.VideoPlaylistModel({
            name: 'Watch later',
            privacy: 3,
            type: 2,
            ownerAccountId: account.id
        });
        videoPlaylist.url = url_1.getLocalVideoPlaylistActivityPubUrl(videoPlaylist);
        yield videoPlaylist.save({ transaction: t });
        videoPlaylist.OwnerAccount = account;
        return videoPlaylist;
    });
}
exports.createWatchLaterPlaylist = createWatchLaterPlaylist;
