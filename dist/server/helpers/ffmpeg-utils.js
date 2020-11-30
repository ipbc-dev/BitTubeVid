"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canDoQuickTranscode = exports.getVideoFileBitrate = exports.audio = exports.computeResolutionsToTranscode = exports.getVideoFileFPS = exports.transcode = exports.generateImageFromVideoFile = exports.getDurationFromVideoFile = exports.getMetadataFromFile = exports.getVideoFileResolution = exports.getVideoStreamSize = exports.convertWebPToJPG = exports.getAudioStreamCodec = exports.getVideoStreamCodec = void 0;
const tslib_1 = require("tslib");
const ffmpeg = require("fluent-ffmpeg");
const path_1 = require("path");
const videos_1 = require("../../shared/models/videos");
const constants_1 = require("../initializers/constants");
const image_utils_1 = require("./image-utils");
const logger_1 = require("./logger");
const checker_before_init_1 = require("../initializers/checker-before-init");
const fs_extra_1 = require("fs-extra");
const config_1 = require("../initializers/config");
const video_file_metadata_1 = require("@shared/models/videos/video-file-metadata");
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
function computeResolutionsToTranscode(videoFileResolution) {
    const resolutionsEnabled = [];
    const configResolutions = config_1.CONFIG.TRANSCODING.RESOLUTIONS;
    const resolutions = [
        0,
        480,
        360,
        720,
        240,
        1080,
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
function getVideoStreamSize(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoStream = yield getVideoStreamFromFile(path);
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
        const baseProfileMatrix = {
            High: '6400',
            Main: '4D40',
            Baseline: '42E0'
        };
        let baseProfile = baseProfileMatrix[videoStream.profile];
        if (!baseProfile) {
            logger_1.logger.warn('Cannot get video profile codec of %s.', path, { videoStream });
            baseProfile = baseProfileMatrix['High'];
        }
        let level = videoStream.level.toString(16);
        if (level.length === 1)
            level = `0${level}`;
        return `${videoCodec}.${baseProfile}${level}`;
    });
}
exports.getVideoStreamCodec = getVideoStreamCodec;
function getAudioStreamCodec(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const size = yield getVideoStreamSize(path);
        return {
            videoFileResolution: Math.min(size.height, size.width),
            isPortraitMode: size.height > size.width
        };
    });
}
exports.getVideoFileResolution = getVideoFileResolution;
function getVideoFileFPS(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
function getMetadataFromFile(path, cb = metadata => metadata) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((res, rej) => {
            ffmpeg.ffprobe(path, (err, metadata) => {
                if (err)
                    return rej(err);
                return res(cb(new video_file_metadata_1.VideoFileMetadata(metadata)));
            });
        });
    });
}
exports.getMetadataFromFile = getMetadataFromFile;
function getVideoFileBitrate(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return getMetadataFromFile(path, metadata => metadata.format.bit_rate);
    });
}
exports.getVideoFileBitrate = getVideoFileBitrate;
function getDurationFromVideoFile(path) {
    return getMetadataFromFile(path, metadata => Math.floor(metadata.format.duration));
}
exports.getDurationFromVideoFile = getDurationFromVideoFile;
function getVideoStreamFromFile(path) {
    return getMetadataFromFile(path, metadata => metadata.streams.find(s => s.codec_type === 'video') || null);
}
function generateImageFromVideoFile(fromPath, folder, imageName, size) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    return new Promise((res, rej) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            let command = ffmpeg(options.inputPath, { niceness: constants_1.FFMPEG_NICE.TRANSCODING })
                .output(options.outputPath);
            if (options.type === 'quick-transcode') {
                command = buildQuickTranscodeCommand(command);
            }
            else if (options.type === 'hls') {
                command = yield buildHLSCommand(command, options);
            }
            else if (options.type === 'merge-audio') {
                command = yield buildAudioMergeCommand(command, options);
            }
            else if (options.type === 'only-audio') {
                command = buildOnlyAudioCommand(command, options);
            }
            else {
                command = yield buildx264Command(command, options);
            }
            if (config_1.CONFIG.TRANSCODING.THREADS > 0) {
                command = command.outputOption('-threads ' + config_1.CONFIG.TRANSCODING.THREADS);
            }
            command
                .on('error', (err, stdout, stderr) => {
                logger_1.logger.error('Error in transcoding job.', { stdout, stderr, err });
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
function getClosestFramerateStandard(fps, type) {
    return constants_1.VIDEO_TRANSCODING_FPS[type].slice(0)
        .sort((a, b) => fps % a - fps % b)[0];
}
function convertWebPToJPG(path, destination) {
    return new Promise((res, rej) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const command = ffmpeg(path).output(destination);
            command.on('error', (err, stdout, stderr) => {
                logger_1.logger.error('Error in ffmpeg webp convert process.', { stdout, stderr });
                return rej(err);
            })
                .on('end', () => res())
                .run();
        }
        catch (err) {
            return rej(err);
        }
    }));
}
exports.convertWebPToJPG = convertWebPToJPG;
function buildx264Command(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let fps = yield getVideoFileFPS(options.inputPath);
        if (options.resolution !== undefined &&
            options.resolution < constants_1.VIDEO_TRANSCODING_FPS.KEEP_ORIGIN_FPS_RESOLUTION_MIN &&
            fps > constants_1.VIDEO_TRANSCODING_FPS.AVERAGE) {
            fps = getClosestFramerateStandard(fps, 'STANDARD');
        }
        command = yield presetH264(command, options.inputPath, options.resolution, fps);
        if (options.resolution !== undefined) {
            const size = options.isPortraitMode === true ? `vpp_qsv=w=${options.resolution}:h=w*ch/cw` : `vpp_qsv=w=h*cw/ch:h=${options.resolution}`;
            command = command.videoFilter(size);
        }
        if (fps) {
            if (fps > constants_1.VIDEO_TRANSCODING_FPS.MAX)
                fps = getClosestFramerateStandard(fps, 'HD_STANDARD');
            else if (fps < constants_1.VIDEO_TRANSCODING_FPS.MIN)
                fps = constants_1.VIDEO_TRANSCODING_FPS.MIN;
            command = command.withFPS(fps);
        }
        return command;
    });
}
function buildAudioMergeCommand(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        command = command.loop(undefined);
        command = yield presetH264VeryFast(command, options.audioPath, options.resolution);
        command = command.input(options.audioPath)
            .videoFilter('vpp_qsv=trunc(iw/2)*2:trunc(ih/2)*2')
            .outputOption('-tune stillimage')
            .outputOption('-shortest');
        return command;
    });
}
function buildOnlyAudioCommand(command, options) {
    command = presetOnlyAudio(command);
    return command;
}
function buildQuickTranscodeCommand(command) {
    command = presetCopy(command);
    command = command.outputOption('-map_metadata -1')
        .outputOption('-movflags faststart');
    return command;
}
function buildHLSCommand(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoPath = getHLSVideoPath(options);
        if (options.copyCodecs)
            command = presetCopy(command);
        else if (options.resolution === 0)
            command = presetOnlyAudio(command);
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
function presetH264VeryFast(command, input, resolution, fps) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let localCommand = yield presetH264(command, input, resolution, fps);
        if (!input.includes('.mp3') && !input.includes('.wav') && !input.includes('.flac')) {
            localCommand = localCommand.outputOption('-preset:v veryfast');
        }
        return localCommand;
    });
}
function presetH264(command, input, resolution, fps) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let localCommand = command
            .format('mp4')
            .videoCodec('h264_qsv')
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
    return command
        .format('mp4')
        .videoCodec('copy')
        .audioCodec('copy');
}
function presetOnlyAudio(command) {
    return command
        .format('mp4')
        .audioCodec('copy')
        .noVideo();
}
