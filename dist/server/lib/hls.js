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
const path_1 = require("path");
const constants_1 = require("../initializers/constants");
const fs_extra_1 = require("fs-extra");
const ffmpeg_utils_1 = require("../helpers/ffmpeg-utils");
const core_utils_1 = require("../helpers/core-utils");
const video_streaming_playlist_1 = require("../models/video/video-streaming-playlist");
const logger_1 = require("../helpers/logger");
const requests_1 = require("../helpers/requests");
const utils_1 = require("../helpers/utils");
const lodash_1 = require("lodash");
const video_file_1 = require("../models/video/video-file");
const config_1 = require("../initializers/config");
const database_1 = require("../initializers/database");
const video_paths_1 = require("./video-paths");
function updateStreamingPlaylistsInfohashesIfNeeded() {
    return __awaiter(this, void 0, void 0, function* () {
        const playlistsToUpdate = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.listByIncorrectPeerVersion();
        for (const playlist of playlistsToUpdate) {
            yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                const videoFiles = yield video_file_1.VideoFileModel.listByStreamingPlaylist(playlist.id, t);
                playlist.p2pMediaLoaderInfohashes = video_streaming_playlist_1.VideoStreamingPlaylistModel.buildP2PMediaLoaderInfoHashes(playlist.playlistUrl, videoFiles);
                playlist.p2pMediaLoaderPeerVersion = constants_1.P2P_MEDIA_LOADER_PEER_VERSION;
                yield playlist.save({ transaction: t });
            }));
        }
    });
}
exports.updateStreamingPlaylistsInfohashesIfNeeded = updateStreamingPlaylistsInfohashesIfNeeded;
function updateMasterHLSPlaylist(video) {
    return __awaiter(this, void 0, void 0, function* () {
        const directory = path_1.join(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, video.uuid);
        const masterPlaylists = ['#EXTM3U', '#EXT-X-VERSION:3'];
        const masterPlaylistPath = path_1.join(directory, video_streaming_playlist_1.VideoStreamingPlaylistModel.getMasterHlsPlaylistFilename());
        const streamingPlaylist = video.getHLSPlaylist();
        for (const file of streamingPlaylist.VideoFiles) {
            const filePlaylistPath = path_1.join(directory, video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsPlaylistFilename(file.resolution));
            if ((yield fs_extra_1.pathExists(filePlaylistPath)) === false)
                continue;
            const videoFilePath = video_paths_1.getVideoFilePath(streamingPlaylist, file);
            const size = yield ffmpeg_utils_1.getVideoStreamSize(videoFilePath);
            const bandwidth = 'BANDWIDTH=' + video.getBandwidthBits(file);
            const resolution = `RESOLUTION=${size.width}x${size.height}`;
            let line = `#EXT-X-STREAM-INF:${bandwidth},${resolution}`;
            if (file.fps)
                line += ',FRAME-RATE=' + file.fps;
            const audioCodec = yield ffmpeg_utils_1.getAudioStreamCodec(videoFilePath);
            const videoCodec = yield ffmpeg_utils_1.getVideoStreamCodec(videoFilePath);
            line += `,CODECS="${videoCodec},${audioCodec}"`;
            masterPlaylists.push(line);
            masterPlaylists.push(video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsPlaylistFilename(file.resolution));
        }
        yield fs_extra_1.writeFile(masterPlaylistPath, masterPlaylists.join('\n') + '\n');
    });
}
exports.updateMasterHLSPlaylist = updateMasterHLSPlaylist;
function updateSha256Segments(video) {
    return __awaiter(this, void 0, void 0, function* () {
        const json = {};
        const playlistDirectory = path_1.join(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, video.uuid);
        const hlsPlaylist = video.getHLSPlaylist();
        for (const file of hlsPlaylist.VideoFiles) {
            const rangeHashes = {};
            const videoPath = video_paths_1.getVideoFilePath(hlsPlaylist, file);
            const playlistPath = path_1.join(playlistDirectory, video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsPlaylistFilename(file.resolution));
            if (!(yield fs_extra_1.pathExists(playlistPath)))
                continue;
            const playlistContent = yield fs_extra_1.readFile(playlistPath);
            const ranges = getRangesFromPlaylist(playlistContent.toString());
            const fd = yield fs_extra_1.open(videoPath, 'r');
            for (const range of ranges) {
                const buf = Buffer.alloc(range.length);
                yield fs_extra_1.read(fd, buf, 0, range.length, range.offset);
                rangeHashes[`${range.offset}-${range.offset + range.length - 1}`] = core_utils_1.sha256(buf);
            }
            yield fs_extra_1.close(fd);
            const videoFilename = video_paths_1.getVideoFilename(hlsPlaylist, file);
            json[videoFilename] = rangeHashes;
        }
        const outputPath = path_1.join(playlistDirectory, video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsSha256SegmentsFilename());
        yield fs_extra_1.outputJSON(outputPath, json);
    });
}
exports.updateSha256Segments = updateSha256Segments;
function getRangesFromPlaylist(playlistContent) {
    const ranges = [];
    const lines = playlistContent.split('\n');
    const regex = /^#EXT-X-BYTERANGE:(\d+)@(\d+)$/;
    for (const line of lines) {
        const captured = regex.exec(line);
        if (captured) {
            ranges.push({ length: parseInt(captured[1], 10), offset: parseInt(captured[2], 10) });
        }
    }
    return ranges;
}
function downloadPlaylistSegments(playlistUrl, destinationDir, timeout) {
    let timer;
    logger_1.logger.info('Importing HLS playlist %s', playlistUrl);
    return new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
        const tmpDirectory = path_1.join(config_1.CONFIG.STORAGE.TMP_DIR, yield utils_1.generateRandomString(10));
        yield fs_extra_1.ensureDir(tmpDirectory);
        timer = setTimeout(() => {
            deleteTmpDirectory(tmpDirectory);
            return rej(new Error('HLS download timeout.'));
        }, timeout);
        try {
            const subPlaylistUrls = yield fetchUniqUrls(playlistUrl);
            const subRequests = subPlaylistUrls.map(u => fetchUniqUrls(u));
            const fileUrls = lodash_1.uniq(lodash_1.flatten(yield Promise.all(subRequests)));
            logger_1.logger.debug('Will download %d HLS files.', fileUrls.length, { fileUrls });
            for (const fileUrl of fileUrls) {
                const destPath = path_1.join(tmpDirectory, path_1.basename(fileUrl));
                const bodyKBLimit = 10 * 1000 * 1000;
                yield requests_1.doRequestAndSaveToFile({ uri: fileUrl }, destPath, bodyKBLimit);
            }
            clearTimeout(timer);
            yield fs_extra_1.move(tmpDirectory, destinationDir, { overwrite: true });
            return res();
        }
        catch (err) {
            deleteTmpDirectory(tmpDirectory);
            return rej(err);
        }
    }));
    function deleteTmpDirectory(directory) {
        fs_extra_1.remove(directory)
            .catch(err => logger_1.logger.error('Cannot delete path on HLS download error.', { err }));
    }
    function fetchUniqUrls(playlistUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const { body } = yield requests_1.doRequest({ uri: playlistUrl });
            if (!body)
                return [];
            const urls = body.split('\n')
                .filter(line => line.endsWith('.m3u8') || line.endsWith('.mp4'))
                .map(url => {
                if (url.startsWith('http://') || url.startsWith('https://'))
                    return url;
                return `${path_1.dirname(playlistUrl)}/${url}`;
            });
            return lodash_1.uniq(urls);
        });
    }
}
exports.downloadPlaylistSegments = downloadPlaylistSegments;
