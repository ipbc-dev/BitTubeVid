"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewWebTorrentFileResolution = exports.processVideoTranscoding = void 0;
const tslib_1 = require("tslib");
const constants_1 = require("@server/initializers/constants");
const video_1 = require("@server/lib/video");
const video_paths_1 = require("@server/lib/video-paths");
const user_1 = require("@server/models/account/user");
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
const handlers = {
    'hls': handleHLSJob,
    'new-resolution-to-hls': handleHLSJob,
    'new-resolution': handleNewWebTorrentResolutionJob,
    'new-resolution-to-webtorrent': handleNewWebTorrentResolutionJob,
    'merge-audio': handleWebTorrentMergeAudioJob,
    'merge-audio-to-webtorrent': handleWebTorrentMergeAudioJob,
    'optimize': handleWebTorrentOptimizeJob,
    'optimize-to-webtorrent': handleWebTorrentOptimizeJob
};
function processVideoTranscoding(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        logger_1.logger.info('Processing video file in job %d.', job.id);
        const video = yield video_2.VideoModel.loadAndPopulateAccountAndServerAndTags(payload.videoUUID);
        if (!video) {
            logger_1.logger.info('Do not process job %d, video does not exist.', job.id);
            return undefined;
        }
        const user = yield user_1.UserModel.loadByChannelActorId(video.VideoChannel.actorId);
        const handler = handlers[payload.type];
        if (!handler) {
            throw new Error('Cannot find transcoding handler for ' + payload.type);
        }
        yield handler(job, payload, video, user);
        return video;
    });
}
exports.processVideoTranscoding = processVideoTranscoding;
function handleHLSJob(job, payload, video, user) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoFileInput = payload.copyCodecs
            ? video.getWebTorrentFile(payload.resolution)
            : video.getMaxQualityFile();
        const videoOrStreamingPlaylist = videoFileInput.getVideoOrStreamingPlaylist();
        const videoInputPath = video_paths_1.getVideoFilePath(videoOrStreamingPlaylist, videoFileInput);
        yield video_transcoding_1.generateHlsPlaylistResolution({
            video,
            videoInputPath,
            resolution: payload.resolution,
            copyCodecs: payload.copyCodecs,
            isPortraitMode: payload.isPortraitMode || false,
            job
        });
        yield database_utils_1.retryTransactionWrapper(onHlsPlaylistGeneration, video, user, payload);
    });
}
function handleNewWebTorrentResolutionJob(job, payload, video, user) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield video_transcoding_1.transcodeNewWebTorrentResolution(video, payload.resolution, payload.isPortraitMode || false, job);
        yield database_utils_1.retryTransactionWrapper(onNewWebTorrentFileResolution, video, user, payload);
    });
}
function handleWebTorrentMergeAudioJob(job, payload, video, user) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield video_transcoding_1.mergeAudioVideofile(video, payload.resolution, job);
        yield database_utils_1.retryTransactionWrapper(onVideoFileOptimizer, video, payload, 'video', user);
    });
}
function handleWebTorrentOptimizeJob(job, payload, video, user) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const transcodeType = yield video_transcoding_1.optimizeOriginalVideofile(video, video.getMaxQualityFile(), job);
        yield database_utils_1.retryTransactionWrapper(onVideoFileOptimizer, video, payload, transcodeType, user);
    });
}
function onHlsPlaylistGeneration(video, user, payload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (video === undefined)
            return undefined;
        if (payload.isMaxQuality && config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED === false) {
            for (const file of video.VideoFiles) {
                yield video.removeFile(file);
                yield file.removeTorrent();
                yield file.destroy();
            }
            video.VideoFiles = [];
            yield createLowerResolutionsJobs(video, user, payload.resolution, payload.isPortraitMode, 'hls');
        }
        return video_1.publishAndFederateIfNeeded(video);
    });
}
function onVideoFileOptimizer(videoArg, payload, transcodeType, user) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (videoArg === undefined)
            return undefined;
        const { videoFileResolution, isPortraitMode } = yield videoArg.getMaxQualityResolution();
        const { videoDatabase, videoPublished } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoDatabase = yield video_2.VideoModel.loadAndPopulateAccountAndServerAndTags(videoArg.uuid, t);
            if (!videoDatabase)
                return undefined;
            let videoPublished = false;
            const originalFileHLSPayload = Object.assign({}, payload, {
                isPortraitMode,
                resolution: videoDatabase.getMaxQualityFile().resolution,
                copyCodecs: transcodeType !== 'quick-transcode',
                isMaxQuality: true
            });
            const hasHls = yield createHlsJobIfEnabled(user, originalFileHLSPayload);
            const hasNewResolutions = yield createLowerResolutionsJobs(videoDatabase, user, videoFileResolution, isPortraitMode, 'webtorrent');
            if (!hasHls && !hasNewResolutions) {
                videoPublished = yield videoDatabase.publishIfNeededAndSave(t);
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
function onNewWebTorrentFileResolution(video, user, payload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield video_1.publishAndFederateIfNeeded(video);
        yield createHlsJobIfEnabled(user, Object.assign({}, payload, { copyCodecs: true, isMaxQuality: false }));
    });
}
exports.onNewWebTorrentFileResolution = onNewWebTorrentFileResolution;
function createHlsJobIfEnabled(user, payload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!payload || config_1.CONFIG.TRANSCODING.HLS.ENABLED !== true)
            return false;
        const jobOptions = {
            priority: constants_1.JOB_PRIORITY.TRANSCODING.NEW_RESOLUTION + (yield video_1.getJobTranscodingPriorityMalus(user))
        };
        const hlsTranscodingPayload = {
            type: 'new-resolution-to-hls',
            videoUUID: payload.videoUUID,
            resolution: payload.resolution,
            isPortraitMode: payload.isPortraitMode,
            copyCodecs: payload.copyCodecs,
            isMaxQuality: payload.isMaxQuality
        };
        job_queue_1.JobQueue.Instance.createJob({ type: 'video-transcoding', payload: hlsTranscodingPayload }, jobOptions);
        return true;
    });
}
function createLowerResolutionsJobs(video, user, videoFileResolution, isPortraitMode, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const resolutionsEnabled = ffprobe_utils_1.computeResolutionsToTranscode(videoFileResolution, 'vod');
        const resolutionCreated = [];
        for (const resolution of resolutionsEnabled) {
            let dataInput;
            if (config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED && type === 'webtorrent') {
                dataInput = {
                    type: 'new-resolution-to-webtorrent',
                    videoUUID: video.uuid,
                    resolution,
                    isPortraitMode
                };
            }
            if (config_1.CONFIG.TRANSCODING.HLS.ENABLED && type === 'hls') {
                dataInput = {
                    type: 'new-resolution-to-hls',
                    videoUUID: video.uuid,
                    resolution,
                    isPortraitMode,
                    copyCodecs: false,
                    isMaxQuality: false
                };
            }
            if (!dataInput)
                continue;
            resolutionCreated.push(resolution);
            const jobOptions = {
                priority: constants_1.JOB_PRIORITY.TRANSCODING.NEW_RESOLUTION + (yield video_1.getJobTranscodingPriorityMalus(user))
            };
            job_queue_1.JobQueue.Instance.createJob({ type: 'video-transcoding', payload: dataInput }, jobOptions);
        }
        if (resolutionCreated.length === 0) {
            logger_1.logger.info('No transcoding jobs created for video %s (no resolutions).', video.uuid);
            return false;
        }
        logger_1.logger.info('New resolutions %s transcoding jobs created for video %s and origin file resolution of %d.', type, video.uuid, videoFileResolution, { resolutionCreated });
        return true;
    });
}
