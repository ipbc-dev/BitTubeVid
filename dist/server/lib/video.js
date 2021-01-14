"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setVideoTags = exports.buildVideoThumbnailsFromReq = exports.publishAndFederateIfNeeded = exports.buildLocalVideoFromReq = void 0;
const tslib_1 = require("tslib");
const database_1 = require("@server/initializers/database");
const tag_1 = require("@server/models/video/tag");
const video_1 = require("@server/models/video/video");
const videos_1 = require("./activitypub/videos");
const notifier_1 = require("./notifier");
const thumbnail_1 = require("./thumbnail");
function buildLocalVideoFromReq(videoInfo, channelId) {
    return {
        name: videoInfo.name,
        remote: false,
        category: videoInfo.category,
        licence: videoInfo.licence,
        language: videoInfo.language,
        commentsEnabled: videoInfo.commentsEnabled !== false,
        downloadEnabled: videoInfo.downloadEnabled !== false,
        waitTranscoding: videoInfo.waitTranscoding || false,
        nsfw: videoInfo.nsfw || false,
        description: videoInfo.description,
        support: videoInfo.support,
        privacy: videoInfo.privacy || 3,
        channelId: channelId,
        originallyPublishedAt: videoInfo.originallyPublishedAt
    };
}
exports.buildLocalVideoFromReq = buildLocalVideoFromReq;
function buildVideoThumbnailsFromReq(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { video, files, fallback, automaticallyGenerated } = options;
        const promises = [
            {
                type: 1,
                fieldName: 'thumbnailfile'
            },
            {
                type: 2,
                fieldName: 'previewfile'
            }
        ].map(p => {
            const fields = files === null || files === void 0 ? void 0 : files[p.fieldName];
            if (fields) {
                return thumbnail_1.createVideoMiniatureFromExisting({
                    inputPath: fields[0].path,
                    video,
                    type: p.type,
                    automaticallyGenerated: automaticallyGenerated || false
                });
            }
            return fallback(p.type);
        });
        return Promise.all(promises);
    });
}
exports.buildVideoThumbnailsFromReq = buildVideoThumbnailsFromReq;
function setVideoTags(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { video, tags, transaction, defaultValue } = options;
        if (tags) {
            const tagInstances = yield tag_1.TagModel.findOrCreateTags(tags, transaction);
            yield video.$set('Tags', tagInstances, { transaction });
            video.Tags = tagInstances;
        }
        else {
            video.Tags = defaultValue || [];
        }
    });
}
exports.setVideoTags = setVideoTags;
function publishAndFederateIfNeeded(video, wasLive = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoDatabase = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(video.uuid, t);
            if (!videoDatabase)
                return undefined;
            const videoPublished = yield videoDatabase.publishIfNeededAndSave(t);
            yield videos_1.federateVideoIfNeeded(videoDatabase, !wasLive && videoPublished, t);
            return { videoDatabase, videoPublished };
        }));
        if (result === null || result === void 0 ? void 0 : result.videoPublished) {
            notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(result.videoDatabase);
            notifier_1.Notifier.Instance.notifyOnVideoPublishedAfterTranscoding(result.videoDatabase);
        }
    });
}
exports.publishAndFederateIfNeeded = publishAndFederateIfNeeded;
