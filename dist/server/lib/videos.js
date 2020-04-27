"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@server/typings/models");
function extractVideo(videoOrPlaylist) {
    return models_1.isStreamingPlaylist(videoOrPlaylist)
        ? videoOrPlaylist.Video
        : videoOrPlaylist;
}
exports.extractVideo = extractVideo;
