"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isStreamingPlaylistFile(file) {
    return !!file.videoStreamingPlaylistId;
}
exports.isStreamingPlaylistFile = isStreamingPlaylistFile;
function isWebtorrentFile(file) {
    return !!file.videoId;
}
exports.isWebtorrentFile = isWebtorrentFile;
