"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canDoQuickAudioTranscode = exports.canDoQuickVideoTranscode = exports.canDoQuickTranscode = exports.getVideoFileBitrate = exports.computeResolutionsToTranscode = exports.getClosestFramerateStandard = exports.ffprobePromise = exports.getVideoFileFPS = exports.computeFPS = exports.getAudioStream = exports.getDurationFromVideoFile = exports.getVideoStreamFromFile = exports.getMaxAudioBitrate = exports.getMetadataFromFile = exports.getVideoFileResolution = exports.getVideoStreamSize = exports.getAudioStreamCodec = exports.getVideoStreamCodec = void 0;
const tslib_1 = require("tslib");
const ffmpeg = require("fluent-ffmpeg");
const video_file_metadata_1 = require("@shared/models/videos/video-file-metadata");
const videos_1 = require("../../shared/models/videos");
const config_1 = require("../initializers/config");
const constants_1 = require("../initializers/constants");
const logger_1 = require("./logger");
function ffprobePromise(path) {
    return new Promise((res, rej) => {
        ffmpeg.ffprobe(path, (err, data) => {
            if (err)
                return rej(err);
            return res(data);
        });
    });
}
exports.ffprobePromise = ffprobePromise;
function getAudioStream(videoPath, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const data = existingProbe || (yield ffprobePromise(videoPath));
        if (Array.isArray(data.streams)) {
            const audioStream = data.streams.find(stream => stream['codec_type'] === 'audio');
            if (audioStream) {
                return {
                    absolutePath: data.format.filename,
                    audioStream,
                    bitrate: parseInt(audioStream['bit_rate'] + '', 10)
                };
            }
        }
        return { absolutePath: data.format.filename };
    });
}
exports.getAudioStream = getAudioStream;
function getMaxAudioBitrate(type, bitrate) {
    const maxKBitrate = 384;
    const kToBits = (kbits) => kbits * 1000;
    if (!bitrate)
        return 256;
    if (type === 'aac') {
        switch (true) {
            case bitrate > kToBits(maxKBitrate):
                return maxKBitrate;
            default:
                return -1;
        }
    }
    switch (true) {
        case bitrate <= kToBits(192):
            return 128;
        case bitrate <= kToBits(384):
            return 256;
        default:
            return maxKBitrate;
    }
}
exports.getMaxAudioBitrate = getMaxAudioBitrate;
function getVideoStreamSize(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path, existingProbe);
        return videoStream === null
            ? { width: 0, height: 0 }
            : { width: videoStream.width, height: videoStream.height };
    });
}
exports.getVideoStreamSize = getVideoStreamSize;
function getVideoStreamCodec(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path);
        if (!videoStream)
            return '';
        const videoCodec = videoStream.codec_tag_string;
        if (videoCodec === 'vp09')
            return 'vp09.00.50.08';
        const baseProfileMatrix = {
            avc1: {
                High: '6400',
                Main: '4D40',
                Baseline: '42E0'
            },
            av01: {
                High: '1',
                Main: '0',
                Professional: '2'
            }
        };
        let baseProfile = baseProfileMatrix[videoCodec][videoStream.profile];
        if (!baseProfile) {
            logger_1.logger.warn('Cannot get video profile codec of %s.', path, { videoStream });
            baseProfile = baseProfileMatrix[videoCodec]['High'];
        }
        if (videoCodec === 'av01') {
            const level = videoStream.level;
            return `${videoCodec}.${baseProfile}.${level}M.08`;
        }
        let level = videoStream.level.toString(16);
        if (level.length === 1)
            level = `0${level}`;
        return `${videoCodec}.${baseProfile}${level}`;
    });
}
exports.getVideoStreamCodec = getVideoStreamCodec;
function getAudioStreamCodec(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { audioStream } = yield getAudioStream(path, existingProbe);
        if (!audioStream)
            return '';
        const audioCodecName = audioStream.codec_name;
        if (audioCodecName === 'opus')
            return 'opus';
        if (audioCodecName === 'vorbis')
            return 'vorbis';
        if (audioCodecName === 'aac')
            return 'mp4a.40.2';
        logger_1.logger.warn('Cannot get audio codec of %s.', path, { audioStream });
        return 'mp4a.40.2';
    });
}
exports.getAudioStreamCodec = getAudioStreamCodec;
function getVideoFileResolution(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const size = yield getVideoStreamSize(path, existingProbe);
        return {
            videoFileResolution: Math.min(size.height, size.width),
            isPortraitMode: size.height > size.width
        };
    });
}
exports.getVideoFileResolution = getVideoFileResolution;
function getVideoFileFPS(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path, existingProbe);
        if (videoStream === null)
            return 0;
        for (const key of ['avg_frame_rate', 'r_frame_rate']) {
            const valuesText = videoStream[key];
            if (!valuesText)
                continue;
            const [frames, seconds] = valuesText.split('/');
            if (!frames || !seconds)
                continue;
            const result = parseInt(frames, 10) / parseInt(seconds, 10);
            if (result > 0)
                return Math.round(result);
        }
        return 0;
    });
}
exports.getVideoFileFPS = getVideoFileFPS;
function getMetadataFromFile(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const metadata = existingProbe || (yield ffprobePromise(path));
        return new video_file_metadata_1.VideoFileMetadata(metadata);
    });
}
exports.getMetadataFromFile = getMetadataFromFile;
function getVideoFileBitrate(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const metadata = yield getMetadataFromFile(path, existingProbe);
        return metadata.format.bit_rate;
    });
}
exports.getVideoFileBitrate = getVideoFileBitrate;
function getDurationFromVideoFile(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const metadata = yield getMetadataFromFile(path, existingProbe);
        return Math.round(metadata.format.duration);
    });
}
exports.getDurationFromVideoFile = getDurationFromVideoFile;
function getVideoStreamFromFile(path, existingProbe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const metadata = yield getMetadataFromFile(path, existingProbe);
        return metadata.streams.find(s => s.codec_type === 'video') || null;
    });
}
exports.getVideoStreamFromFile = getVideoStreamFromFile;
function computeResolutionsToTranscode(videoFileResolution, type) {
    const configResolutions = type === 'vod'
        ? config_1.CONFIG.TRANSCODING.RESOLUTIONS
        : config_1.CONFIG.LIVE.TRANSCODING.RESOLUTIONS;
    const resolutionsEnabled = [];
    const resolutions = [
        0,
        480,
        360,
        720,
        240,
        1080,
        1440,
        2160
    ];
    for (const resolution of resolutions) {
        if (configResolutions[resolution + 'p'] === true && videoFileResolution > resolution) {
            resolutionsEnabled.push(resolution);
        }
    }
    return resolutionsEnabled;
}
exports.computeResolutionsToTranscode = computeResolutionsToTranscode;
function canDoQuickTranscode(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (config_1.CONFIG.TRANSCODING.PROFILE !== 'default')
            return false;
        const probe = yield ffprobePromise(path);
        return (yield canDoQuickVideoTranscode(path, probe)) &&
            (yield canDoQuickAudioTranscode(path, probe));
    });
}
exports.canDoQuickTranscode = canDoQuickTranscode;
function canDoQuickVideoTranscode(path, probe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path, probe);
        const fps = yield getVideoFileFPS(path, probe);
        const bitRate = yield getVideoFileBitrate(path, probe);
        const resolution = yield getVideoFileResolution(path, probe);
        if (!bitRate)
            return false;
        if (videoStream == null)
            return false;
        if (videoStream['codec_name'] !== 'h264')
            return false;
        if (videoStream['pix_fmt'] !== 'yuv420p')
            return false;
        if (fps < constants_1.VIDEO_TRANSCODING_FPS.MIN || fps > constants_1.VIDEO_TRANSCODING_FPS.MAX)
            return false;
        if (bitRate > videos_1.getMaxBitrate(resolution.videoFileResolution, fps, constants_1.VIDEO_TRANSCODING_FPS))
            return false;
        return true;
    });
}
exports.canDoQuickVideoTranscode = canDoQuickVideoTranscode;
function canDoQuickAudioTranscode(path, probe) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const parsedAudio = yield getAudioStream(path, probe);
        if (!parsedAudio.audioStream)
            return true;
        if (parsedAudio.audioStream['codec_name'] !== 'aac')
            return false;
        const audioBitrate = parsedAudio.bitrate;
        if (!audioBitrate)
            return false;
        const maxAudioBitrate = getMaxAudioBitrate('aac', audioBitrate);
        if (maxAudioBitrate !== -1 && audioBitrate > maxAudioBitrate)
            return false;
        const channelLayout = parsedAudio.audioStream['channel_layout'];
        if (!channelLayout || channelLayout === 'unknown')
            return false;
        return true;
    });
}
exports.canDoQuickAudioTranscode = canDoQuickAudioTranscode;
function getClosestFramerateStandard(fps, type) {
    return constants_1.VIDEO_TRANSCODING_FPS[type].slice(0)
        .sort((a, b) => fps % a - fps % b)[0];
}
exports.getClosestFramerateStandard = getClosestFramerateStandard;
function computeFPS(fpsArg, resolution) {
    let fps = fpsArg;
    if (resolution !== undefined &&
        resolution < constants_1.VIDEO_TRANSCODING_FPS.KEEP_ORIGIN_FPS_RESOLUTION_MIN &&
        fps > constants_1.VIDEO_TRANSCODING_FPS.AVERAGE) {
        fps = getClosestFramerateStandard(fps, 'STANDARD');
    }
    if (fps > constants_1.VIDEO_TRANSCODING_FPS.MAX)
        fps = getClosestFramerateStandard(fps, 'HD_STANDARD');
    else if (fps < constants_1.VIDEO_TRANSCODING_FPS.MIN)
        fps = constants_1.VIDEO_TRANSCODING_FPS.MIN;
    return fps;
}
exports.computeFPS = computeFPS;
