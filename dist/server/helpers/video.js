"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const video_1 = require("../models/video/video");
const models_1 = require("@server/typings/models");
const constants_1 = require("@server/initializers/constants");
const job_queue_1 = require("@server/lib/job-queue");
function fetchVideo(id, fetchType, userId) {
    if (fetchType === 'all')
        return video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(id, undefined, userId);
    if (fetchType === 'only-immutable-attributes')
        return video_1.VideoModel.loadImmutableAttributes(id);
    if (fetchType === 'only-video-with-rights')
        return video_1.VideoModel.loadWithRights(id);
    if (fetchType === 'only-video')
        return video_1.VideoModel.load(id);
    if (fetchType === 'id' || fetchType === 'none')
        return video_1.VideoModel.loadOnlyId(id);
}
exports.fetchVideo = fetchVideo;
function fetchVideoByUrl(url, fetchType) {
    if (fetchType === 'all')
        return video_1.VideoModel.loadByUrlAndPopulateAccount(url);
    if (fetchType === 'only-immutable-attributes')
        return video_1.VideoModel.loadByUrlImmutableAttributes(url);
    if (fetchType === 'only-video')
        return video_1.VideoModel.loadByUrl(url);
}
exports.fetchVideoByUrl = fetchVideoByUrl;
function getVideoWithAttributes(res) {
    return res.locals.videoAll || res.locals.onlyVideo || res.locals.onlyVideoWithRights;
}
exports.getVideoWithAttributes = getVideoWithAttributes;
function addOptimizeOrMergeAudioJob(video, videoFile) {
    let dataInput;
    if (videoFile.isAudio()) {
        dataInput = {
            type: 'merge-audio',
            resolution: constants_1.DEFAULT_AUDIO_RESOLUTION,
            videoUUID: video.uuid,
            isNewVideo: true
        };
    }
    else {
        dataInput = {
            type: 'optimize',
            videoUUID: video.uuid,
            isNewVideo: true
        };
    }
    return job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'video-transcoding', payload: dataInput });
}
exports.addOptimizeOrMergeAudioJob = addOptimizeOrMergeAudioJob;
function extractVideo(videoOrPlaylist) {
    return models_1.isStreamingPlaylist(videoOrPlaylist)
        ? videoOrPlaylist.Video
        : videoOrPlaylist;
}
exports.extractVideo = extractVideo;
