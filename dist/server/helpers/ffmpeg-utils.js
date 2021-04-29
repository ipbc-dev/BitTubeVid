"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildx264VODCommand = exports.resetSupportedEncoders = exports.runCommand = exports.transcode = exports.generateImageFromVideoFile = exports.processGIF = exports.convertWebPToJPG = exports.buildStreamSuffix = exports.getLiveMuxingCommand = exports.getLiveTranscodingCommand = void 0;
const tslib_1 = require("tslib");
const ffmpeg = require("fluent-ffmpeg");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const constants_1 = require("@server/initializers/constants");
const config_1 = require("../initializers/config");
const core_utils_1 = require("./core-utils");
const ffprobe_utils_1 = require("./ffprobe-utils");
const image_utils_1 = require("./image-utils");
const logger_1 = require("./logger");
let supportedEncoders;
function checkFFmpegEncoders(peertubeAvailableEncoders) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (supportedEncoders !== undefined) {
            return supportedEncoders;
        }
        const getAvailableEncodersPromise = core_utils_1.promisify0(ffmpeg.getAvailableEncoders);
        const availableFFmpegEncoders = yield getAvailableEncodersPromise();
        const searchEncoders = new Set();
        for (const type of ['live', 'vod']) {
            for (const streamType of ['audio', 'video']) {
                for (const encoder of peertubeAvailableEncoders.encodersToTry[type][streamType]) {
                    searchEncoders.add(encoder);
                }
            }
        }
        supportedEncoders = new Map();
        for (const searchEncoder of searchEncoders) {
            supportedEncoders.set(searchEncoder, availableFFmpegEncoders[searchEncoder] !== undefined);
        }
        logger_1.logger.info('Built supported ffmpeg encoders.', { supportedEncoders, searchEncoders });
        return supportedEncoders;
    });
}
function resetSupportedEncoders() {
    supportedEncoders = undefined;
}
exports.resetSupportedEncoders = resetSupportedEncoders;
function convertWebPToJPG(path, destination) {
    const command = ffmpeg(path, { niceness: constants_1.FFMPEG_NICE.THUMBNAIL })
        .output(destination);
    return runCommand({ command, silent: true });
}
exports.convertWebPToJPG = convertWebPToJPG;
function processGIF(path, destination, newSize) {
    const command = ffmpeg(path, { niceness: constants_1.FFMPEG_NICE.THUMBNAIL })
        .fps(20)
        .size(`${newSize.width}x${newSize.height}`)
        .output(destination);
    return runCommand({ command });
}
exports.processGIF = processGIF;
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
const builders = {
    'quick-transcode': buildQuickTranscodeCommand,
    'hls': buildHLSVODCommand,
    'hls-from-ts': buildHLSVODFromTSCommand,
    'merge-audio': buildAudioMergeCommand,
    'only-audio': buildOnlyAudioCommand,
    'video': buildx264VODCommand
};
function transcode(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.debug('Will run transcode.', { options });
        let command = getFFmpeg(options.inputPath, 'vod')
            .output(options.outputPath);
        command = yield builders[options.type](command, options);
        yield runCommand({ command, job: options.job });
        yield fixHLSPlaylistIfNeeded(options);
    });
}
exports.transcode = transcode;
function getLiveTranscodingCommand(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { rtmpUrl, outPath, resolutions, fps, availableEncoders, profile } = options;
        const input = rtmpUrl;
        const command = getFFmpeg(input, 'live');
        const varStreamMap = [];
        command.complexFilter([
            {
                inputs: '[v:0]',
                filter: 'split',
                options: resolutions.length,
                outputs: resolutions.map(r => `vtemp${r}`)
            },
            ...resolutions.map(r => ({
                inputs: `vtemp${r}`,
                filter: 'vpp_qsv',
                options: `w=-1:h=${r}`,
                outputs: `vout${r}`
            }))
        ]);
        command.outputOption('-preset superfast');
        command.outputOption('-sc_threshold 0');
        command.videoCodec('h264_qsv');
        addDefaultEncoderGlobalParams({ command });
        for (let i = 0; i < resolutions.length; i++) {
            const resolution = resolutions[i];
            const resolutionFPS = ffprobe_utils_1.computeFPS(fps, resolution);
            const baseEncoderBuilderParams = {
                input,
                availableEncoders,
                profile,
                fps: resolutionFPS,
                resolution,
                streamNum: i,
                videoType: 'live'
            };
            {
                const streamType = 'video';
                const builderResult = yield getEncoderBuilderResult(Object.assign({}, baseEncoderBuilderParams, { streamType }));
                if (!builderResult) {
                    throw new Error('No available live video encoder found');
                }
                command.outputOption(`-map [vout${resolution}]`);
                addDefaultEncoderParams({ command, encoder: builderResult.encoder, fps: resolutionFPS, streamNum: i });
                logger_1.logger.debug('Apply ffmpeg live video params from %s using %s profile.', builderResult.encoder, profile, builderResult);
                command.outputOption(`${buildStreamSuffix('-c:v', i)} ${builderResult.encoder}`);
                command.addOutputOptions(builderResult.result.outputOptions);
            }
            {
                const streamType = 'audio';
                const builderResult = yield getEncoderBuilderResult(Object.assign({}, baseEncoderBuilderParams, { streamType }));
                if (!builderResult) {
                    throw new Error('No available live audio encoder found');
                }
                command.outputOption('-map a:0');
                addDefaultEncoderParams({ command, encoder: builderResult.encoder, fps: resolutionFPS, streamNum: i });
                logger_1.logger.debug('Apply ffmpeg live audio params from %s using %s profile.', builderResult.encoder, profile, builderResult);
                command.outputOption(`${buildStreamSuffix('-c:a', i)} ${builderResult.encoder}`);
                command.addOutputOptions(builderResult.result.outputOptions);
            }
            varStreamMap.push(`v:${i},a:${i}`);
        }
        addDefaultLiveHLSParams(command, outPath);
        command.outputOption('-var_stream_map', varStreamMap.join(' '));
        return command;
    });
}
exports.getLiveTranscodingCommand = getLiveTranscodingCommand;
function getLiveMuxingCommand(rtmpUrl, outPath) {
    const command = getFFmpeg(rtmpUrl, 'live');
    command.outputOption('-c:v copy');
    command.outputOption('-c:a copy');
    command.outputOption('-map 0:a?');
    command.outputOption('-map 0:v?');
    addDefaultLiveHLSParams(command, outPath);
    return command;
}
exports.getLiveMuxingCommand = getLiveMuxingCommand;
function buildStreamSuffix(base, streamNum) {
    if (streamNum !== undefined) {
        return `${base}:${streamNum}`;
    }
    return base;
}
exports.buildStreamSuffix = buildStreamSuffix;
function addDefaultEncoderGlobalParams(options) {
    const { command } = options;
    command.outputOption('-max_muxing_queue_size 1024')
        .outputOption('-map_metadata -1')
        .outputOption('-b_strategy 1')
        .outputOption('-bf 16');
}
function addDefaultEncoderParams(options) {
    const { command, encoder, fps, streamNum } = options;
    if (encoder === 'libx264' || encoder === 'h264_qsv') {
        command.outputOption(buildStreamSuffix('-level:v', streamNum) + ' 3.1');
        if (fps) {
            command.outputOption(buildStreamSuffix('-g:v', streamNum) + ' ' + (fps * 2));
        }
    }
}
function addDefaultLiveHLSParams(command, outPath) {
    command.outputOption('-hls_time ' + constants_1.VIDEO_LIVE.SEGMENT_TIME_SECONDS);
    command.outputOption('-hls_list_size ' + constants_1.VIDEO_LIVE.SEGMENTS_LIST_SIZE);
    command.outputOption('-hls_flags delete_segments+independent_segments');
    command.outputOption(`-hls_segment_filename ${path_1.join(outPath, '%v-%06d.ts')}`);
    command.outputOption('-master_pl_name master.m3u8');
    command.outputOption(`-f hls`);
    command.output(path_1.join(outPath, '%v.m3u8'));
}
function buildx264VODCommand(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let fps = yield ffprobe_utils_1.getVideoFileFPS(options.inputPath);
        fps = ffprobe_utils_1.computeFPS(fps, options.resolution);
        command = yield presetVideo(command, options.inputPath, options, fps);
        if (options.resolution !== undefined && options.inputPath.includes('.mp4')) {
            const size = options.isPortraitMode === true ? `vpp_qsv=w=${options.resolution}:h=w*ch/cw` : `vpp_qsv=w=h*cw/ch:h=${options.resolution}`;
            command = command.videoFilter(size);
        }
        else if (options.resolution !== undefined) {
            const size = options.isPortraitMode === true
                ? `${options.resolution}x?`
                : `?x${options.resolution}`;
            command = command.size(size);
        }
        return command;
    });
}
exports.buildx264VODCommand = buildx264VODCommand;
function buildAudioMergeCommand(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        command = command.loop(undefined);
        command = yield presetVideo(command, options.audioPath, options);
        command.outputOption('-preset:v veryfast');
        command = command.input(options.audioPath)
            .videoFilter('scale=trunc(iw/2)*2:trunc(ih/2)*2')
            .outputOption('-tune stillimage')
            .outputOption('-shortest');
        return command;
    });
}
function buildOnlyAudioCommand(command, _options) {
    command = presetOnlyAudio(command);
    return command;
}
function buildQuickTranscodeCommand(command) {
    command = presetCopy(command);
    command = command.outputOption('-map_metadata -1')
        .outputOption('-movflags faststart');
    return command;
}
function addCommonHLSVODCommandOptions(command, outputPath) {
    return command.outputOption('-hls_time 4')
        .outputOption('-hls_list_size 0')
        .outputOption('-hls_playlist_type vod')
        .outputOption('-hls_segment_filename ' + outputPath)
        .outputOption('-hls_segment_type fmp4')
        .outputOption('-f hls')
        .outputOption('-hls_flags single_file');
}
function buildHLSVODCommand(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoPath = getHLSVideoPath(options);
        if (options.copyCodecs)
            command = presetCopy(command);
        else if (options.resolution === 0)
            command = presetOnlyAudio(command);
        else
            command = yield buildx264VODCommand(command, options);
        addCommonHLSVODCommandOptions(command, videoPath);
        return command;
    });
}
function buildHLSVODFromTSCommand(command, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoPath = getHLSVideoPath(options);
        command.outputOption('-c copy');
        if (options.isAAC) {
            command.outputOption('-bsf:a aac_adtstoasc');
        }
        addCommonHLSVODCommandOptions(command, videoPath);
        return command;
    });
}
function fixHLSPlaylistIfNeeded(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (options.type !== 'hls' && options.type !== 'hls-from-ts')
            return;
        const fileContent = yield fs_extra_1.readFile(options.outputPath);
        const videoFileName = options.hlsPlaylist.videoFilename;
        const videoFilePath = getHLSVideoPath(options);
        const newContent = fileContent.toString()
            .replace(`#EXT-X-MAP:URI="${videoFilePath}",`, `#EXT-X-MAP:URI="${videoFileName}",`);
        yield fs_extra_1.writeFile(options.outputPath, newContent);
    });
}
function getHLSVideoPath(options) {
    return `${path_1.dirname(options.outputPath)}/${options.hlsPlaylist.videoFilename}`;
}
function getEncoderBuilderResult(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { availableEncoders, input, profile, resolution, streamType, fps, streamNum, videoType } = options;
        const encodersToTry = availableEncoders.encodersToTry[videoType][streamType];
        const encoders = availableEncoders.available[videoType];
        for (const encoder of encodersToTry) {
            if (!(yield checkFFmpegEncoders(availableEncoders)).get(encoder)) {
                logger_1.logger.debug('Encoder %s not available in ffmpeg, skipping.', encoder);
                continue;
            }
            if (!encoders[encoder]) {
                logger_1.logger.debug('Encoder %s not available in peertube encoders, skipping.', encoder);
                continue;
            }
            const builderProfiles = encoders[encoder];
            let builder = builderProfiles[profile];
            if (!builder) {
                logger_1.logger.debug('Profile %s for encoder %s not available. Fallback to default.', profile, encoder);
                builder = builderProfiles.default;
                if (!builder) {
                    logger_1.logger.debug('Default profile for encoder %s not available. Try next available encoder.', encoder);
                    continue;
                }
            }
            const result = yield builder({ input, resolution: resolution, fps, streamNum });
            return {
                result,
                encoder: result.copy === true
                    ? 'copy'
                    : encoder
            };
        }
        return null;
    });
}
function presetVideo(command, input, transcodeOptions, fps) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let localCommand = command
            .format('mp4')
            .outputOption('-movflags faststart');
        addDefaultEncoderGlobalParams({ command });
        const parsedAudio = yield ffprobe_utils_1.getAudioStream(input);
        let streamsToProcess = ['audio', 'video'];
        if (!parsedAudio.audioStream) {
            localCommand = localCommand.noAudio();
            streamsToProcess = ['video'];
        }
        for (const streamType of streamsToProcess) {
            const { profile, resolution, availableEncoders } = transcodeOptions;
            const builderResult = yield getEncoderBuilderResult({
                streamType,
                input,
                resolution,
                availableEncoders,
                profile,
                fps,
                videoType: 'vod'
            });
            if (!builderResult) {
                throw new Error('No available encoder found for stream ' + streamType);
            }
            logger_1.logger.debug('Apply ffmpeg params from %s for %s stream of input %s using %s profile.', builderResult.encoder, streamType, input, profile, builderResult);
            if (streamType === 'video') {
                if (input.includes('.mp4')) {
                    command.inputOption(['-hwaccel qsv', '-c:v h264_qsv']);
                    localCommand.videoCodec('h264_qsv');
                }
                else {
                    localCommand.videoCodec(builderResult.encoder);
                }
            }
            else if (streamType === 'audio') {
                localCommand.audioCodec(builderResult.encoder);
            }
            command.addOutputOptions(builderResult.result.outputOptions);
            addDefaultEncoderParams({ command: localCommand, encoder: builderResult.encoder, fps });
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
function getFFmpeg(input, type) {
    const command = ffmpeg(input, {
        niceness: type === 'live' ? constants_1.FFMPEG_NICE.LIVE : constants_1.FFMPEG_NICE.VOD,
        cwd: config_1.CONFIG.STORAGE.TMP_DIR
    });
    const threads = type === 'live'
        ? config_1.CONFIG.LIVE.TRANSCODING.THREADS
        : config_1.CONFIG.TRANSCODING.THREADS;
    if (threads > 0) {
        command.outputOption('-threads ' + threads);
    }
    return command;
}
function runCommand(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { command, silent = false, job } = options;
        return new Promise((res, rej) => {
            command.on('error', (err, stdout, stderr) => {
                if (silent !== true)
                    logger_1.logger.error('Error in ffmpeg.', { stdout, stderr });
                rej(err);
            });
            command.on('end', (stdout, stderr) => {
                logger_1.logger.debug('FFmpeg command ended.', { stdout, stderr });
                res();
            });
            if (job) {
                command.on('progress', progress => {
                    if (!progress.percent)
                        return;
                    job.progress(Math.round(progress.percent))
                        .catch(err => logger_1.logger.warn('Cannot set ffmpeg job progress.', { err }));
                });
            }
            command.run();
        });
    });
}
exports.runCommand = runCommand;
