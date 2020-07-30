"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosPreviewCache = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const constants_1 = require("../../initializers/constants");
const video_1 = require("../../models/video/video");
const abstract_video_static_file_cache_1 = require("./abstract-video-static-file-cache");
const requests_1 = require("@server/helpers/requests");
class VideosPreviewCache extends abstract_video_static_file_cache_1.AbstractVideoStaticFileCache {
    constructor() {
        super();
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    getFilePathImpl(videoUUID) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const video = yield video_1.VideoModel.loadByUUID(videoUUID);
            if (!video)
                return undefined;
            if (video.isOwned())
                return { isOwned: true, path: video.getPreview().getPath() };
            return this.loadRemoteFile(videoUUID);
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
            return { isOwned: false, path: destPath };
        });
    }
}
exports.VideosPreviewCache = VideosPreviewCache;
