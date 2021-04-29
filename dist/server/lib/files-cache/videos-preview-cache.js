"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosPreviewCache = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const constants_1 = require("../../initializers/constants");
const video_1 = require("../../models/video/video");
const abstract_video_static_file_cache_1 = require("./abstract-video-static-file-cache");
const requests_1 = require("@server/helpers/requests");
const thumbnail_1 = require("@server/models/video/thumbnail");
const logger_1 = require("@server/helpers/logger");
class VideosPreviewCache extends abstract_video_static_file_cache_1.AbstractVideoStaticFileCache {
    constructor() {
        super();
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    getFilePathImpl(filename) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const thumbnail = yield thumbnail_1.ThumbnailModel.loadWithVideoByFilename(filename, 2);
            if (!thumbnail)
                return undefined;
            if (thumbnail.Video.isOwned())
                return { isOwned: true, path: thumbnail.getPath() };
            return this.loadRemoteFile(thumbnail.Video.uuid);
        });
    }
    loadRemoteFile(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(key);
            if (!video)
                return undefined;
            if (video.isOwned())
                throw new Error('Cannot load remote preview of owned video.');
            const preview = video.getPreview();
            const destPath = path_1.join(constants_1.FILES_CACHE.PREVIEWS.DIRECTORY, preview.filename);
            const remoteUrl = preview.getFileUrl(video);
            yield requests_1.doRequestAndSaveToFile({ uri: remoteUrl }, destPath);
            logger_1.logger.debug('Fetched remote preview %s to %s.', remoteUrl, destPath);
            return { isOwned: false, path: destPath };
        });
    }
}
exports.VideosPreviewCache = VideosPreviewCache;
