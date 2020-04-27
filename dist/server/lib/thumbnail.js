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
const ffmpeg_utils_1 = require("../helpers/ffmpeg-utils");
const config_1 = require("../initializers/config");
const constants_1 = require("../initializers/constants");
const thumbnail_1 = require("../models/video/thumbnail");
const thumbnail_type_1 = require("../../shared/models/videos/thumbnail.type");
const image_utils_1 = require("../helpers/image-utils");
const path_1 = require("path");
const requests_1 = require("../helpers/requests");
const video_paths_1 = require("./video-paths");
function createPlaylistMiniatureFromExisting(inputPath, playlist, automaticallyGenerated, keepOriginal = false, size) {
    const { filename, outputPath, height, width, existingThumbnail } = buildMetadataFromPlaylist(playlist, size);
    const type = thumbnail_type_1.ThumbnailType.MINIATURE;
    const thumbnailCreator = () => image_utils_1.processImage(inputPath, outputPath, { width, height }, keepOriginal);
    return createThumbnailFromFunction({ thumbnailCreator, filename, height, width, type, automaticallyGenerated, existingThumbnail });
}
exports.createPlaylistMiniatureFromExisting = createPlaylistMiniatureFromExisting;
function createPlaylistMiniatureFromUrl(fileUrl, playlist, size) {
    const { filename, basePath, height, width, existingThumbnail } = buildMetadataFromPlaylist(playlist, size);
    const type = thumbnail_type_1.ThumbnailType.MINIATURE;
    const thumbnailCreator = () => requests_1.downloadImage(fileUrl, basePath, filename, { width, height });
    return createThumbnailFromFunction({ thumbnailCreator, filename, height, width, type, existingThumbnail, fileUrl });
}
exports.createPlaylistMiniatureFromUrl = createPlaylistMiniatureFromUrl;
function createVideoMiniatureFromUrl(fileUrl, video, type, size) {
    const { filename, basePath, height, width, existingThumbnail } = buildMetadataFromVideo(video, type, size);
    const thumbnailCreator = () => requests_1.downloadImage(fileUrl, basePath, filename, { width, height });
    return createThumbnailFromFunction({ thumbnailCreator, filename, height, width, type, existingThumbnail, fileUrl });
}
exports.createVideoMiniatureFromUrl = createVideoMiniatureFromUrl;
function createVideoMiniatureFromExisting(inputPath, video, type, automaticallyGenerated, size) {
    const { filename, outputPath, height, width, existingThumbnail } = buildMetadataFromVideo(video, type, size);
    const thumbnailCreator = () => image_utils_1.processImage(inputPath, outputPath, { width, height });
    return createThumbnailFromFunction({ thumbnailCreator, filename, height, width, type, automaticallyGenerated, existingThumbnail });
}
exports.createVideoMiniatureFromExisting = createVideoMiniatureFromExisting;
function generateVideoMiniature(video, videoFile, type) {
    const input = video_paths_1.getVideoFilePath(video, videoFile);
    const { filename, basePath, height, width, existingThumbnail, outputPath } = buildMetadataFromVideo(video, type);
    const thumbnailCreator = videoFile.isAudio()
        ? () => image_utils_1.processImage(constants_1.ASSETS_PATH.DEFAULT_AUDIO_BACKGROUND, outputPath, { width, height }, true)
        : () => ffmpeg_utils_1.generateImageFromVideoFile(input, basePath, filename, { height, width });
    return createThumbnailFromFunction({ thumbnailCreator, filename, height, width, type, automaticallyGenerated: true, existingThumbnail });
}
exports.generateVideoMiniature = generateVideoMiniature;
function createPlaceholderThumbnail(fileUrl, video, type, size) {
    const { filename, height, width, existingThumbnail } = buildMetadataFromVideo(video, type, size);
    const thumbnail = existingThumbnail ? existingThumbnail : new thumbnail_1.ThumbnailModel();
    thumbnail.filename = filename;
    thumbnail.height = height;
    thumbnail.width = width;
    thumbnail.type = type;
    thumbnail.fileUrl = fileUrl;
    return thumbnail;
}
exports.createPlaceholderThumbnail = createPlaceholderThumbnail;
function buildMetadataFromPlaylist(playlist, size) {
    const filename = playlist.generateThumbnailName();
    const basePath = config_1.CONFIG.STORAGE.THUMBNAILS_DIR;
    return {
        filename,
        basePath,
        existingThumbnail: playlist.Thumbnail,
        outputPath: path_1.join(basePath, filename),
        height: size ? size.height : constants_1.THUMBNAILS_SIZE.height,
        width: size ? size.width : constants_1.THUMBNAILS_SIZE.width
    };
}
function buildMetadataFromVideo(video, type, size) {
    const existingThumbnail = Array.isArray(video.Thumbnails)
        ? video.Thumbnails.find(t => t.type === type)
        : undefined;
    if (type === thumbnail_type_1.ThumbnailType.MINIATURE) {
        const filename = video.generateThumbnailName();
        const basePath = config_1.CONFIG.STORAGE.THUMBNAILS_DIR;
        return {
            filename,
            basePath,
            existingThumbnail,
            outputPath: path_1.join(basePath, filename),
            height: size ? size.height : constants_1.THUMBNAILS_SIZE.height,
            width: size ? size.width : constants_1.THUMBNAILS_SIZE.width
        };
    }
    if (type === thumbnail_type_1.ThumbnailType.PREVIEW) {
        const filename = video.generatePreviewName();
        const basePath = config_1.CONFIG.STORAGE.PREVIEWS_DIR;
        return {
            filename,
            basePath,
            existingThumbnail,
            outputPath: path_1.join(basePath, filename),
            height: size ? size.height : constants_1.PREVIEWS_SIZE.height,
            width: size ? size.width : constants_1.PREVIEWS_SIZE.width
        };
    }
    return undefined;
}
function createThumbnailFromFunction(parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        const { thumbnailCreator, filename, width, height, type, existingThumbnail, automaticallyGenerated = null, fileUrl = null } = parameters;
        const thumbnail = existingThumbnail ? existingThumbnail : new thumbnail_1.ThumbnailModel();
        thumbnail.filename = filename;
        thumbnail.height = height;
        thumbnail.width = width;
        thumbnail.type = type;
        thumbnail.fileUrl = fileUrl;
        thumbnail.automaticallyGenerated = automaticallyGenerated;
        yield thumbnailCreator();
        return thumbnail;
    });
}
