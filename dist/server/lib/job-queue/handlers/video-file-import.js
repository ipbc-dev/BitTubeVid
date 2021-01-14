"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideoFileImport = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const webtorrent_1 = require("@server/helpers/webtorrent");
const video_paths_1 = require("@server/lib/video-paths");
const ffprobe_utils_1 = require("../../../helpers/ffprobe-utils");
const logger_1 = require("../../../helpers/logger");
const video_1 = require("../../../models/video/video");
const video_file_1 = require("../../../models/video/video-file");
const video_transcoding_1 = require("./video-transcoding");
function processVideoFileImport(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        logger_1.logger.info('Processing video file import in job %d.', job.id);
        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(payload.videoUUID);
        if (!video) {
            logger_1.logger.info('Do not process job %d, video does not exist.', job.id);
            return undefined;
        }
        yield updateVideoFile(video, payload.filePath);
        yield video_transcoding_1.publishNewResolutionIfNeeded(video);
        return video;
    });
}
exports.processVideoFileImport = processVideoFileImport;
function updateVideoFile(video, inputFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { videoFileResolution } = yield ffprobe_utils_1.getVideoFileResolution(inputFilePath);
        const { size } = yield fs_extra_1.stat(inputFilePath);
        const fps = yield ffprobe_utils_1.getVideoFileFPS(inputFilePath);
        let updatedVideoFile = new video_file_1.VideoFileModel({
            resolution: videoFileResolution,
            extname: path_1.extname(inputFilePath),
            size,
            fps,
            videoId: video.id
        });
        const currentVideoFile = video.VideoFiles.find(videoFile => videoFile.resolution === updatedVideoFile.resolution);
        if (currentVideoFile) {
            yield video.removeFile(currentVideoFile);
            yield video.removeTorrent(currentVideoFile);
            video.VideoFiles = video.VideoFiles.filter(f => f !== currentVideoFile);
            currentVideoFile.extname = updatedVideoFile.extname;
            currentVideoFile.size = updatedVideoFile.size;
            currentVideoFile.fps = updatedVideoFile.fps;
            updatedVideoFile = currentVideoFile;
        }
        const outputPath = video_paths_1.getVideoFilePath(video, updatedVideoFile);
        yield fs_extra_1.copy(inputFilePath, outputPath);
        yield webtorrent_1.createTorrentAndSetInfoHash(video, updatedVideoFile);
        yield updatedVideoFile.save();
        video.VideoFiles.push(updatedVideoFile);
    });
}
