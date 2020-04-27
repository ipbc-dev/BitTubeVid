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
const middlewares_1 = require("../../../middlewares");
const video_playlists_1 = require("../../../middlewares/validators/videos/video-playlists");
const video_playlist_1 = require("../../../models/video/video-playlist");
const myVideoPlaylistsRouter = express.Router();
exports.myVideoPlaylistsRouter = myVideoPlaylistsRouter;
myVideoPlaylistsRouter.get('/me/video-playlists/videos-exist', middlewares_1.authenticate, video_playlists_1.doVideosInPlaylistExistValidator, middlewares_1.asyncMiddleware(doVideosInPlaylistExist));
function doVideosInPlaylistExist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoIds = req.query.videoIds.map(i => parseInt(i + '', 10));
        const user = res.locals.oauth.token.User;
        const results = yield video_playlist_1.VideoPlaylistModel.listPlaylistIdsOf(user.Account.id, videoIds);
        const existObject = {};
        for (const videoId of videoIds) {
            existObject[videoId] = [];
        }
        for (const result of results) {
            for (const element of result.VideoPlaylistElements) {
                existObject[element.videoId].push({
                    playlistElementId: element.id,
                    playlistId: result.id,
                    startTimestamp: element.startTimestamp,
                    stopTimestamp: element.stopTimestamp
                });
            }
        }
        return res.json(existObject);
    });
}
