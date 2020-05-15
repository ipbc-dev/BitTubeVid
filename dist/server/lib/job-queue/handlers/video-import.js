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
const logger_1 = require("../../../helpers/logger");
const youtube_dl_1 = require("../../../helpers/youtube-dl");
const video_import_1 = require("../../../models/video/video-import");
const videos_1 = require("../../../../shared/models/videos");
const ffmpeg_utils_1 = require("../../../helpers/ffmpeg-utils");
const path_1 = require("path");
const video_file_1 = require("../../../models/video/video-file");
const constants_1 = require("../../../initializers/constants");
const shared_1 = require("../../../../shared");
const index_1 = require("../index");
const activitypub_1 = require("../../activitypub");
const video_1 = require("../../../models/video/video");
const webtorrent_1 = require("../../../helpers/webtorrent");
const utils_1 = require("../../../helpers/utils");
const fs_extra_1 = require("fs-extra");
const notifier_1 = require("../../notifier");
const config_1 = require("../../../initializers/config");
const database_1 = require("../../../initializers/database");
const thumbnail_1 = require("../../thumbnail");
const thumbnail_type_1 = require("../../../../shared/models/videos/thumbnail.type");
const video_paths_1 = require("@server/lib/video-paths");
function processVideoImport(job) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        if (payload.type === 'youtube-dl')
            return processYoutubeDLImport(job, payload);
        if (payload.type === 'magnet-uri' || payload.type === 'torrent-file')
            return processTorrentImport(job, payload);
    });
}
exports.processVideoImport = processVideoImport;
function processTorrentImport(job, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Processing torrent video import in job %d.', job.id);
        const videoImport = yield getVideoImportOrDie(payload.videoImportId);
        const options = {
            videoImportId: payload.videoImportId,
            downloadThumbnail: false,
            downloadPreview: false,
            generateThumbnail: true,
            generatePreview: true
        };
        const target = {
            torrentName: videoImport.torrentName ? utils_1.getSecureTorrentName(videoImport.torrentName) : undefined,
            magnetUri: videoImport.magnetUri
        };
        return processFile(() => webtorrent_1.downloadWebTorrentVideo(target, constants_1.VIDEO_IMPORT_TIMEOUT), videoImport, options);
    });
}
function processYoutubeDLImport(job, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Processing youtubeDL video import in job %d.', job.id);
        const videoImport = yield getVideoImportOrDie(payload.videoImportId);
        const options = {
            videoImportId: videoImport.id,
            downloadThumbnail: payload.downloadThumbnail,
            downloadPreview: payload.downloadPreview,
            thumbnailUrl: payload.thumbnailUrl,
            generateThumbnail: false,
            generatePreview: false
        };
        return processFile(() => youtube_dl_1.downloadYoutubeDLVideo(videoImport.targetUrl, constants_1.VIDEO_IMPORT_TIMEOUT), videoImport, options);
    });
}
function getVideoImportOrDie(videoImportId) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoImport = yield video_import_1.VideoImportModel.loadAndPopulateVideo(videoImportId);
        if (!videoImport || !videoImport.Video) {
            throw new Error('Cannot import video %s: the video import or video linked to this import does not exist anymore.');
        }
        return videoImport;
    });
}
function processFile(downloader, videoImport, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let tempVideoPath;
        let videoDestFile;
        let videoFile;
        try {
            tempVideoPath = yield downloader();
            const stats = yield fs_extra_1.stat(tempVideoPath);
            const isAble = yield videoImport.User.isAbleToUploadVideo({ size: stats.size });
            if (isAble === false) {
                throw new Error('The user video quota is exceeded with this video to import.');
            }
            const { videoFileResolution } = yield ffmpeg_utils_1.getVideoFileResolution(tempVideoPath);
            const fps = yield ffmpeg_utils_1.getVideoFileFPS(tempVideoPath);
            const duration = yield ffmpeg_utils_1.getDurationFromVideoFile(tempVideoPath);
            const videoFileData = {
                extname: path_1.extname(tempVideoPath),
                resolution: videoFileResolution,
                size: stats.size,
                fps,
                videoId: videoImport.videoId
            };
            videoFile = new video_file_1.VideoFileModel(videoFileData);
            const videoWithFiles = Object.assign(videoImport.Video, { VideoFiles: [videoFile], VideoStreamingPlaylists: [] });
            const videoImportWithFiles = Object.assign(videoImport, { Video: videoWithFiles });
            videoDestFile = video_paths_1.getVideoFilePath(videoImportWithFiles.Video, videoFile);
            yield fs_extra_1.move(tempVideoPath, videoDestFile);
            tempVideoPath = null;
            let thumbnailModel;
            if (options.downloadThumbnail && options.thumbnailUrl) {
                thumbnailModel = yield thumbnail_1.createVideoMiniatureFromUrl(options.thumbnailUrl, videoImportWithFiles.Video, thumbnail_type_1.ThumbnailType.MINIATURE);
            }
            else if (options.generateThumbnail || options.downloadThumbnail) {
                thumbnailModel = yield thumbnail_1.generateVideoMiniature(videoImportWithFiles.Video, videoFile, thumbnail_type_1.ThumbnailType.MINIATURE);
            }
            let previewModel;
            if (options.downloadPreview && options.thumbnailUrl) {
                previewModel = yield thumbnail_1.createVideoMiniatureFromUrl(options.thumbnailUrl, videoImportWithFiles.Video, thumbnail_type_1.ThumbnailType.PREVIEW);
            }
            else if (options.generatePreview || options.downloadPreview) {
                previewModel = yield thumbnail_1.generateVideoMiniature(videoImportWithFiles.Video, videoFile, thumbnail_type_1.ThumbnailType.PREVIEW);
            }
            yield webtorrent_1.createTorrentAndSetInfoHash(videoImportWithFiles.Video, videoFile);
            const { videoImportUpdated, video } = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                const videoImportToUpdate = videoImportWithFiles;
                const video = yield video_1.VideoModel.load(videoImportToUpdate.videoId, t);
                if (!video)
                    throw new Error('Video linked to import ' + videoImportToUpdate.videoId + ' does not exist anymore.');
                const videoFileCreated = yield videoFile.save({ transaction: t });
                videoImportToUpdate.Video = Object.assign(video, { VideoFiles: [videoFileCreated] });
                video.duration = duration;
                video.state = config_1.CONFIG.TRANSCODING.ENABLED ? shared_1.VideoState.TO_TRANSCODE : shared_1.VideoState.PUBLISHED;
                yield video.save({ transaction: t });
                if (thumbnailModel)
                    yield video.addAndSaveThumbnail(thumbnailModel, t);
                if (previewModel)
                    yield video.addAndSaveThumbnail(previewModel, t);
                const videoForFederation = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(video.uuid, t);
                yield activitypub_1.federateVideoIfNeeded(videoForFederation, true, t);
                videoImportToUpdate.state = videos_1.VideoImportState.SUCCESS;
                const videoImportUpdated = yield videoImportToUpdate.save({ transaction: t });
                videoImportUpdated.Video = video;
                logger_1.logger.info('Video %s imported.', video.uuid);
                return { videoImportUpdated, video: videoForFederation };
            }));
            notifier_1.Notifier.Instance.notifyOnFinishedVideoImport(videoImportUpdated, true);
            if (video.isBlacklisted()) {
                const videoBlacklist = Object.assign(video.VideoBlacklist, { Video: video });
                notifier_1.Notifier.Instance.notifyOnVideoAutoBlacklist(videoBlacklist);
            }
            else {
                notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(video);
            }
            if (video.state === shared_1.VideoState.TO_TRANSCODE) {
                const dataInput = {
                    type: 'optimize',
                    videoUUID: videoImportUpdated.Video.uuid,
                    isNewVideo: true
                };
                yield index_1.JobQueue.Instance.createJob({ type: 'video-transcoding', payload: dataInput });
            }
        }
        catch (err) {
            try {
                if (tempVideoPath)
                    yield fs_extra_1.remove(tempVideoPath);
            }
            catch (errUnlink) {
                logger_1.logger.warn('Cannot cleanup files after a video import error.', { err: errUnlink });
            }
            videoImport.error = err.message;
            videoImport.state = videos_1.VideoImportState.FAILED;
            yield videoImport.save();
            notifier_1.Notifier.Instance.notifyOnFinishedVideoImport(videoImport, false);
            throw err;
        }
    });
}
