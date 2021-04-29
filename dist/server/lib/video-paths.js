"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHLSRedundancyUrl = exports.generateWebTorrentRedundancyUrl = exports.getLocalVideoFileMetadataUrl = exports.getHLSDirectory = exports.getTorrentFilePath = exports.generateTorrentFileName = exports.getVideoFilePath = exports.generateVideoFilename = exports.generateWebTorrentVideoName = exports.generateVideoStreamingPlaylistName = void 0;
const path_1 = require("path");
const video_1 = require("@server/helpers/video");
const config_1 = require("@server/initializers/config");
const constants_1 = require("@server/initializers/constants");
const models_1 = require("@server/types/models");
function generateVideoFilename(videoOrPlaylist, isHls, resolution, extname) {
    const video = video_1.extractVideo(videoOrPlaylist);
    const uuid = video.uuid;
    if (isHls) {
        return generateVideoStreamingPlaylistName(uuid, resolution);
    }
    return generateWebTorrentVideoName(uuid, resolution, extname);
}
exports.generateVideoFilename = generateVideoFilename;
function generateVideoStreamingPlaylistName(uuid, resolution) {
    return `${uuid}-${resolution}-fragmented.mp4`;
}
exports.generateVideoStreamingPlaylistName = generateVideoStreamingPlaylistName;
function generateWebTorrentVideoName(uuid, resolution, extname) {
    return uuid + '-' + resolution + extname;
}
exports.generateWebTorrentVideoName = generateWebTorrentVideoName;
function getVideoFilePath(videoOrPlaylist, videoFile, isRedundancy = false) {
    if (videoFile.isHLS()) {
        const video = video_1.extractVideo(videoOrPlaylist);
        return path_1.join(getHLSDirectory(video), videoFile.filename);
    }
    const baseDir = isRedundancy
        ? config_1.CONFIG.STORAGE.REDUNDANCY_DIR
        : config_1.CONFIG.STORAGE.VIDEOS_DIR;
    return path_1.join(baseDir, videoFile.filename);
}
exports.getVideoFilePath = getVideoFilePath;
function generateHLSRedundancyUrl(video, playlist) {
    return constants_1.WEBSERVER.URL + constants_1.STATIC_PATHS.REDUNDANCY + playlist.getStringType() + '/' + video.uuid;
}
exports.generateHLSRedundancyUrl = generateHLSRedundancyUrl;
function generateWebTorrentRedundancyUrl(file) {
    return constants_1.WEBSERVER.URL + constants_1.STATIC_PATHS.REDUNDANCY + file.filename;
}
exports.generateWebTorrentRedundancyUrl = generateWebTorrentRedundancyUrl;
function getHLSDirectory(video, isRedundancy = false) {
    const baseDir = isRedundancy
        ? constants_1.HLS_REDUNDANCY_DIRECTORY
        : constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY;
    return path_1.join(baseDir, video.uuid);
}
exports.getHLSDirectory = getHLSDirectory;
function generateTorrentFileName(videoOrPlaylist, resolution) {
    const video = video_1.extractVideo(videoOrPlaylist);
    const extension = '.torrent';
    const uuid = video.uuid;
    if (models_1.isStreamingPlaylist(videoOrPlaylist)) {
        return `${uuid}-${resolution}-${videoOrPlaylist.getStringType()}${extension}`;
    }
    return uuid + '-' + resolution + extension;
}
exports.generateTorrentFileName = generateTorrentFileName;
function getTorrentFilePath(videoFile) {
    return path_1.join(config_1.CONFIG.STORAGE.TORRENTS_DIR, videoFile.torrentFilename);
}
exports.getTorrentFilePath = getTorrentFilePath;
function getLocalVideoFileMetadataUrl(video, videoFile) {
    const path = '/api/v1/videos/';
    return constants_1.WEBSERVER.URL + path + video.uuid + '/metadata/' + videoFile.id;
}
exports.getLocalVideoFileMetadataUrl = getLocalVideoFileMetadataUrl;
