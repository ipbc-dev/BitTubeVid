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
const video_playlist_1 = require("../../models/video/video-playlist");
function doesVideoPlaylistExist(id, res, fetchType = 'summary') {
    return __awaiter(this, void 0, void 0, function* () {
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
        res.status(404)
            .json({ error: 'Video playlist not found' })
            .end();
        return false;
    }
    return true;
}
