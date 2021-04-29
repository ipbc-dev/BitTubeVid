"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideoImport = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const database_utils_1 = require("@server/helpers/database-utils");
const moderation_1 = require("@server/lib/moderation");
const hooks_1 = require("@server/lib/plugins/hooks");
const user_1 = require("@server/lib/user");
const video_1 = require("@server/lib/video");
const video_paths_1 = require("@server/lib/video-paths");
const thumbnail_1 = require("@server/models/video/thumbnail");
const ffprobe_utils_1 = require("../../../helpers/ffprobe-utils");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const webtorrent_1 = require("../../../helpers/webtorrent");
const youtube_dl_1 = require("../../../helpers/youtube-dl");
const config_1 = require("../../../initializers/config");
const constants_1 = require("../../../initializers/constants");
const database_1 = require("../../../initializers/database");
const video_2 = require("../../../models/video/video");
const video_file_1 = require("../../../models/video/video-file");
const video_import_1 = require("../../../models/video/video-import");
const videos_1 = require("../../activitypub/videos");
const notifier_1 = require("../../notifier");
const thumbnail_2 = require("../../thumbnail");
function processVideoImport(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        if (payload.type === 'youtube-dl')
            return processYoutubeDLImport(job, payload);
        if (payload.type === 'magnet-uri' || payload.type === 'torrent-file')
            return processTorrentImport(job, payload);
    });
}
exports.processVideoImport = processVideoImport;
function processTorrentImport(job, payload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Processing torrent video import in job %d.', job.id);
        const videoImport = yield getVideoImportOrDie(payload.videoImportId);
        const options = {
            type: payload.type,
            videoImportId: payload.videoImportId
        };
        const target = {
            torrentName: videoImport.torrentName ? utils_1.getSecureTorrentName(videoImport.torrentName) : undefined,
            magnetUri: videoImport.magnetUri
        };
        return processFile(() => webtorrent_1.downloadWebTorrentVideo(target, constants_1.VIDEO_IMPORT_TIMEOUT), videoImport, options);
    });
}
function processYoutubeDLImport(job, payload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Processing youtubeDL video import in job %d.', job.id);
        const videoImport = yield getVideoImportOrDie(payload.videoImportId);
        const options = {
            type: payload.type,
            videoImportId: videoImport.id
        };
        return processFile(() => youtube_dl_1.downloadYoutubeDLVideo(videoImport.targetUrl, payload.fileExt, constants_1.VIDEO_IMPORT_TIMEOUT), videoImport, options);
    });
}
function getVideoImportOrDie(videoImportId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoImport = yield video_import_1.VideoImportModel.loadAndPopulateVideo(videoImportId);
        if (!videoImport || !videoImport.Video) {
            throw new Error('Cannot import video %s: the video import or video linked to this import does not exist anymore.');
        }
        return videoImport;
    });
}
function processFile(downloader, videoImport, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let tempVideoPath;
        let videoDestFile;
        let videoFile;
        try {
            tempVideoPath = yield downloader();
            const stats = yield fs_extra_1.stat(tempVideoPath);
            const isAble = yield user_1.isAbleToUploadVideo(videoImport.User.id, stats.size);
            if (isAble === false) {
                throw new Error('The user video quota is exceeded with this video to import.');
            }
            const { videoFileResolution } = yield ffprobe_utils_1.getVideoFileResolution(tempVideoPath);
            const fps = yield ffprobe_utils_1.getVideoFileFPS(tempVideoPath);
            const duration = yield ffprobe_utils_1.getDurationFromVideoFile(tempVideoPath);
            const fileExt = path_1.extname(tempVideoPath);
            const videoFileData = {
                extname: fileExt,
                resolution: videoFileResolution,
                size: stats.size,
                filename: video_paths_1.generateVideoFilename(videoImport.Video, false, videoFileResolution, fileExt),
                fps,
                videoId: videoImport.videoId
            };
            videoFile = new video_file_1.VideoFileModel(videoFileData);
            const hookName = options.type === 'youtube-dl'
                ? 'filter:api.video.post-import-url.accept.result'
                : 'filter:api.video.post-import-torrent.accept.result';
            const acceptParameters = {
                videoImport,
                video: videoImport.Video,
                videoFilePath: tempVideoPath,
                videoFile,
                user: videoImport.User
            };
            const acceptedResult = yield hooks_1.Hooks.wrapFun(moderation_1.isPostImportVideoAccepted, acceptParameters, hookName);
            if (acceptedResult.accepted !== true) {
                logger_1.logger.info('Refused imported video.', { acceptedResult, acceptParameters });
                videoImport.state = 4;
                yield videoImport.save();
                throw new Error(acceptedResult.errorMessage);
            }
            const videoWithFiles = Object.assign(videoImport.Video, { VideoFiles: [videoFile], VideoStreamingPlaylists: [] });
            const videoImportWithFiles = Object.assign(videoImport, { Video: videoWithFiles });
            videoDestFile = video_paths_1.getVideoFilePath(videoImportWithFiles.Video, videoFile);
            yield fs_extra_1.move(tempVideoPath, videoDestFile);
            tempVideoPath = null;
            let thumbnailModel;
            let thumbnailSave;
            if (!videoImportWithFiles.Video.getMiniature()) {
                thumbnailModel = yield thumbnail_2.generateVideoMiniature({
                    video: videoImportWithFiles.Video,
                    videoFile,
                    type: 1
                });
                thumbnailSave = thumbnailModel.toJSON();
            }
            let previewModel;
            let previewSave;
            if (!videoImportWithFiles.Video.getPreview()) {
                previewModel = yield thumbnail_2.generateVideoMiniature({
                    video: videoImportWithFiles.Video,
                    videoFile,
                    type: 2
                });
                previewSave = previewModel.toJSON();
            }
            yield webtorrent_1.createTorrentAndSetInfoHash(videoImportWithFiles.Video, videoFile);
            const videoFileSave = videoFile.toJSON();
            const { videoImportUpdated, video } = yield database_utils_1.retryTransactionWrapper(() => {
                return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoImportToUpdate = videoImportWithFiles;
                    const video = yield video_2.VideoModel.load(videoImportToUpdate.videoId, t);
                    if (!video)
                        throw new Error('Video linked to import ' + videoImportToUpdate.videoId + ' does not exist anymore.');
                    const videoFileCreated = yield videoFile.save({ transaction: t });
                    video.duration = duration;
                    video.state = config_1.CONFIG.TRANSCODING.ENABLED ? 2 : 1;
                    yield video.save({ transaction: t });
                    if (thumbnailModel)
                        yield video.addAndSaveThumbnail(thumbnailModel, t);
                    if (previewModel)
                        yield video.addAndSaveThumbnail(previewModel, t);
                    const videoForFederation = yield video_2.VideoModel.loadAndPopulateAccountAndServerAndTags(video.uuid, t);
                    yield videos_1.federateVideoIfNeeded(videoForFederation, true, t);
                    videoImportToUpdate.state = 2;
                    const videoImportUpdated = yield videoImportToUpdate.save({ transaction: t });
                    videoImportUpdated.Video = video;
                    videoImportToUpdate.Video = Object.assign(video, { VideoFiles: [videoFileCreated] });
                    logger_1.logger.info('Video %s imported.', video.uuid);
                    return { videoImportUpdated, video: videoForFederation };
                })).catch(err => {
                    if (thumbnailModel)
                        thumbnailModel = new thumbnail_1.ThumbnailModel(thumbnailSave);
                    if (previewModel)
                        previewModel = new thumbnail_1.ThumbnailModel(previewSave);
                    videoFile = new video_file_1.VideoFileModel(videoFileSave);
                    throw err;
                });
            });
            notifier_1.Notifier.Instance.notifyOnFinishedVideoImport(videoImportUpdated, true);
            if (video.isBlacklisted()) {
                const videoBlacklist = Object.assign(video.VideoBlacklist, { Video: video });
                notifier_1.Notifier.Instance.notifyOnVideoAutoBlacklist(videoBlacklist);
            }
            else {
                notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(video);
            }
            if (video.state === 2) {
                yield video_1.addOptimizeOrMergeAudioJob(videoImportUpdated.Video, videoFile, videoImport.User);
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
            if (videoImport.state !== 4) {
                videoImport.state = 3;
            }
            yield videoImport.save();
            notifier_1.Notifier.Instance.notifyOnFinishedVideoImport(videoImport, false);
            throw err;
        }
    });
}
