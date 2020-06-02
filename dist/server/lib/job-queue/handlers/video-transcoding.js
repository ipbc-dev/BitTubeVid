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
const video_1 = require("../../../models/video/video");
const job_queue_1 = require("../job-queue");
const videos_1 = require("../../activitypub/videos");
const database_utils_1 = require("../../../helpers/database-utils");
const database_1 = require("../../../initializers/database");
const ffmpeg_utils_1 = require("../../../helpers/ffmpeg-utils");
const video_transcoding_1 = require("../../video-transcoding");
const notifier_1 = require("../../notifier");
const config_1 = require("../../../initializers/config");
function processVideoTranscoding(job) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        logger_1.logger.info('Processing video file in job %d.', job.id);
        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(payload.videoUUID);
        if (!video) {
            logger_1.logger.info('Do not process job %d, video does not exist.', job.id);
            return undefined;
        }
        if (payload.type === 'hls') {
            yield video_transcoding_1.generateHlsPlaylist(video, payload.resolution, payload.copyCodecs, payload.isPortraitMode || false);
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
            yield video_transcoding_1.optimizeOriginalVideofile(video);
            yield database_utils_1.retryTransactionWrapper(onVideoFileOptimizerSuccess, video, payload);
        }
        return video;
    });
}
exports.processVideoTranscoding = processVideoTranscoding;
function onHlsPlaylistGenerationSuccess(video) {
    return __awaiter(this, void 0, void 0, function* () {
        if (video === undefined)
            return undefined;
        if (config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED === false) {
            for (const file of video.VideoFiles) {
                yield video.removeFile(file);
                yield file.destroy();
            }
            video.VideoFiles = [];
        }
        return publishAndFederateIfNeeded(video);
    });
}
function publishNewResolutionIfNeeded(video, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        yield publishAndFederateIfNeeded(video);
        yield createHlsJobIfEnabled(payload);
    });
}
exports.publishNewResolutionIfNeeded = publishNewResolutionIfNeeded;
function onVideoFileOptimizerSuccess(videoArg, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        if (videoArg === undefined)
            return undefined;
        const { videoFileResolution } = yield videoArg.getMaxQualityResolution();
        const { videoDatabase, videoPublished } = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const videoDatabase = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoArg.uuid, t);
            if (!videoDatabase)
                return undefined;
            const resolutionsEnabled = ffmpeg_utils_1.computeResolutionsToTranscode(videoFileResolution);
            logger_1.logger.info('Resolutions computed for video %s and origin file height of %d.', videoDatabase.uuid, videoFileResolution, { resolutions: resolutionsEnabled });
            let videoPublished = false;
            const hlsPayload = Object.assign({}, payload, { resolution: videoDatabase.getMaxQualityFile().resolution });
            yield createHlsJobIfEnabled(hlsPayload);
            if (resolutionsEnabled.length !== 0) {
                for (const resolution of resolutionsEnabled) {
                    let dataInput;
                    if (config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED) {
                        dataInput = {
                            type: 'new-resolution',
                            videoUUID: videoDatabase.uuid,
                            resolution
                        };
                    }
                    else if (config_1.CONFIG.TRANSCODING.HLS.ENABLED) {
                        dataInput = {
                            type: 'hls',
                            videoUUID: videoDatabase.uuid,
                            resolution,
                            isPortraitMode: false,
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
            copyCodecs: true
        };
        return job_queue_1.JobQueue.Instance.createJob({ type: 'video-transcoding', payload: hlsTranscodingPayload });
    }
}
function publishAndFederateIfNeeded(video) {
    return __awaiter(this, void 0, void 0, function* () {
        const { videoDatabase, videoPublished } = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const videoDatabase = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(video.uuid, t);
            if (!videoDatabase)
                return undefined;
            const videoPublished = yield videoDatabase.publishIfNeededAndSave(t);
            yield videos_1.federateVideoIfNeeded(videoDatabase, videoPublished, t);
            return { videoDatabase, videoPublished };
        }));
        if (videoPublished) {
            notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(videoDatabase);
            notifier_1.Notifier.Instance.notifyOnVideoPublishedAfterTranscoding(videoDatabase);
        }
    });
}
