"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadRouter = void 0;
const tslib_1 = require("tslib");
const cors = require("cors");
const express = require("express");
const videos_torrent_cache_1 = require("@server/lib/files-cache/videos-torrent-cache");
const video_paths_1 = require("@server/lib/video-paths");
const http_error_codes_1 = require("@shared/core-utils/miscs/http-error-codes");
const constants_1 = require("../initializers/constants");
const middlewares_1 = require("../middlewares");
const downloadRouter = express.Router();
exports.downloadRouter = downloadRouter;
downloadRouter.use(cors());
downloadRouter.use(constants_1.STATIC_DOWNLOAD_PATHS.TORRENTS + ':filename', downloadTorrent);
downloadRouter.use(constants_1.STATIC_DOWNLOAD_PATHS.VIDEOS + ':id-:resolution([0-9]+).:extension', middlewares_1.asyncMiddleware(middlewares_1.videosDownloadValidator), downloadVideoFile);
downloadRouter.use(constants_1.STATIC_DOWNLOAD_PATHS.HLS_VIDEOS + ':id-:resolution([0-9]+)-fragmented.:extension', middlewares_1.asyncMiddleware(middlewares_1.videosDownloadValidator), downloadHLSVideoFile);
function downloadTorrent(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield videos_torrent_cache_1.VideosTorrentCache.Instance.getFilePath(req.params.filename);
        if (!result)
            return res.sendStatus(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
        return res.download(result.path, result.downloadName);
    });
}
function downloadVideoFile(req, res) {
    const video = res.locals.videoAll;
    const videoFile = getVideoFile(req, video.VideoFiles);
    if (!videoFile)
        return res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404).end();
    return res.download(video_paths_1.getVideoFilePath(video, videoFile), `${video.name}-${videoFile.resolution}p${videoFile.extname}`);
}
function downloadHLSVideoFile(req, res) {
    const video = res.locals.videoAll;
    const playlist = getHLSPlaylist(video);
    if (!playlist)
        return res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404).end;
    const videoFile = getVideoFile(req, playlist.VideoFiles);
    if (!videoFile)
        return res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404).end();
    const filename = `${video.name}-${videoFile.resolution}p-${playlist.getStringType()}${videoFile.extname}`;
    return res.download(video_paths_1.getVideoFilePath(playlist, videoFile), filename);
}
function getVideoFile(req, files) {
    const resolution = parseInt(req.params.resolution, 10);
    return files.find(f => f.resolution === resolution);
}
function getHLSPlaylist(video) {
    const playlist = video.VideoStreamingPlaylists.find(p => p.type === 1);
    if (!playlist)
        return undefined;
    return Object.assign(playlist, { Video: video });
}
