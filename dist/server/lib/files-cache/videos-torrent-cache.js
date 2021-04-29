"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosTorrentCache = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const requests_1 = require("@server/helpers/requests");
const video_file_1 = require("@server/models/video/video-file");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const video_1 = require("../../models/video/video");
const abstract_video_static_file_cache_1 = require("./abstract-video-static-file-cache");
class VideosTorrentCache extends abstract_video_static_file_cache_1.AbstractVideoStaticFileCache {
    constructor() {
        super();
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    getFilePathImpl(filename) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const file = yield video_file_1.VideoFileModel.loadWithVideoOrPlaylistByTorrentFilename(filename);
            if (!file)
                return undefined;
            if (file.getVideo().isOwned())
                return { isOwned: true, path: path_1.join(config_1.CONFIG.STORAGE.TORRENTS_DIR, file.torrentFilename) };
            return this.loadRemoteFile(filename);
        });
    }
    loadRemoteFile(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const file = yield video_file_1.VideoFileModel.loadWithVideoOrPlaylistByTorrentFilename(key);
            if (!file)
                return undefined;
            if (file.getVideo().isOwned())
                throw new Error('Cannot load remote file of owned video.');
            const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(file.getVideo().id);
            if (!video)
                return undefined;
            const remoteUrl = file.getRemoteTorrentUrl(video);
            const destPath = path_1.join(constants_1.FILES_CACHE.TORRENTS.DIRECTORY, file.torrentFilename);
            yield requests_1.doRequestAndSaveToFile({ uri: remoteUrl }, destPath);
            const downloadName = `${video.name}-${file.resolution}p.torrent`;
            return { isOwned: false, path: destPath, downloadName };
        });
    }
}
exports.VideosTorrentCache = VideosTorrentCache;
