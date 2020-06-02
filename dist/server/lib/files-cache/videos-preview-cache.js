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
        return __awaiter(this, void 0, void 0, function* () {
            const video = yield video_1.VideoModel.loadByUUID(videoUUID);
            if (!video)
                return undefined;
            if (video.isOwned())
                return { isOwned: true, path: video.getPreview().getPath() };
            return this.loadRemoteFile(videoUUID);
        });
    }
    loadRemoteFile(key) {
        return __awaiter(this, void 0, void 0, function* () {
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
