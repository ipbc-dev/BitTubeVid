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
const constants_1 = require("../initializers/constants");
const path_1 = require("path");
const ffmpeg_utils_1 = require("../helpers/ffmpeg-utils");
const fs_extra_1 = require("fs-extra");
const logger_1 = require("../helpers/logger");
const videos_1 = require("../../shared/models/videos");
const video_file_1 = require("../models/video/video-file");
const hls_1 = require("./hls");
const video_streaming_playlist_1 = require("../models/video/video-streaming-playlist");
const video_streaming_playlist_type_1 = require("../../shared/models/videos/video-streaming-playlist.type");
const config_1 = require("../initializers/config");
const webtorrent_1 = require("@server/helpers/webtorrent");
const video_paths_1 = require("./video-paths");
function optimizeOriginalVideofile(video, inputVideoFileArg) {
    return __awaiter(this, void 0, void 0, function* () {
        const transcodeDirectory = config_1.CONFIG.STORAGE.TMP_DIR;
        const newExtname = '.mp4';
        const inputVideoFile = inputVideoFileArg || video.getMaxQualityFile();
        const storageFilePath = video_paths_1.getVideoFilePath(video, inputVideoFile);
        const tmpFilePath = video_paths_1.getInputVideoFilePath(video, inputVideoFile);
        const videoInputPath = (yield fs_extra_1.pathExists(tmpFilePath)) ? tmpFilePath : storageFilePath;
        const videoTranscodedPath = path_1.join(transcodeDirectory, video.id + '-transcoded' + newExtname);
        const transcodeType = (yield ffmpeg_utils_1.canDoQuickTranscode(videoInputPath))
            ? 'quick-transcode'
            : 'video';
        const transcodeOptions = {
            type: transcodeType,
            inputPath: videoInputPath,
            outputPath: videoTranscodedPath,
            resolution: inputVideoFile.resolution
        };
        yield ffmpeg_utils_1.transcode(transcodeOptions);
        try {
            yield fs_extra_1.remove(storageFilePath);
            if (yield fs_extra_1.pathExists(tmpFilePath))
                yield fs_extra_1.remove(tmpFilePath);
            inputVideoFile.extname = newExtname;
            const videoOutputPath = video_paths_1.getVideoFilePath(video, inputVideoFile);
            yield onVideoFileTranscoding(video, inputVideoFile, videoTranscodedPath, videoOutputPath);
        }
        catch (err) {
            video.destroy().catch(err => logger_1.logger.error('Cannot destruct video after transcoding failure.', { err }));
            throw err;
        }
    });
}
exports.optimizeOriginalVideofile = optimizeOriginalVideofile;
function transcodeNewResolution(video, resolution, isPortrait) {
    return __awaiter(this, void 0, void 0, function* () {
        const transcodeDirectory = config_1.CONFIG.STORAGE.TMP_DIR;
        const extname = '.mp4';
        const videoInputPath = video_paths_1.getVideoFilePath(video, video.getMaxQualityFile());
        const newVideoFile = new video_file_1.VideoFileModel({
            resolution,
            extname,
            size: 0,
            videoId: video.id
        });
        const videoOutputPath = video_paths_1.getVideoFilePath(video, newVideoFile);
        const videoTranscodedPath = path_1.join(transcodeDirectory, video_paths_1.getVideoFilename(video, newVideoFile));
        const transcodeOptions = resolution === videos_1.VideoResolution.H_NOVIDEO
            ? {
                type: 'only-audio',
                inputPath: videoInputPath,
                outputPath: videoTranscodedPath,
                resolution
            }
            : {
                type: 'video',
                inputPath: videoInputPath,
                outputPath: videoTranscodedPath,
                resolution,
                isPortraitMode: isPortrait
            };
        yield ffmpeg_utils_1.transcode(transcodeOptions);
        return onVideoFileTranscoding(video, newVideoFile, videoTranscodedPath, videoOutputPath);
    });
}
exports.transcodeNewResolution = transcodeNewResolution;
function mergeAudioVideofile(video, resolution) {
    return __awaiter(this, void 0, void 0, function* () {
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
            audioPath: audioInputPath,
            resolution
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
        const videoOutputPath = video_paths_1.getVideoFilePath(video, inputVideoFile);
        video.duration = yield ffmpeg_utils_1.getDurationFromVideoFile(videoTranscodedPath);
        yield video.save();
        return onVideoFileTranscoding(video, inputVideoFile, videoTranscodedPath, videoOutputPath);
    });
}
exports.mergeAudioVideofile = mergeAudioVideofile;
function generateHlsPlaylist(video, resolution, copyCodecs, isPortraitMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseHlsDirectory = path_1.join(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, video.uuid);
        yield fs_extra_1.ensureDir(path_1.join(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, video.uuid));
        const videoFileInput = copyCodecs
            ? video.getWebTorrentFile(resolution)
            : video.getMaxQualityFile();
        const videoOrStreamingPlaylist = videoFileInput.getVideoOrStreamingPlaylist();
        const videoInputPath = video_paths_1.getVideoFilePath(videoOrStreamingPlaylist, videoFileInput);
        const outputPath = path_1.join(baseHlsDirectory, video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsPlaylistFilename(resolution));
        const videoFilename = video_paths_1.generateVideoStreamingPlaylistName(video.uuid, resolution);
        const transcodeOptions = {
            type: 'hls',
            inputPath: videoInputPath,
            outputPath,
            resolution,
            copyCodecs,
            isPortraitMode,
            hlsPlaylist: {
                videoFilename
            }
        };
        logger_1.logger.debug('Will run transcode.', { transcodeOptions });
        yield ffmpeg_utils_1.transcode(transcodeOptions);
        const playlistUrl = constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsMasterPlaylistStaticPath(video.uuid);
        const [videoStreamingPlaylist] = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.upsert({
            videoId: video.id,
            playlistUrl,
            segmentsSha256Url: constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsSha256SegmentsStaticPath(video.uuid),
            p2pMediaLoaderInfohashes: video_streaming_playlist_1.VideoStreamingPlaylistModel.buildP2PMediaLoaderInfoHashes(playlistUrl, video.VideoFiles),
            p2pMediaLoaderPeerVersion: constants_1.P2P_MEDIA_LOADER_PEER_VERSION,
            type: video_streaming_playlist_type_1.VideoStreamingPlaylistType.HLS
        }, { returning: true });
        videoStreamingPlaylist.Video = video;
        const newVideoFile = new video_file_1.VideoFileModel({
            resolution,
            extname: path_1.extname(videoFilename),
            size: 0,
            fps: -1,
            videoStreamingPlaylistId: videoStreamingPlaylist.id
        });
        const videoFilePath = video_paths_1.getVideoFilePath(videoStreamingPlaylist, newVideoFile);
        const stats = yield fs_extra_1.stat(videoFilePath);
        newVideoFile.size = stats.size;
        newVideoFile.fps = yield ffmpeg_utils_1.getVideoFileFPS(videoFilePath);
        newVideoFile.metadata = yield ffmpeg_utils_1.getMetadataFromFile(videoFilePath);
        yield webtorrent_1.createTorrentAndSetInfoHash(videoStreamingPlaylist, newVideoFile);
        yield video_file_1.VideoFileModel.customUpsert(newVideoFile, 'streaming-playlist', undefined);
        videoStreamingPlaylist.VideoFiles = yield videoStreamingPlaylist.$get('VideoFiles');
        video.setHLSPlaylist(videoStreamingPlaylist);
        yield hls_1.updateMasterHLSPlaylist(video);
        yield hls_1.updateSha256Segments(video);
        return video;
    });
}
exports.generateHlsPlaylist = generateHlsPlaylist;
function onVideoFileTranscoding(video, videoFile, transcodingPath, outputPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = yield fs_extra_1.stat(transcodingPath);
        const fps = yield ffmpeg_utils_1.getVideoFileFPS(transcodingPath);
        const metadata = yield ffmpeg_utils_1.getMetadataFromFile(transcodingPath);
        yield fs_extra_1.move(transcodingPath, outputPath);
        videoFile.size = stats.size;
        videoFile.fps = fps;
        videoFile.metadata = metadata;
        yield webtorrent_1.createTorrentAndSetInfoHash(video, videoFile);
        const updatedVideoFile = yield videoFile.save();
        if (video.VideoFiles.some(f => f.id === videoFile.id) === false) {
            video.VideoFiles.push(updatedVideoFile);
        }
        return video;
    });
}
