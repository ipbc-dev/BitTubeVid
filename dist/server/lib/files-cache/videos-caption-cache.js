"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosCaptionCache = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const requests_1 = require("@server/helpers/requests");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const video_1 = require("../../models/video/video");
const video_caption_1 = require("../../models/video/video-caption");
const abstract_video_static_file_cache_1 = require("./abstract-video-static-file-cache");
class VideosCaptionCache extends abstract_video_static_file_cache_1.AbstractVideoStaticFileCache {
    constructor() {
        super();
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    getFilePathImpl(filename) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoCaption = yield video_caption_1.VideoCaptionModel.loadWithVideoByFilename(filename);
            if (!videoCaption)
                return undefined;
            if (videoCaption.isOwned())
                return { isOwned: true, path: path_1.join(config_1.CONFIG.STORAGE.CAPTIONS_DIR, videoCaption.filename) };
            return this.loadRemoteFile(filename);
        });
    }
    loadRemoteFile(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoCaption = yield video_caption_1.VideoCaptionModel.loadWithVideoByFilename(key);
            if (!videoCaption)
                return undefined;
            if (videoCaption.isOwned())
                throw new Error('Cannot load remote caption of owned video.');
            const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoCaption.videoId);
            if (!video)
                return undefined;
            const remoteUrl = videoCaption.getFileUrl(video);
            const destPath = path_1.join(constants_1.FILES_CACHE.VIDEO_CAPTIONS.DIRECTORY, videoCaption.filename);
            yield requests_1.doRequestAndSaveToFile({ uri: remoteUrl }, destPath);
            return { isOwned: false, path: destPath };
        });
    }
}
exports.VideosCaptionCache = VideosCaptionCache;
