"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosRedundancyScheduler = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const application_1 = require("@server/models/application/application");
const video_1 = require("@server/models/video/video");
const logger_1 = require("../../helpers/logger");
const webtorrent_1 = require("../../helpers/webtorrent");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const video_redundancy_1 = require("../../models/redundancy/video-redundancy");
const send_1 = require("../activitypub/send");
const url_1 = require("../activitypub/url");
const videos_1 = require("../activitypub/videos");
const hls_1 = require("../hls");
const redundancy_1 = require("../redundancy");
const video_paths_1 = require("../video-paths");
const abstract_scheduler_1 = require("./abstract-scheduler");
function isMVideoRedundancyFileVideo(o) {
    return !!o.VideoFile;
}
class VideosRedundancyScheduler extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = config_1.CONFIG.REDUNDANCY.VIDEOS.CHECK_INTERVAL;
    }
    createManualRedundancy(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoToDuplicate = yield video_1.VideoModel.loadWithFiles(videoId);
            if (!videoToDuplicate) {
                logger_1.logger.warn('Video to manually duplicate %d does not exist anymore.', videoId);
                return;
            }
            return this.createVideoRedundancies({
                video: videoToDuplicate,
                redundancy: null,
                files: videoToDuplicate.VideoFiles,
                streamingPlaylists: videoToDuplicate.VideoStreamingPlaylists
            });
        });
    }
    internalExecute() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const redundancyConfig of config_1.CONFIG.REDUNDANCY.VIDEOS.STRATEGIES) {
                logger_1.logger.info('Running redundancy scheduler for strategy %s.', redundancyConfig.strategy);
                try {
                    const videoToDuplicate = yield this.findVideoToDuplicate(redundancyConfig);
                    if (!videoToDuplicate)
                        continue;
                    const candidateToDuplicate = {
                        video: videoToDuplicate,
                        redundancy: redundancyConfig,
                        files: videoToDuplicate.VideoFiles,
                        streamingPlaylists: videoToDuplicate.VideoStreamingPlaylists
                    };
                    yield this.purgeCacheIfNeeded(candidateToDuplicate);
                    if (yield this.isTooHeavy(candidateToDuplicate)) {
                        logger_1.logger.info('Video %s is too big for our cache, skipping.', videoToDuplicate.url);
                        continue;
                    }
                    logger_1.logger.info('Will duplicate video %s in redundancy scheduler "%s".', videoToDuplicate.url, redundancyConfig.strategy);
                    yield this.createVideoRedundancies(candidateToDuplicate);
                }
                catch (err) {
                    logger_1.logger.error('Cannot run videos redundancy %s.', redundancyConfig.strategy, { err });
                }
            }
            yield this.extendsLocalExpiration();
            yield this.purgeRemoteExpired();
        });
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    extendsLocalExpiration() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const expired = yield video_redundancy_1.VideoRedundancyModel.listLocalExpired();
            for (const redundancyModel of expired) {
                try {
                    const redundancyConfig = config_1.CONFIG.REDUNDANCY.VIDEOS.STRATEGIES.find(s => s.strategy === redundancyModel.strategy);
                    const candidate = {
                        redundancy: redundancyConfig,
                        video: null,
                        files: [],
                        streamingPlaylists: []
                    };
                    if (!redundancyConfig || (yield this.isTooHeavy(candidate))) {
                        logger_1.logger.info('Destroying redundancy %s because the cache size %s is too heavy.', redundancyModel.url, redundancyModel.strategy);
                        yield redundancy_1.removeVideoRedundancy(redundancyModel);
                    }
                    else {
                        yield this.extendsRedundancy(redundancyModel);
                    }
                }
                catch (err) {
                    logger_1.logger.error('Cannot extend or remove expiration of %s video from our redundancy system.', this.buildEntryLogId(redundancyModel), { err });
                }
            }
        });
    }
    extendsRedundancy(redundancyModel) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const redundancy = config_1.CONFIG.REDUNDANCY.VIDEOS.STRATEGIES.find(s => s.strategy === redundancyModel.strategy);
            if (!redundancy) {
                yield redundancy_1.removeVideoRedundancy(redundancyModel);
                return;
            }
            yield this.extendsExpirationOf(redundancyModel, redundancy.minLifetime);
        });
    }
    purgeRemoteExpired() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const expired = yield video_redundancy_1.VideoRedundancyModel.listRemoteExpired();
            for (const redundancyModel of expired) {
                try {
                    yield redundancy_1.removeVideoRedundancy(redundancyModel);
                }
                catch (err) {
                    logger_1.logger.error('Cannot remove redundancy %s from our redundancy system.', this.buildEntryLogId(redundancyModel));
                }
            }
        });
    }
    findVideoToDuplicate(cache) {
        if (cache.strategy === 'most-views') {
            return video_redundancy_1.VideoRedundancyModel.findMostViewToDuplicate(constants_1.REDUNDANCY.VIDEOS.RANDOMIZED_FACTOR);
        }
        if (cache.strategy === 'trending') {
            return video_redundancy_1.VideoRedundancyModel.findTrendingToDuplicate(constants_1.REDUNDANCY.VIDEOS.RANDOMIZED_FACTOR);
        }
        if (cache.strategy === 'recently-added') {
            const minViews = cache.minViews;
            return video_redundancy_1.VideoRedundancyModel.findRecentlyAddedToDuplicate(constants_1.REDUNDANCY.VIDEOS.RANDOMIZED_FACTOR, minViews);
        }
    }
    createVideoRedundancies(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const video = yield this.loadAndRefreshVideo(data.video.url);
            if (!video) {
                logger_1.logger.info('Video %s we want to duplicate does not existing anymore, skipping.', data.video.url);
                return;
            }
            for (const file of data.files) {
                const existingRedundancy = yield video_redundancy_1.VideoRedundancyModel.loadLocalByFileId(file.id);
                if (existingRedundancy) {
                    yield this.extendsRedundancy(existingRedundancy);
                    continue;
                }
                yield this.createVideoFileRedundancy(data.redundancy, video, file);
            }
            for (const streamingPlaylist of data.streamingPlaylists) {
                const existingRedundancy = yield video_redundancy_1.VideoRedundancyModel.loadLocalByStreamingPlaylistId(streamingPlaylist.id);
                if (existingRedundancy) {
                    yield this.extendsRedundancy(existingRedundancy);
                    continue;
                }
                yield this.createStreamingPlaylistRedundancy(data.redundancy, video, streamingPlaylist);
            }
        });
    }
    createVideoFileRedundancy(redundancy, video, fileArg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let strategy = 'manual';
            let expiresOn = null;
            if (redundancy) {
                strategy = redundancy.strategy;
                expiresOn = this.buildNewExpiration(redundancy.minLifetime);
            }
            const file = fileArg;
            file.Video = video;
            const serverActor = yield application_1.getServerActor();
            logger_1.logger.info('Duplicating %s - %d in videos redundancy with "%s" strategy.', video.url, file.resolution, strategy);
            const { baseUrlHttp, baseUrlWs } = video.getBaseUrls();
            const magnetUri = webtorrent_1.generateMagnetUri(video, file, baseUrlHttp, baseUrlWs);
            const tmpPath = yield webtorrent_1.downloadWebTorrentVideo({ magnetUri }, constants_1.VIDEO_IMPORT_TIMEOUT);
            const destPath = path_1.join(config_1.CONFIG.STORAGE.REDUNDANCY_DIR, video_paths_1.getVideoFilename(video, file));
            yield fs_extra_1.move(tmpPath, destPath, { overwrite: true });
            const createdModel = yield video_redundancy_1.VideoRedundancyModel.create({
                expiresOn,
                url: url_1.getLocalVideoCacheFileActivityPubUrl(file),
                fileUrl: video.getVideoRedundancyUrl(file, constants_1.WEBSERVER.URL),
                strategy,
                videoFileId: file.id,
                actorId: serverActor.id
            });
            createdModel.VideoFile = file;
            yield send_1.sendCreateCacheFile(serverActor, video, createdModel);
            logger_1.logger.info('Duplicated %s - %d -> %s.', video.url, file.resolution, createdModel.url);
        });
    }
    createStreamingPlaylistRedundancy(redundancy, video, playlistArg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let strategy = 'manual';
            let expiresOn = null;
            if (redundancy) {
                strategy = redundancy.strategy;
                expiresOn = this.buildNewExpiration(redundancy.minLifetime);
            }
            const playlist = playlistArg;
            playlist.Video = video;
            const serverActor = yield application_1.getServerActor();
            logger_1.logger.info('Duplicating %s streaming playlist in videos redundancy with "%s" strategy.', video.url, strategy);
            const destDirectory = path_1.join(constants_1.HLS_REDUNDANCY_DIRECTORY, video.uuid);
            yield hls_1.downloadPlaylistSegments(playlist.playlistUrl, destDirectory, constants_1.VIDEO_IMPORT_TIMEOUT);
            const createdModel = yield video_redundancy_1.VideoRedundancyModel.create({
                expiresOn,
                url: url_1.getLocalVideoCacheStreamingPlaylistActivityPubUrl(video, playlist),
                fileUrl: playlist.getVideoRedundancyUrl(constants_1.WEBSERVER.URL),
                strategy,
                videoStreamingPlaylistId: playlist.id,
                actorId: serverActor.id
            });
            createdModel.VideoStreamingPlaylist = playlist;
            yield send_1.sendCreateCacheFile(serverActor, video, createdModel);
            logger_1.logger.info('Duplicated playlist %s -> %s.', playlist.playlistUrl, createdModel.url);
        });
    }
    extendsExpirationOf(redundancy, expiresAfterMs) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Extending expiration of %s.', redundancy.url);
            const serverActor = yield application_1.getServerActor();
            redundancy.expiresOn = this.buildNewExpiration(expiresAfterMs);
            yield redundancy.save();
            yield send_1.sendUpdateCacheFile(serverActor, redundancy);
        });
    }
    purgeCacheIfNeeded(candidateToDuplicate) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            while (yield this.isTooHeavy(candidateToDuplicate)) {
                const redundancy = candidateToDuplicate.redundancy;
                const toDelete = yield video_redundancy_1.VideoRedundancyModel.loadOldestLocalExpired(redundancy.strategy, redundancy.minLifetime);
                if (!toDelete)
                    return;
                yield redundancy_1.removeVideoRedundancy(toDelete);
            }
        });
    }
    isTooHeavy(candidateToDuplicate) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const maxSize = candidateToDuplicate.redundancy.size;
            const totalDuplicated = yield video_redundancy_1.VideoRedundancyModel.getTotalDuplicated(candidateToDuplicate.redundancy.strategy);
            const totalWillDuplicate = totalDuplicated + this.getTotalFileSizes(candidateToDuplicate.files, candidateToDuplicate.streamingPlaylists);
            return totalWillDuplicate > maxSize;
        });
    }
    buildNewExpiration(expiresAfterMs) {
        return new Date(Date.now() + expiresAfterMs);
    }
    buildEntryLogId(object) {
        if (isMVideoRedundancyFileVideo(object))
            return `${object.VideoFile.Video.url}-${object.VideoFile.resolution}`;
        return `${object.VideoStreamingPlaylist.playlistUrl}`;
    }
    getTotalFileSizes(files, playlists) {
        const fileReducer = (previous, current) => previous + current.size;
        let allFiles = files;
        for (const p of playlists) {
            allFiles = allFiles.concat(p.VideoFiles);
        }
        return allFiles.reduce(fileReducer, 0);
    }
    loadAndRefreshVideo(videoUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const getVideoOptions = {
                videoObject: videoUrl,
                syncParam: { likes: false, dislikes: false, shares: false, comments: false, thumbnail: false, refreshVideo: true },
                fetchType: 'all'
            };
            const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel(getVideoOptions);
            return video;
        });
    }
}
exports.VideosRedundancyScheduler = VideosRedundancyScheduler;
