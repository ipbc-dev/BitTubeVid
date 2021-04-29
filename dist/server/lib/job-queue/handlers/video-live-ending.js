"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupLive = exports.processVideoLiveEnding = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const ffprobe_utils_1 = require("@server/helpers/ffprobe-utils");
const constants_1 = require("@server/initializers/constants");
const live_manager_1 = require("@server/lib/live-manager");
const thumbnail_1 = require("@server/lib/thumbnail");
const video_1 = require("@server/lib/video");
const video_paths_1 = require("@server/lib/video-paths");
const video_transcoding_1 = require("@server/lib/video-transcoding");
const video_2 = require("@server/models/video/video");
const video_file_1 = require("@server/models/video/video-file");
const video_live_1 = require("@server/models/video/video-live");
const video_streaming_playlist_1 = require("@server/models/video/video-streaming-playlist");
const logger_1 = require("../../../helpers/logger");
function processVideoLiveEnding(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        function logError() {
            logger_1.logger.warn('Video live %d does not exist anymore. Cannot process live ending.', payload.videoId);
        }
        const video = yield video_2.VideoModel.load(payload.videoId);
        const live = yield video_live_1.VideoLiveModel.loadByVideoId(payload.videoId);
        if (!video || !live) {
            logError();
            return;
        }
        const streamingPlaylist = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.loadHLSPlaylistByVideo(video.id);
        if (!streamingPlaylist) {
            logError();
            return;
        }
        live_manager_1.LiveManager.Instance.cleanupShaSegments(video.uuid);
        if (live.saveReplay !== true) {
            return cleanupLive(video, streamingPlaylist);
        }
        return saveLive(video, live);
    });
}
exports.processVideoLiveEnding = processVideoLiveEnding;
function cleanupLive(video, streamingPlaylist) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const hlsDirectory = video_paths_1.getHLSDirectory(video);
        yield fs_extra_1.remove(hlsDirectory);
        yield streamingPlaylist.destroy();
    });
}
exports.cleanupLive = cleanupLive;
function saveLive(video, live) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const hlsDirectory = video_paths_1.getHLSDirectory(video, false);
        const replayDirectory = path_1.join(hlsDirectory, constants_1.VIDEO_LIVE.REPLAY_DIRECTORY);
        const rootFiles = yield fs_extra_1.readdir(hlsDirectory);
        const playlistFiles = rootFiles.filter(file => {
            return file.endsWith('.m3u8') && file !== 'master.m3u8';
        });
        yield cleanupLiveFiles(hlsDirectory);
        yield live.destroy();
        video.isLive = false;
        video.views = 0;
        video.state = 2;
        yield video.save();
        const videoWithFiles = yield video_2.VideoModel.loadAndPopulateAccountAndServerAndTags(video.id);
        const hlsPlaylist = videoWithFiles.getHLSPlaylist();
        yield video_file_1.VideoFileModel.removeHLSFilesOfVideoId(hlsPlaylist.id);
        hlsPlaylist.VideoFiles = [];
        let durationDone = false;
        for (const playlistFile of playlistFiles) {
            const concatenatedTsFile = live_manager_1.LiveManager.Instance.buildConcatenatedName(playlistFile);
            const concatenatedTsFilePath = path_1.join(replayDirectory, concatenatedTsFile);
            const probe = yield ffprobe_utils_1.ffprobePromise(concatenatedTsFilePath);
            const { audioStream } = yield ffprobe_utils_1.getAudioStream(concatenatedTsFilePath, probe);
            const { videoFileResolution, isPortraitMode } = yield ffprobe_utils_1.getVideoFileResolution(concatenatedTsFilePath, probe);
            const outputPath = yield video_transcoding_1.generateHlsPlaylistResolutionFromTS({
                video: videoWithFiles,
                concatenatedTsFilePath,
                resolution: videoFileResolution,
                isPortraitMode,
                isAAC: (audioStream === null || audioStream === void 0 ? void 0 : audioStream.codec_name) === 'aac'
            });
            if (!durationDone) {
                videoWithFiles.duration = yield ffprobe_utils_1.getDurationFromVideoFile(outputPath);
                yield videoWithFiles.save();
                durationDone = true;
            }
        }
        yield fs_extra_1.remove(replayDirectory);
        if (videoWithFiles.getMiniature().automaticallyGenerated === true) {
            yield thumbnail_1.generateVideoMiniature({
                video: videoWithFiles,
                videoFile: videoWithFiles.getMaxQualityFile(),
                type: 1
            });
        }
        if (videoWithFiles.getPreview().automaticallyGenerated === true) {
            yield thumbnail_1.generateVideoMiniature({
                video: videoWithFiles,
                videoFile: videoWithFiles.getMaxQualityFile(),
                type: 2
            });
        }
        yield video_1.publishAndFederateIfNeeded(videoWithFiles, true);
    });
}
function cleanupLiveFiles(hlsDirectory) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!(yield fs_extra_1.pathExists(hlsDirectory)))
            return;
        const files = yield fs_extra_1.readdir(hlsDirectory);
        for (const filename of files) {
            if (filename.endsWith('.ts') ||
                filename.endsWith('.m3u8') ||
                filename.endsWith('.mpd') ||
                filename.endsWith('.m4s') ||
                filename.endsWith('.tmp')) {
                const p = path_1.join(hlsDirectory, filename);
                fs_extra_1.remove(p)
                    .catch(err => logger_1.logger.error('Cannot remove %s.', p, { err }));
            }
        }
    });
}
