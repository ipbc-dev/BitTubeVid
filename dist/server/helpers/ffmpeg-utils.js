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
const ffmpeg = require("fluent-ffmpeg");
const path_1 = require("path");
const videos_1 = require("../../shared/models/videos");
const constants_1 = require("../initializers/constants");
const image_utils_1 = require("./image-utils");
const logger_1 = require("./logger");
const checker_before_init_1 = require("../initializers/checker-before-init");
const fs_extra_1 = require("fs-extra");
const config_1 = require("../initializers/config");
function computeResolutionsToTranscode(videoFileHeight) {
    const resolutionsEnabled = [];
    const configResolutions = config_1.CONFIG.TRANSCODING.RESOLUTIONS;
    const resolutions = [
        videos_1.VideoResolution.H_NOVIDEO,
        videos_1.VideoResolution.H_480P,
        videos_1.VideoResolution.H_360P,
        videos_1.VideoResolution.H_720P,
        videos_1.VideoResolution.H_240P,
        videos_1.VideoResolution.H_1080P,
        videos_1.VideoResolution.H_4K
    ];
    for (const resolution of resolutions) {
        if (configResolutions[resolution + 'p'] === true && videoFileHeight > resolution) {
            resolutionsEnabled.push(resolution);
        }
    }
    return resolutionsEnabled;
}
exports.computeResolutionsToTranscode = computeResolutionsToTranscode;
function getVideoStreamSize(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path);
        return videoStream === null
            ? { width: 0, height: 0 }
            : { width: videoStream.width, height: videoStream.height };
    });
}
exports.getVideoStreamSize = getVideoStreamSize;
function getVideoStreamCodec(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path);
        if (!videoStream)
            return '';
        const videoCodec = videoStream.codec_tag_string;
        const baseProfileMatrix = {
            'High': '6400',
            'Main': '4D40',
            'Baseline': '42E0'
        };
        let baseProfile = baseProfileMatrix[videoStream.profile];
        if (!baseProfile) {
            logger_1.logger.warn('Cannot get video profile codec of %s.', path, { videoStream });
            baseProfile = baseProfileMatrix['High'];
        }
        const level = videoStream.level.toString(16);
        return `${videoCodec}.${baseProfile}${level}`;
    });
}
exports.getVideoStreamCodec = getVideoStreamCodec;
function getAudioStreamCodec(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const { audioStream } = yield audio.get(path);
        if (!audioStream)
            return '';
        const audioCodec = audioStream.codec_name;
        if (audioCodec === 'aac')
            return 'mp4a.40.2';
        logger_1.logger.warn('Cannot get audio codec of %s.', path, { audioStream });
        return 'mp4a.40.2';
    });
}
exports.getAudioStreamCodec = getAudioStreamCodec;
function getVideoFileResolution(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const size = yield getVideoStreamSize(path);
        return {
            videoFileResolution: Math.min(size.height, size.width),
            isPortraitMode: size.height > size.width
        };
    });
}
exports.getVideoFileResolution = getVideoFileResolution;
function getVideoFileFPS(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path);
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
function getVideoFileBitrate(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res, rej) => {
            ffmpeg.ffprobe(path, (err, metadata) => {
                if (err)
                    return rej(err);
                return res(metadata.format.bit_rate);
            });
        });
    });
}
exports.getVideoFileBitrate = getVideoFileBitrate;
function getDurationFromVideoFile(path) {
    return new Promise((res, rej) => {
        ffmpeg.ffprobe(path, (err, metadata) => {
            if (err)
                return rej(err);
            return res(Math.floor(metadata.format.duration));
        });
    });
}
exports.getDurationFromVideoFile = getDurationFromVideoFile;
function generateImageFromVideoFile(fromPath, folder, imageName, size) {
    return __awaiter(this, void 0, void 0, function* () {
        const pendingImageName = 'pending-' + imageName;
        const options = {
            filename: pendingImageName,
            count: 1,
            folder
        };
        const pendingImagePath = path_1.join(folder, pendingImageName);
        try {
            yield new Promise((res, rej) => {
                ffmpeg(fromPath, { niceness: constants_1.FFMPEG_NICE.THUMBNAIL })
                    .on('error', rej)
                    .on('end', () => res(imageName))
                    .thumbnail(options);
            });
            const destination = path_1.join(folder, imageName);
            yield image_utils_1.processImage(pendingImagePath, destination, size);
        }
        catch (err) {
            logger_1.logger.error('Cannot generate image from video %s.', fromPath, { err });
            try {
                yield fs_extra_1.remove(pendingImagePath);
            }
            catch (err) {
                logger_1.logger.debug('Cannot remove pending image path after generation error.', { err });
            }
        }
    });
}
exports.generateImageFromVideoFile = generateImageFromVideoFile;
function transcode(options) {
    return new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
        try {
            let command = ffmpeg(options.inputPath, { niceness: constants_1.FFMPEG_NICE.TRANSCODING })
                .output(options.outputPath);
            if (options.type === 'quick-transcode') {
                command = yield buildQuickTranscodeCommand(command);
            }
            else if (options.type === 'hls') {
                command = yield buildHLSCommand(command, options);
            }
            else if (options.type === 'merge-audio') {
                command = yield buildAudioMergeCommand(command, options);
            }
            else if (options.type === 'only-audio') {
                command = yield buildOnlyAudioCommand(command, options);
            }
            else {
                command = yield buildx264Command(command, options);
            }
            if (config_1.CONFIG.TRANSCODING.THREADS > 0) {
                command = command.outputOption('-threads ' + config_1.CONFIG.TRANSCODING.THREADS);
            }
            command
                .on('error', (err, stdout, stderr) => {
                logger_1.logger.error('Error in transcoding job.', { stdout, stderr });
                return rej(err);
            })
                .on('end', () => {
                return fixHLSPlaylistIfNeeded(options)
                    .then(() => res())
                    .catch(err => rej(err));
            })
                .run();
        }
        catch (err) {
            return rej(err);
        }
    }));
}
exports.transcode = transcode;
function canDoQuickTranscode(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path);
        const parsedAudio = yield audio.get(path);
        const fps = yield getVideoFileFPS(path);
        const bitRate = yield getVideoFileBitrate(path);
        const resolution = yield getVideoFileResolution(path);
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
        if (parsedAudio.audioStream) {
            if (parsedAudio.audioStream['codec_name'] !== 'aac')
                return false;
            const maxAudioBitrate = audio.bitrate['aac'](parsedAudio.audioStream['bit_rate']);
            if (maxAudioBitrate !== -1 && parsedAudio.audioStream['bit_rate'] > maxAudioBitrate)
                return false;
        }
        return true;
    });
}
exports.canDoQuickTranscode = canDoQuickTranscode;
function buildx264Command(command, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let fps = yield getVideoFileFPS(options.inputPath);
        if (options.resolution !== undefined &&
            options.resolution < constants_1.VIDEO_TRANSCODING_FPS.KEEP_ORIGIN_FPS_RESOLUTION_MIN &&
            fps > constants_1.VIDEO_TRANSCODING_FPS.AVERAGE) {
            fps = constants_1.VIDEO_TRANSCODING_FPS.AVERAGE;
        }
        command = yield presetH264(command, options.inputPath, options.resolution, fps);
        if (options.resolution !== undefined) {
            const size = options.isPortraitMode === true ? `${options.resolution}x?` : `?x${options.resolution}`;
            command = command.size(size);
        }
        if (fps) {
            if (fps > constants_1.VIDEO_TRANSCODING_FPS.MAX)
                fps = constants_1.VIDEO_TRANSCODING_FPS.MAX;
            else if (fps < constants_1.VIDEO_TRANSCODING_FPS.MIN)
                fps = constants_1.VIDEO_TRANSCODING_FPS.MIN;
            command = command.withFPS(fps);
        }
        return command;
    });
}
function buildAudioMergeCommand(command, options) {
    return __awaiter(this, void 0, void 0, function* () {
        command = command.loop(undefined);
        command = yield presetH264VeryFast(command, options.audioPath, options.resolution);
        command = command.input(options.audioPath)
            .videoFilter('scale=trunc(iw/2)*2:trunc(ih/2)*2')
            .outputOption('-tune stillimage')
            .outputOption('-shortest');
        return command;
    });
}
function buildOnlyAudioCommand(command, options) {
    return __awaiter(this, void 0, void 0, function* () {
        command = yield presetOnlyAudio(command);
        return command;
    });
}
function buildQuickTranscodeCommand(command) {
    return __awaiter(this, void 0, void 0, function* () {
        command = yield presetCopy(command);
        command = command.outputOption('-map_metadata -1')
            .outputOption('-movflags faststart');
        return command;
    });
}
function buildHLSCommand(command, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPath = getHLSVideoPath(options);
        if (options.copyCodecs)
            command = yield presetCopy(command);
        else
            command = yield buildx264Command(command, options);
        command = command.outputOption('-hls_time 4')
            .outputOption('-hls_list_size 0')
            .outputOption('-hls_playlist_type vod')
            .outputOption('-hls_segment_filename ' + videoPath)
            .outputOption('-hls_segment_type fmp4')
            .outputOption('-f hls')
            .outputOption('-hls_flags single_file');
        return command;
    });
}
function getHLSVideoPath(options) {
    return `${path_1.dirname(options.outputPath)}/${options.hlsPlaylist.videoFilename}`;
}
function fixHLSPlaylistIfNeeded(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options.type !== 'hls')
            return;
        const fileContent = yield fs_extra_1.readFile(options.outputPath);
        const videoFileName = options.hlsPlaylist.videoFilename;
        const videoFilePath = getHLSVideoPath(options);
        const newContent = fileContent.toString()
            .replace(`#EXT-X-MAP:URI="${videoFilePath}",`, `#EXT-X-MAP:URI="${videoFileName}",`);
        yield fs_extra_1.writeFile(options.outputPath, newContent);
    });
}
function getVideoStreamFromFile(path) {
    return new Promise((res, rej) => {
        ffmpeg.ffprobe(path, (err, metadata) => {
            if (err)
                return rej(err);
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            return res(videoStream || null);
        });
    });
}
function presetH264VeryFast(command, input, resolution, fps) {
    return __awaiter(this, void 0, void 0, function* () {
        let localCommand = yield presetH264(command, input, resolution, fps);
        localCommand = localCommand.outputOption('-preset:v veryfast');
        return localCommand;
    });
}
var audio;
(function (audio) {
    audio.get = (videoPath) => {
        return new Promise((res, rej) => {
            function parseFfprobe(err, data) {
                if (err)
                    return rej(err);
                if ('streams' in data) {
                    const audioStream = data.streams.find(stream => stream['codec_type'] === 'audio');
                    if (audioStream) {
                        return res({
                            absolutePath: data.format.filename,
                            audioStream
                        });
                    }
                }
                return res({ absolutePath: data.format.filename });
            }
            return ffmpeg.ffprobe(videoPath, parseFfprobe);
        });
    };
    let bitrate;
    (function (bitrate_1) {
        const baseKbitrate = 384;
        const toBits = (kbits) => kbits * 8000;
        bitrate_1.aac = (bitrate) => {
            switch (true) {
                case bitrate > toBits(baseKbitrate):
                    return baseKbitrate;
                default:
                    return -1;
            }
        };
        bitrate_1.mp3 = (bitrate) => {
            switch (true) {
                case bitrate <= toBits(192):
                    return 128;
                case bitrate <= toBits(384):
                    return 256;
                default:
                    return baseKbitrate;
            }
        };
    })(bitrate = audio.bitrate || (audio.bitrate = {}));
})(audio || (audio = {}));
exports.audio = audio;
function presetH264(command, input, resolution, fps) {
    return __awaiter(this, void 0, void 0, function* () {
        let localCommand = command
            .format('mp4')
            .videoCodec('libx264')
            .outputOption('-level 3.1')
            .outputOption('-b_strategy 1')
            .outputOption('-bf 16')
            .outputOption('-pix_fmt yuv420p')
            .outputOption('-map_metadata -1')
            .outputOption('-movflags faststart');
        const parsedAudio = yield audio.get(input);
        if (!parsedAudio.audioStream) {
            localCommand = localCommand.noAudio();
        }
        else if ((yield checker_before_init_1.checkFFmpegEncoders()).get('libfdk_aac')) {
            localCommand = localCommand
                .audioCodec('libfdk_aac')
                .audioQuality(5);
        }
        else {
            localCommand = localCommand.audioCodec('aac');
            const audioCodecName = parsedAudio.audioStream['codec_name'];
            if (audio.bitrate[audioCodecName]) {
                const bitrate = audio.bitrate[audioCodecName](parsedAudio.audioStream['bit_rate']);
                if (bitrate !== undefined && bitrate !== -1)
                    localCommand = localCommand.audioBitrate(bitrate);
            }
        }
        if (fps) {
            const targetBitrate = videos_1.getTargetBitrate(resolution, fps, constants_1.VIDEO_TRANSCODING_FPS);
            localCommand = localCommand.outputOptions([`-maxrate ${targetBitrate}`, `-bufsize ${targetBitrate * 2}`]);
            localCommand = localCommand.outputOption(`-g ${fps * 2}`);
        }
        return localCommand;
    });
}
function presetCopy(command) {
    return __awaiter(this, void 0, void 0, function* () {
        return command
            .format('mp4')
            .videoCodec('copy')
            .audioCodec('copy');
    });
}
function presetOnlyAudio(command) {
    return __awaiter(this, void 0, void 0, function* () {
        return command
            .format('mp4')
            .audioCodec('copy')
            .noVideo();
    });
}
