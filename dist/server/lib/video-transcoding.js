"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnabledResolutions = exports.mergeAudioVideofile = exports.transcodeNewWebTorrentResolution = exports.optimizeOriginalVideofile = exports.generateHlsPlaylistResolutionFromTS = exports.generateHlsPlaylistResolution = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const webtorrent_1 = require("@server/helpers/webtorrent");
const ffmpeg_utils_1 = require("../helpers/ffmpeg-utils");
const ffprobe_utils_1 = require("../helpers/ffprobe-utils");
const logger_1 = require("../helpers/logger");
const config_1 = require("../initializers/config");
const constants_1 = require("../initializers/constants");
const video_file_1 = require("../models/video/video-file");
const video_streaming_playlist_1 = require("../models/video/video-streaming-playlist");
const hls_1 = require("./hls");
const video_paths_1 = require("./video-paths");
const video_transcoding_profiles_1 = require("./video-transcoding-profiles");
function optimizeOriginalVideofile(video, inputVideoFile, job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const transcodeDirectory = config_1.CONFIG.STORAGE.TMP_DIR;
        const newExtname = '.mp4';
        const videoInputPath = video_paths_1.getVideoFilePath(video, inputVideoFile);
        const videoTranscodedPath = path_1.join(transcodeDirectory, video.id + '-transcoded' + newExtname);
        const transcodeType = (yield ffprobe_utils_1.canDoQuickTranscode(videoInputPath))
            ? 'quick-transcode'
            : 'video';
        const transcodeOptions = {
            type: transcodeType,
            inputPath: videoInputPath,
            outputPath: videoTranscodedPath,
            availableEncoders: video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.getAvailableEncoders(),
            profile: config_1.CONFIG.TRANSCODING.PROFILE,
            resolution: inputVideoFile.resolution,
            job
        };
        yield ffmpeg_utils_1.transcode(transcodeOptions);
        try {
            yield fs_extra_1.remove(videoInputPath);
            inputVideoFile.extname = newExtname;
            inputVideoFile.filename = video_paths_1.generateVideoFilename(video, false, inputVideoFile.resolution, newExtname);
            const videoOutputPath = video_paths_1.getVideoFilePath(video, inputVideoFile);
            yield onWebTorrentVideoFileTranscoding(video, inputVideoFile, videoTranscodedPath, videoOutputPath);
            return transcodeType;
        }
        catch (err) {
            video.destroy().catch(err => logger_1.logger.error('Cannot destruct video after transcoding failure.', { err }));
            throw err;
        }
    });
}
exports.optimizeOriginalVideofile = optimizeOriginalVideofile;
function transcodeNewWebTorrentResolution(video, resolution, isPortrait, job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const transcodeDirectory = config_1.CONFIG.STORAGE.TMP_DIR;
        const extname = '.mp4';
        const videoInputPath = video_paths_1.getVideoFilePath(video, video.getMaxQualityFile());
        const newVideoFile = new video_file_1.VideoFileModel({
            resolution,
            extname,
            filename: video_paths_1.generateVideoFilename(video, false, resolution, extname),
            size: 0,
            videoId: video.id
        });
        const videoOutputPath = video_paths_1.getVideoFilePath(video, newVideoFile);
        const videoTranscodedPath = path_1.join(transcodeDirectory, newVideoFile.filename);
        const transcodeOptions = resolution === 0
            ? {
                type: 'only-audio',
                inputPath: videoInputPath,
                outputPath: videoTranscodedPath,
                availableEncoders: video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.getAvailableEncoders(),
                profile: config_1.CONFIG.TRANSCODING.PROFILE,
                resolution,
                job
            }
            : {
                type: 'video',
                inputPath: videoInputPath,
                outputPath: videoTranscodedPath,
                availableEncoders: video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.getAvailableEncoders(),
                profile: config_1.CONFIG.TRANSCODING.PROFILE,
                resolution,
                isPortraitMode: isPortrait,
                job
            };
        yield ffmpeg_utils_1.transcode(transcodeOptions);
        return onWebTorrentVideoFileTranscoding(video, newVideoFile, videoTranscodedPath, videoOutputPath);
    });
}
exports.transcodeNewWebTorrentResolution = transcodeNewWebTorrentResolution;
function mergeAudioVideofile(video, resolution, job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const transcodeDirectory = config_1.CONFIG.STORAGE.TMP_DIR;
        const newExtname = '.mp4';
        const inputVideoFile = video.getMinQualityFile();
        const audioInputPath = video_paths_1.getVideoFilePath(video, inputVideoFile);
        const videoTranscodedPath = path_1.join(transcodeDirectory, video.id + '-transcoded' + newExtname);
        const previewPath = video.getPreview().getPath();
        const tmpPreviewPath = path_1.join(config_1.CONFIG.STORAGE.TMP_DIR, path_1.basename(previewPath));
        yield fs_extra_1.copyFile(previewPath, tmpPreviewPath);
        const transcodeOptions = {
            type: 'merge-audio',
            inputPath: tmpPreviewPath,
            outputPath: videoTranscodedPath,
            availableEncoders: video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.getAvailableEncoders(),
            profile: config_1.CONFIG.TRANSCODING.PROFILE,
            audioPath: audioInputPath,
            resolution,
            job
        };
        try {
            yield ffmpeg_utils_1.transcode(transcodeOptions);
            yield fs_extra_1.remove(audioInputPath);
            yield fs_extra_1.remove(tmpPreviewPath);
        }
        catch (err) {
            yield fs_extra_1.remove(tmpPreviewPath);
            throw err;
        }
        inputVideoFile.extname = newExtname;
        inputVideoFile.filename = video_paths_1.generateVideoFilename(video, false, inputVideoFile.resolution, newExtname);
        const videoOutputPath = video_paths_1.getVideoFilePath(video, inputVideoFile);
        video.duration = yield ffprobe_utils_1.getDurationFromVideoFile(videoTranscodedPath);
        yield video.save();
        return onWebTorrentVideoFileTranscoding(video, inputVideoFile, videoTranscodedPath, videoOutputPath);
    });
}
exports.mergeAudioVideofile = mergeAudioVideofile;
function generateHlsPlaylistResolutionFromTS(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return generateHlsPlaylistCommon({
            video: options.video,
            resolution: options.resolution,
            isPortraitMode: options.isPortraitMode,
            inputPath: options.concatenatedTsFilePath,
            type: 'hls-from-ts',
            isAAC: options.isAAC
        });
    });
}
exports.generateHlsPlaylistResolutionFromTS = generateHlsPlaylistResolutionFromTS;
function generateHlsPlaylistResolution(options) {
    return generateHlsPlaylistCommon({
        video: options.video,
        resolution: options.resolution,
        copyCodecs: options.copyCodecs,
        isPortraitMode: options.isPortraitMode,
        inputPath: options.videoInputPath,
        type: 'hls',
        job: options.job
    });
}
exports.generateHlsPlaylistResolution = generateHlsPlaylistResolution;
function getEnabledResolutions(type) {
    const transcoding = type === 'vod'
        ? config_1.CONFIG.TRANSCODING
        : config_1.CONFIG.LIVE.TRANSCODING;
    return Object.keys(transcoding.RESOLUTIONS)
        .filter(key => transcoding.ENABLED && transcoding.RESOLUTIONS[key] === true)
        .map(r => parseInt(r, 10));
}
exports.getEnabledResolutions = getEnabledResolutions;
function onWebTorrentVideoFileTranscoding(video, videoFile, transcodingPath, outputPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const stats = yield fs_extra_1.stat(transcodingPath);
        const fps = yield ffprobe_utils_1.getVideoFileFPS(transcodingPath);
        const metadata = yield ffprobe_utils_1.getMetadataFromFile(transcodingPath);
        yield fs_extra_1.move(transcodingPath, outputPath, { overwrite: true });
        videoFile.size = stats.size;
        videoFile.fps = fps;
        videoFile.metadata = metadata;
        yield webtorrent_1.createTorrentAndSetInfoHash(video, videoFile);
        yield video_file_1.VideoFileModel.customUpsert(videoFile, 'video', undefined);
        video.VideoFiles = yield video.$get('VideoFiles');
        return video;
    });
}
function generateHlsPlaylistCommon(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { type, video, inputPath, resolution, copyCodecs, isPortraitMode, isAAC, job } = options;
        const transcodeDirectory = config_1.CONFIG.STORAGE.TMP_DIR;
        const videoTranscodedBasePath = path_1.join(transcodeDirectory, type);
        yield fs_extra_1.ensureDir(videoTranscodedBasePath);
        const videoFilename = video_paths_1.generateVideoStreamingPlaylistName(video.uuid, resolution);
        const playlistFilename = video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsPlaylistFilename(resolution);
        const playlistFileTranscodePath = path_1.join(videoTranscodedBasePath, playlistFilename);
        const transcodeOptions = {
            type,
            inputPath,
            outputPath: playlistFileTranscodePath,
            availableEncoders: video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.getAvailableEncoders(),
            profile: config_1.CONFIG.TRANSCODING.PROFILE,
            resolution,
            copyCodecs,
            isPortraitMode,
            isAAC,
            hlsPlaylist: {
                videoFilename
            },
            job
        };
        yield ffmpeg_utils_1.transcode(transcodeOptions);
        const playlistUrl = constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsMasterPlaylistStaticPath(video.uuid);
        const [videoStreamingPlaylist] = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.upsert({
            videoId: video.id,
            playlistUrl,
            segmentsSha256Url: constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsSha256SegmentsStaticPath(video.uuid, video.isLive),
            p2pMediaLoaderInfohashes: [],
            p2pMediaLoaderPeerVersion: constants_1.P2P_MEDIA_LOADER_PEER_VERSION,
            type: 1
        }, { returning: true });
        videoStreamingPlaylist.Video = video;
        const extname = path_1.extname(videoFilename);
        const newVideoFile = new video_file_1.VideoFileModel({
            resolution,
            extname,
            size: 0,
            filename: video_paths_1.generateVideoFilename(video, true, resolution, extname),
            fps: -1,
            videoStreamingPlaylistId: videoStreamingPlaylist.id
        });
        const videoFilePath = video_paths_1.getVideoFilePath(videoStreamingPlaylist, newVideoFile);
        const baseHlsDirectory = path_1.join(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, video.uuid);
        yield fs_extra_1.ensureDir(baseHlsDirectory);
        const playlistPath = path_1.join(baseHlsDirectory, playlistFilename);
        yield fs_extra_1.move(playlistFileTranscodePath, playlistPath, { overwrite: true });
        yield fs_extra_1.move(path_1.join(videoTranscodedBasePath, videoFilename), videoFilePath, { overwrite: true });
        const stats = yield fs_extra_1.stat(videoFilePath);
        newVideoFile.size = stats.size;
        newVideoFile.fps = yield ffprobe_utils_1.getVideoFileFPS(videoFilePath);
        newVideoFile.metadata = yield ffprobe_utils_1.getMetadataFromFile(videoFilePath);
        yield webtorrent_1.createTorrentAndSetInfoHash(videoStreamingPlaylist, newVideoFile);
        yield video_file_1.VideoFileModel.customUpsert(newVideoFile, 'streaming-playlist', undefined);
        videoStreamingPlaylist.VideoFiles = yield videoStreamingPlaylist.$get('VideoFiles');
        videoStreamingPlaylist.p2pMediaLoaderInfohashes = video_streaming_playlist_1.VideoStreamingPlaylistModel.buildP2PMediaLoaderInfoHashes(playlistUrl, videoStreamingPlaylist.VideoFiles);
        yield videoStreamingPlaylist.save();
        video.setHLSPlaylist(videoStreamingPlaylist);
        yield hls_1.updateMasterHLSPlaylist(video);
        yield hls_1.updateSha256VODSegments(video);
        return playlistPath;
    });
}
