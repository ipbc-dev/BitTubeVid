"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesVideoPlaylistExist = void 0;
const tslib_1 = require("tslib");
const video_playlist_1 = require("../../models/video/video-playlist");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function doesVideoPlaylistExist(id, res, fetchType = 'summary') {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (fetchType === 'summary') {
            const videoPlaylist = yield video_playlist_1.VideoPlaylistModel.loadWithAccountAndChannelSummary(id, undefined);
            res.locals.videoPlaylistSummary = videoPlaylist;
            return handleVideoPlaylist(videoPlaylist, res);
        }
        const videoPlaylist = yield video_playlist_1.VideoPlaylistModel.loadWithAccountAndChannel(id, undefined);
        res.locals.videoPlaylistFull = videoPlaylist;
        return handleVideoPlaylist(videoPlaylist, res);
    });
}
exports.doesVideoPlaylistExist = doesVideoPlaylistExist;
function handleVideoPlaylist(videoPlaylist, res) {
    if (!videoPlaylist) {
        res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404)
            .json({ error: 'Video playlist not found' })
            .end();
        return false;
    }
    return true;
}
