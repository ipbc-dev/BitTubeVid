"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebtorrentFile = exports.isStreamingPlaylistFile = void 0;
function isStreamingPlaylistFile(file) {
    return !!file.videoStreamingPlaylistId;
}
exports.isStreamingPlaylistFile = isStreamingPlaylistFile;
function isWebtorrentFile(file) {
    return !!file.videoId;
}
exports.isWebtorrentFile = isWebtorrentFile;
