"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHLSDirectory = exports.getTorrentFilePath = exports.getTorrentFileName = exports.getInputVideoFilePath = exports.getVideoFilePath = exports.getVideoFilename = exports.generateWebTorrentVideoName = exports.generateVideoStreamingPlaylistName = void 0;
const models_1 = require("@server/types/models");
const path_1 = require("path");
const config_1 = require("@server/initializers/config");
const constants_1 = require("@server/initializers/constants");
const video_1 = require("@server/helpers/video");
function getVideoFilename(videoOrPlaylist, videoFile) {
    const video = video_1.extractVideo(videoOrPlaylist);
    if (models_1.isStreamingPlaylist(videoOrPlaylist)) {
        return generateVideoStreamingPlaylistName(video.uuid, videoFile.resolution);
    }
    return generateWebTorrentVideoName(video.uuid, videoFile.resolution, videoFile.extname);
}
exports.getVideoFilename = getVideoFilename;
function generateVideoStreamingPlaylistName(uuid, resolution) {
    return `${uuid}-${resolution}-fragmented.mp4`;
}
exports.generateVideoStreamingPlaylistName = generateVideoStreamingPlaylistName;
function generateWebTorrentVideoName(uuid, resolution, extname) {
    return uuid + '-' + resolution + extname;
}
exports.generateWebTorrentVideoName = generateWebTorrentVideoName;
function getVideoFilePath(videoOrPlaylist, videoFile, isRedundancy = false) {
    if (models_1.isStreamingPlaylist(videoOrPlaylist)) {
        const video = video_1.extractVideo(videoOrPlaylist);
        return path_1.join(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, video.uuid, getVideoFilename(videoOrPlaylist, videoFile));
    }
    const baseDir = isRedundancy ? config_1.CONFIG.STORAGE.REDUNDANCY_DIR : config_1.CONFIG.STORAGE.VIDEOS_DIR;
    return path_1.join(baseDir, getVideoFilename(videoOrPlaylist, videoFile));
}
exports.getVideoFilePath = getVideoFilePath;
function getInputVideoFilePath(videoOrPlaylist, videoFile, isRedundancy = false) {
    const baseDir = config_1.CONFIG.STORAGE.TMP_DIR;
    return path_1.join(baseDir, getVideoFilename(videoOrPlaylist, videoFile));
}
exports.getInputVideoFilePath = getInputVideoFilePath;
function getHLSDirectory(video, isRedundancy = false) {
    const baseDir = isRedundancy ? constants_1.HLS_REDUNDANCY_DIRECTORY : constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY;
    return path_1.join(baseDir, video.uuid);
}
exports.getHLSDirectory = getHLSDirectory;
function getTorrentFileName(videoOrPlaylist, videoFile) {
    const video = video_1.extractVideo(videoOrPlaylist);
    const extension = '.torrent';
    if (models_1.isStreamingPlaylist(videoOrPlaylist)) {
        return `${video.uuid}-${videoFile.resolution}-${videoOrPlaylist.getStringType()}${extension}`;
    }
    return video.uuid + '-' + videoFile.resolution + extension;
}
exports.getTorrentFileName = getTorrentFileName;
function getTorrentFilePath(videoOrPlaylist, videoFile) {
    return path_1.join(config_1.CONFIG.STORAGE.TORRENTS_DIR, getTorrentFileName(videoOrPlaylist, videoFile));
}
exports.getTorrentFilePath = getTorrentFilePath;
