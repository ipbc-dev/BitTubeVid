"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheFileActivityObjectToDBAttributes = exports.updateCacheFile = exports.createCacheFile = exports.createOrUpdateCacheFile = void 0;
const tslib_1 = require("tslib");
const video_redundancy_1 = require("../../models/redundancy/video-redundancy");
function cacheFileActivityObjectToDBAttributes(cacheFileObject, video, byActor) {
    if (cacheFileObject.url.mediaType === 'application/x-mpegURL') {
        const url = cacheFileObject.url;
        const playlist = video.VideoStreamingPlaylists.find(t => t.type === 1);
        if (!playlist)
            throw new Error('Cannot find HLS playlist of video ' + video.url);
        return {
            expiresOn: cacheFileObject.expires ? new Date(cacheFileObject.expires) : null,
            url: cacheFileObject.id,
            fileUrl: url.href,
            strategy: null,
            videoStreamingPlaylistId: playlist.id,
            actorId: byActor.id
        };
    }
    const url = cacheFileObject.url;
    const videoFile = video.VideoFiles.find(f => {
        return f.resolution === url.height && f.fps === url.fps;
    });
    if (!videoFile)
        throw new Error(`Cannot find video file ${url.height} ${url.fps} of video ${video.url}`);
    return {
        expiresOn: cacheFileObject.expires ? new Date(cacheFileObject.expires) : null,
        url: cacheFileObject.id,
        fileUrl: url.href,
        strategy: null,
        videoFileId: videoFile.id,
        actorId: byActor.id
    };
}
exports.cacheFileActivityObjectToDBAttributes = cacheFileActivityObjectToDBAttributes;
function createOrUpdateCacheFile(cacheFileObject, video, byActor, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const redundancyModel = yield video_redundancy_1.VideoRedundancyModel.loadByUrl(cacheFileObject.id, t);
        if (!redundancyModel) {
            yield createCacheFile(cacheFileObject, video, byActor, t);
        }
        else {
            yield updateCacheFile(cacheFileObject, redundancyModel, video, byActor, t);
        }
    });
}
exports.createOrUpdateCacheFile = createOrUpdateCacheFile;
function createCacheFile(cacheFileObject, video, byActor, t) {
    const attributes = cacheFileActivityObjectToDBAttributes(cacheFileObject, video, byActor);
    return video_redundancy_1.VideoRedundancyModel.create(attributes, { transaction: t });
}
exports.createCacheFile = createCacheFile;
function updateCacheFile(cacheFileObject, redundancyModel, video, byActor, t) {
    if (redundancyModel.actorId !== byActor.id) {
        throw new Error('Cannot update redundancy ' + redundancyModel.url + ' of another actor.');
    }
    const attributes = cacheFileActivityObjectToDBAttributes(cacheFileObject, video, byActor);
    redundancyModel.expiresOn = attributes.expiresOn;
    redundancyModel.fileUrl = attributes.fileUrl;
    return redundancyModel.save({ transaction: t });
}
exports.updateCacheFile = updateCacheFile;
