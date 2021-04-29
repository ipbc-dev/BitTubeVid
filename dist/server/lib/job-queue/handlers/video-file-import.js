"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideoFileImport = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const webtorrent_1 = require("@server/helpers/webtorrent");
const video_paths_1 = require("@server/lib/video-paths");
const user_1 = require("@server/models/account/user");
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
        const data = yield ffprobe_utils_1.getVideoFileResolution(payload.filePath);
        yield updateVideoFile(video, payload.filePath);
        const user = yield user_1.UserModel.loadByChannelActorId(video.VideoChannel.actorId);
        const newResolutionPayload = {
            type: 'new-resolution-to-webtorrent',
            videoUUID: video.uuid,
            resolution: data.videoFileResolution,
            isPortraitMode: data.isPortraitMode,
            copyCodecs: false,
            isNewVideo: false
        };
        yield video_transcoding_1.onNewWebTorrentFileResolution(video, user, newResolutionPayload);
        return video;
    });
}
exports.processVideoFileImport = processVideoFileImport;
function updateVideoFile(video, inputFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { videoFileResolution } = yield ffprobe_utils_1.getVideoFileResolution(inputFilePath);
        const { size } = yield fs_extra_1.stat(inputFilePath);
        const fps = yield ffprobe_utils_1.getVideoFileFPS(inputFilePath);
        const fileExt = path_1.extname(inputFilePath);
        const currentVideoFile = video.VideoFiles.find(videoFile => videoFile.resolution === videoFileResolution);
        if (currentVideoFile) {
            yield video.removeFile(currentVideoFile);
            yield currentVideoFile.removeTorrent();
            video.VideoFiles = video.VideoFiles.filter(f => f !== currentVideoFile);
            yield currentVideoFile.destroy();
        }
        const newVideoFile = new video_file_1.VideoFileModel({
            resolution: videoFileResolution,
            extname: fileExt,
            filename: video_paths_1.generateVideoFilename(video, false, videoFileResolution, fileExt),
            size,
            fps,
            videoId: video.id
        });
        const outputPath = video_paths_1.getVideoFilePath(video, newVideoFile);
        yield fs_extra_1.copy(inputFilePath, outputPath);
        video.VideoFiles.push(newVideoFile);
        yield webtorrent_1.createTorrentAndSetInfoHash(video, newVideoFile);
        yield newVideoFile.save();
    });
}
