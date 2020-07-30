"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStreamingPlaylist = void 0;
function isStreamingPlaylist(value) {
    return !!value.playlistUrl;
}
exports.isStreamingPlaylist = isStreamingPlaylist;
