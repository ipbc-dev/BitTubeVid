"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableEncoders = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("@server/helpers/logger");
const videos_1 = require("../../shared/models/videos");
const ffmpeg_utils_1 = require("../helpers/ffmpeg-utils");
const ffprobe_utils_1 = require("../helpers/ffprobe-utils");
const constants_1 = require("../initializers/constants");
const defaultX264VODOptionsBuilder = ({ input, resolution, fps }) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const targetBitrate = yield buildTargetBitrate({ input, resolution, fps });
    if (!targetBitrate)
        return { outputOptions: [] };
    return {
        outputOptions: [
            `-r ${fps}`,
            `-maxrate ${targetBitrate}`,
            `-bufsize ${targetBitrate * 2}`
        ]
    };
});
const defaultX264LiveOptionsBuilder = ({ resolution, fps, streamNum }) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const targetBitrate = videos_1.getTargetBitrate(resolution, fps, constants_1.VIDEO_TRANSCODING_FPS);
    return {
        outputOptions: [
            `${ffmpeg_utils_1.buildStreamSuffix('-r:v', streamNum)} ${fps}`,
            `${ffmpeg_utils_1.buildStreamSuffix('-b:v', streamNum)} ${targetBitrate}`,
            `-maxrate ${targetBitrate}`,
            `-bufsize ${targetBitrate * 2}`
        ]
    };
});
const defaultAACOptionsBuilder = ({ input, streamNum }) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const probe = yield ffprobe_utils_1.ffprobePromise(input);
    if (yield ffprobe_utils_1.canDoQuickAudioTranscode(input, probe)) {
        logger_1.logger.debug('Copy audio stream %s by AAC encoder.', input);
        return { copy: true, outputOptions: [] };
    }
    const parsedAudio = yield ffprobe_utils_1.getAudioStream(input, probe);
    const audioCodecName = parsedAudio.audioStream['codec_name'];
    const bitrate = ffprobe_utils_1.getMaxAudioBitrate(audioCodecName, parsedAudio.bitrate);
    logger_1.logger.debug('Calculating audio bitrate of %s by AAC encoder.', input, { bitrate: parsedAudio.bitrate, audioCodecName });
    if (bitrate !== undefined && bitrate !== -1) {
        return { outputOptions: [ffmpeg_utils_1.buildStreamSuffix('-b:a', streamNum), bitrate + 'k'] };
    }
    return { outputOptions: [] };
});
const defaultLibFDKAACVODOptionsBuilder = ({ streamNum }) => {
    return { outputOptions: [ffmpeg_utils_1.buildStreamSuffix('-q:a', streamNum), '5'] };
};
const availableEncoders = {
    vod: {
        libx264: {
            default: defaultX264VODOptionsBuilder
        },
        aac: {
            default: defaultAACOptionsBuilder
        },
        libfdk_aac: {
            default: defaultLibFDKAACVODOptionsBuilder
        }
    },
    live: {
        h264_qsv: {
            default: defaultX264LiveOptionsBuilder
        },
        aac: {
            default: defaultAACOptionsBuilder
        }
    }
};
exports.availableEncoders = availableEncoders;
function buildTargetBitrate(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { input, resolution, fps } = options;
        const probe = yield ffprobe_utils_1.ffprobePromise(input);
        const videoStream = yield ffprobe_utils_1.getVideoStreamFromFile(input, probe);
        if (!videoStream)
            return undefined;
        const targetBitrate = videos_1.getTargetBitrate(resolution, fps, constants_1.VIDEO_TRANSCODING_FPS);
        const fileBitrate = yield ffprobe_utils_1.getVideoFileBitrate(input, probe);
        return Math.min(targetBitrate, fileBitrate);
    });
}
