"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoTranscodingProfilesManager = void 0;
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
            `-preset veryfast`,
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
            `-preset veryfast`,
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
class VideoTranscodingProfilesManager {
    constructor() {
        this.encodersPriorities = {
            vod: this.buildDefaultEncodersPriorities(),
            live: this.buildDefaultEncodersPriorities()
        };
        this.availableEncoders = {
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
                libx264: {
                    default: defaultX264LiveOptionsBuilder
                },
                aac: {
                    default: defaultAACOptionsBuilder
                }
            }
        };
        this.availableProfiles = {
            vod: [],
            live: []
        };
        this.buildAvailableProfiles();
    }
    getAvailableEncoders() {
        return {
            available: this.availableEncoders,
            encodersToTry: {
                vod: {
                    video: this.getEncodersByPriority('vod', 'video'),
                    audio: this.getEncodersByPriority('vod', 'audio')
                },
                live: {
                    video: this.getEncodersByPriority('live', 'video'),
                    audio: this.getEncodersByPriority('live', 'audio')
                }
            }
        };
    }
    getAvailableProfiles(type) {
        return this.availableProfiles[type];
    }
    addProfile(options) {
        const { type, encoder, profile, builder } = options;
        const encoders = this.availableEncoders[type];
        if (!encoders[encoder])
            encoders[encoder] = {};
        encoders[encoder][profile] = builder;
        this.buildAvailableProfiles();
    }
    removeProfile(options) {
        const { type, encoder, profile } = options;
        delete this.availableEncoders[type][encoder][profile];
        this.buildAvailableProfiles();
    }
    addEncoderPriority(type, streamType, encoder, priority) {
        this.encodersPriorities[type][streamType].push({ name: encoder, priority });
        ffmpeg_utils_1.resetSupportedEncoders();
    }
    removeEncoderPriority(type, streamType, encoder, priority) {
        this.encodersPriorities[type][streamType] = this.encodersPriorities[type][streamType]
            .filter(o => o.name !== encoder && o.priority !== priority);
        ffmpeg_utils_1.resetSupportedEncoders();
    }
    getEncodersByPriority(type, streamType) {
        return this.encodersPriorities[type][streamType]
            .sort((e1, e2) => {
            if (e1.priority > e2.priority)
                return -1;
            else if (e1.priority === e2.priority)
                return 0;
            return 1;
        })
            .map(e => e.name);
    }
    buildAvailableProfiles() {
        for (const type of ['vod', 'live']) {
            const result = new Set();
            const encoders = this.availableEncoders[type];
            for (const encoderName of Object.keys(encoders)) {
                for (const profile of Object.keys(encoders[encoderName])) {
                    result.add(profile);
                }
            }
            this.availableProfiles[type] = Array.from(result);
        }
        logger_1.logger.debug('Available transcoding profiles built.', { availableProfiles: this.availableProfiles });
    }
    buildDefaultEncodersPriorities() {
        return {
            video: [
                { name: 'h264_qsv', priority: 200 },
                { name: 'libx264', priority: 100 }
            ],
            audio: [
                { name: 'libfdk_aac', priority: 200 },
                { name: 'aac', priority: 100 }
            ]
        };
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.VideoTranscodingProfilesManager = VideoTranscodingProfilesManager;
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
