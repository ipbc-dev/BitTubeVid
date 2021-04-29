"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlaylistMiniatureFromExisting = exports.createPlaylistMiniatureFromUrl = exports.createPlaceholderThumbnail = exports.createVideoMiniatureFromExisting = exports.createVideoMiniatureFromUrl = exports.generateVideoMiniature = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const ffmpeg_utils_1 = require("../helpers/ffmpeg-utils");
const image_utils_1 = require("../helpers/image-utils");
const requests_1 = require("../helpers/requests");
const config_1 = require("../initializers/config");
const constants_1 = require("../initializers/constants");
const thumbnail_1 = require("../models/video/thumbnail");
const video_paths_1 = require("./video-paths");
function createPlaylistMiniatureFromExisting(options) {
    const { inputPath, playlist, automaticallyGenerated, keepOriginal = false, size } = options;
    const { filename, outputPath, height, width, existingThumbnail } = buildMetadataFromPlaylist(playlist, size);
    const type = 1;
    const thumbnailCreator = () => image_utils_1.processImage(inputPath, outputPath, { width, height }, keepOriginal);
    return createThumbnailFromFunction({
        thumbnailCreator,
        filename,
        height,
        width,
        type,
        automaticallyGenerated,
        existingThumbnail
    });
}
exports.createPlaylistMiniatureFromExisting = createPlaylistMiniatureFromExisting;
function createPlaylistMiniatureFromUrl(options) {
    const { downloadUrl, playlist, size } = options;
    const { filename, basePath, height, width, existingThumbnail } = buildMetadataFromPlaylist(playlist, size);
    const type = 1;
    const fileUrl = playlist.isOwned()
        ? null
        : downloadUrl;
    const thumbnailCreator = () => requests_1.downloadImage(downloadUrl, basePath, filename, { width, height });
    return createThumbnailFromFunction({ thumbnailCreator, filename, height, width, type, existingThumbnail, fileUrl });
}
exports.createPlaylistMiniatureFromUrl = createPlaylistMiniatureFromUrl;
function createVideoMiniatureFromUrl(options) {
    const { downloadUrl, video, type, size } = options;
    const { filename: updatedFilename, basePath, height, width, existingThumbnail } = buildMetadataFromVideo(video, type, size);
    const fileUrl = video.isOwned()
        ? null
        : downloadUrl;
    const thumbnailUrlChanged = hasThumbnailUrlChanged(existingThumbnail, downloadUrl, video);
    const filename = thumbnailUrlChanged
        ? updatedFilename
        : existingThumbnail.filename;
    const thumbnailCreator = () => {
        if (thumbnailUrlChanged)
            return requests_1.downloadImage(downloadUrl, basePath, filename, { width, height });
        return Promise.resolve();
    };
    return createThumbnailFromFunction({ thumbnailCreator, filename, height, width, type, existingThumbnail, fileUrl });
}
exports.createVideoMiniatureFromUrl = createVideoMiniatureFromUrl;
function createVideoMiniatureFromExisting(options) {
    const { inputPath, video, type, automaticallyGenerated, size, keepOriginal = false } = options;
    const { filename, outputPath, height, width, existingThumbnail } = buildMetadataFromVideo(video, type, size);
    const thumbnailCreator = () => image_utils_1.processImage(inputPath, outputPath, { width, height }, keepOriginal);
    return createThumbnailFromFunction({
        thumbnailCreator,
        filename,
        height,
        width,
        type,
        automaticallyGenerated,
        existingThumbnail
    });
}
exports.createVideoMiniatureFromExisting = createVideoMiniatureFromExisting;
function generateVideoMiniature(options) {
    const { video, videoFile, type } = options;
    const input = video_paths_1.getVideoFilePath(video, videoFile);
    const { filename, basePath, height, width, existingThumbnail, outputPath } = buildMetadataFromVideo(video, type);
    const thumbnailCreator = videoFile.isAudio()
        ? () => image_utils_1.processImage(constants_1.ASSETS_PATH.DEFAULT_AUDIO_BACKGROUND, outputPath, { width, height }, true)
        : () => ffmpeg_utils_1.generateImageFromVideoFile(input, basePath, filename, { height, width });
    return createThumbnailFromFunction({
        thumbnailCreator,
        filename,
        height,
        width,
        type,
        automaticallyGenerated: true,
        existingThumbnail
    });
}
exports.generateVideoMiniature = generateVideoMiniature;
function createPlaceholderThumbnail(options) {
    const { fileUrl, video, type, size } = options;
    const { filename: updatedFilename, height, width, existingThumbnail } = buildMetadataFromVideo(video, type, size);
    const thumbnailUrlChanged = hasThumbnailUrlChanged(existingThumbnail, fileUrl, video);
    const thumbnail = existingThumbnail || new thumbnail_1.ThumbnailModel();
    const filename = thumbnailUrlChanged
        ? updatedFilename
        : existingThumbnail.filename;
    thumbnail.filename = filename;
    thumbnail.height = height;
    thumbnail.width = width;
    thumbnail.type = type;
    thumbnail.fileUrl = fileUrl;
    return thumbnail;
}
exports.createPlaceholderThumbnail = createPlaceholderThumbnail;
function hasThumbnailUrlChanged(existingThumbnail, downloadUrl, video) {
    const existingUrl = existingThumbnail
        ? existingThumbnail.fileUrl
        : null;
    return !existingUrl || existingUrl !== downloadUrl || downloadUrl.endsWith(`${video.uuid}.jpg`);
}
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
    if (type === 1) {
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
    if (type === 2) {
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { thumbnailCreator, filename, width, height, type, existingThumbnail, automaticallyGenerated = null, fileUrl = null } = parameters;
        const oldFilename = existingThumbnail && existingThumbnail.filename !== filename
            ? existingThumbnail.filename
            : undefined;
        const thumbnail = existingThumbnail || new thumbnail_1.ThumbnailModel();
        thumbnail.filename = filename;
        thumbnail.height = height;
        thumbnail.width = width;
        thumbnail.type = type;
        thumbnail.fileUrl = fileUrl;
        thumbnail.automaticallyGenerated = automaticallyGenerated;
        if (oldFilename)
            thumbnail.previousThumbnailFilename = oldFilename;
        yield thumbnailCreator();
        return thumbnail;
    });
}
