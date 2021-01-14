"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishNewResolutionIfNeeded = exports.processVideoTranscoding = void 0;
const tslib_1 = require("tslib");
const video_1 = require("@server/lib/video");
const video_paths_1 = require("@server/lib/video-paths");
const database_utils_1 = require("../../../helpers/database-utils");
const ffprobe_utils_1 = require("../../../helpers/ffprobe-utils");
const logger_1 = require("../../../helpers/logger");
const config_1 = require("../../../initializers/config");
const database_1 = require("../../../initializers/database");
const video_2 = require("../../../models/video/video");
const videos_1 = require("../../activitypub/videos");
const notifier_1 = require("../../notifier");
const video_transcoding_1 = require("../../video-transcoding");
const job_queue_1 = require("../job-queue");
function processVideoTranscoding(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        logger_1.logger.info('Processing video file in job %d.', job.id);
        const video = yield video_2.VideoModel.loadAndPopulateAccountAndServerAndTags(payload.videoUUID);
        if (!video) {
            logger_1.logger.info('Do not process job %d, video does not exist.', job.id);
            return undefined;
        }
        if (payload.type === 'hls') {
            const videoFileInput = payload.copyCodecs
                ? video.getWebTorrentFile(payload.resolution)
                : video.getMaxQualityFile();
            const videoOrStreamingPlaylist = videoFileInput.getVideoOrStreamingPlaylist();
            const videoInputPath = video_paths_1.getVideoFilePath(videoOrStreamingPlaylist, videoFileInput);
            yield video_transcoding_1.generateHlsPlaylist({
                video,
                videoInputPath,
                resolution: payload.resolution,
                copyCodecs: payload.copyCodecs,
                isPortraitMode: payload.isPortraitMode || false
            });
            yield database_utils_1.retryTransactionWrapper(onHlsPlaylistGenerationSuccess, video);
        }
        else if (payload.type === 'new-resolution') {
            yield video_transcoding_1.transcodeNewResolution(video, payload.resolution, payload.isPortraitMode || false);
            yield database_utils_1.retryTransactionWrapper(publishNewResolutionIfNeeded, video, payload);
        }
        else if (payload.type === 'merge-audio') {
            yield video_transcoding_1.mergeAudioVideofile(video, payload.resolution);
            yield database_utils_1.retryTransactionWrapper(publishNewResolutionIfNeeded, video, payload);
        }
        else {
            const transcodeType = yield video_transcoding_1.optimizeOriginalVideofile(video);
            yield database_utils_1.retryTransactionWrapper(onVideoFileOptimizerSuccess, video, payload, transcodeType);
        }
        return video;
    });
}
exports.processVideoTranscoding = processVideoTranscoding;
function onHlsPlaylistGenerationSuccess(video) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (video === undefined)
            return undefined;
        if (config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED === false) {
            for (const file of video.VideoFiles) {
                yield video.removeFile(file);
                yield file.destroy();
            }
            video.VideoFiles = [];
        }
        return video_1.publishAndFederateIfNeeded(video);
    });
}
function publishNewResolutionIfNeeded(video, payload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield video_1.publishAndFederateIfNeeded(video);
        createHlsJobIfEnabled(Object.assign({}, payload, { copyCodecs: true }));
    });
}
exports.publishNewResolutionIfNeeded = publishNewResolutionIfNeeded;
function onVideoFileOptimizerSuccess(videoArg, payload, transcodeType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (videoArg === undefined)
            return undefined;
        const { videoFileResolution, isPortraitMode } = yield videoArg.getMaxQualityResolution();
        const { videoDatabase, videoPublished } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoDatabase = yield video_2.VideoModel.loadAndPopulateAccountAndServerAndTags(videoArg.uuid, t);
            if (!videoDatabase)
                return undefined;
            const resolutionsEnabled = ffprobe_utils_1.computeResolutionsToTranscode(videoFileResolution, 'vod');
            logger_1.logger.info('Resolutions computed for video %s and origin file resolution of %d.', videoDatabase.uuid, videoFileResolution, { resolutions: resolutionsEnabled });
            let videoPublished = false;
            const originalFileHLSPayload = Object.assign({}, payload, {
                isPortraitMode,
                resolution: videoDatabase.getMaxQualityFile().resolution,
                copyCodecs: transcodeType !== 'quick-transcode'
            });
            createHlsJobIfEnabled(originalFileHLSPayload);
            if (resolutionsEnabled.length !== 0) {
                for (const resolution of resolutionsEnabled) {
                    let dataInput;
                    if (config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED) {
                        dataInput = {
                            type: 'new-resolution',
                            videoUUID: videoDatabase.uuid,
                            resolution,
                            isPortraitMode
                        };
                    }
                    else if (config_1.CONFIG.TRANSCODING.HLS.ENABLED) {
                        dataInput = {
                            type: 'hls',
                            videoUUID: videoDatabase.uuid,
                            resolution,
                            isPortraitMode,
                            copyCodecs: false
                        };
                    }
                    job_queue_1.JobQueue.Instance.createJob({ type: 'video-transcoding', payload: dataInput });
                }
                logger_1.logger.info('Transcoding jobs created for uuid %s.', videoDatabase.uuid, { resolutionsEnabled });
            }
            else {
                videoPublished = yield videoDatabase.publishIfNeededAndSave(t);
                logger_1.logger.info('No transcoding jobs created for video %s (no resolutions).', videoDatabase.uuid, { privacy: videoDatabase.privacy });
            }
            yield videos_1.federateVideoIfNeeded(videoDatabase, payload.isNewVideo, t);
            return { videoDatabase, videoPublished };
        }));
        if (payload.isNewVideo)
            notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(videoDatabase);
        if (videoPublished)
            notifier_1.Notifier.Instance.notifyOnVideoPublishedAfterTranscoding(videoDatabase);
    });
}
function createHlsJobIfEnabled(payload) {
    if (payload && config_1.CONFIG.TRANSCODING.HLS.ENABLED) {
        const hlsTranscodingPayload = {
            type: 'hls',
            videoUUID: payload.videoUUID,
            resolution: payload.resolution,
            isPortraitMode: payload.isPortraitMode,
            copyCodecs: payload.copyCodecs
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'video-transcoding', payload: hlsTranscodingPayload });
    }
}
