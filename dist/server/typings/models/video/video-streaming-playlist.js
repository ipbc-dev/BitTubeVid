"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isStreamingPlaylist(value) {
    return !!value.playlistUrl;
}
exports.isStreamingPlaylist = isStreamingPlaylist;
