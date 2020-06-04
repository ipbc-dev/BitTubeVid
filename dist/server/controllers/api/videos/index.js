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
const express = require("express");
const path_1 = require("path");
const shared_1 = require("../../../../shared");
const ffmpeg_utils_1 = require("../../../helpers/ffmpeg-utils");
const logger_1 = require("../../../helpers/logger");
const audit_logger_1 = require("../../../helpers/audit-logger");
const utils_1 = require("../../../helpers/utils");
const video_blacklist_1 = require("../../../lib/video-blacklist");
const constants_1 = require("../../../initializers/constants");
const videos_1 = require("../../../lib/activitypub/videos");
const job_queue_1 = require("../../../lib/job-queue");
const redis_1 = require("../../../lib/redis");
const middlewares_1 = require("../../../middlewares");
const tag_1 = require("../../../models/video/tag");
const video_1 = require("../../../models/video/video");
const video_file_1 = require("../../../models/video/video-file");
const abuse_1 = require("./abuse");
const blacklist_1 = require("./blacklist");
const comment_1 = require("./comment");
const rate_1 = require("./rate");
const ownership_1 = require("./ownership");
const express_utils_1 = require("../../../helpers/express-utils");
const schedule_video_update_1 = require("../../../models/video/schedule-video-update");
const captions_1 = require("./captions");
const import_1 = require("./import");
const database_utils_1 = require("../../../helpers/database-utils");
const fs_extra_1 = require("fs-extra");
const watching_1 = require("./watching");
const notifier_1 = require("../../../lib/notifier");
const send_view_1 = require("../../../lib/activitypub/send/send-view");
const config_1 = require("../../../initializers/config");
const database_1 = require("../../../initializers/database");
const thumbnail_1 = require("../../../lib/thumbnail");
const thumbnail_type_1 = require("../../../../shared/models/videos/thumbnail.type");
const hooks_1 = require("../../../lib/plugins/hooks");
const webtorrent_1 = require("@server/helpers/webtorrent");
const video_paths_1 = require("@server/lib/video-paths");
const toInt_1 = require("validator/lib/toInt");
const video_2 = require("@server/helpers/video");
const application_1 = require("@server/models/application/application");
const share_1 = require("@server/lib/activitypub/share");
const url_1 = require("@server/lib/activitypub/url");
const auditLogger = audit_logger_1.auditLoggerFactory('videos');
const videosRouter = express.Router();
exports.videosRouter = videosRouter;
const reqVideoFileAdd = express_utils_1.createReqFiles(['videofile', 'thumbnailfile', 'previewfile'], Object.assign({}, constants_1.MIMETYPES.VIDEO.MIMETYPE_EXT, constants_1.MIMETYPES.IMAGE.MIMETYPE_EXT), {
    videofile: config_1.CONFIG.STORAGE.TMP_DIR,
    thumbnailfile: config_1.CONFIG.STORAGE.TMP_DIR,
    previewfile: config_1.CONFIG.STORAGE.TMP_DIR
});
const reqVideoFileUpdate = express_utils_1.createReqFiles(['thumbnailfile', 'previewfile'], constants_1.MIMETYPES.IMAGE.MIMETYPE_EXT, {
    thumbnailfile: config_1.CONFIG.STORAGE.TMP_DIR,
    previewfile: config_1.CONFIG.STORAGE.TMP_DIR
});
videosRouter.use('/', abuse_1.abuseVideoRouter);
videosRouter.use('/', blacklist_1.blacklistRouter);
videosRouter.use('/', rate_1.rateVideoRouter);
videosRouter.use('/', comment_1.videoCommentRouter);
videosRouter.use('/', captions_1.videoCaptionsRouter);
videosRouter.use('/', import_1.videoImportsRouter);
videosRouter.use('/', ownership_1.ownershipVideoRouter);
videosRouter.use('/', watching_1.watchingRouter);
videosRouter.get('/categories', listVideoCategories);
videosRouter.get('/licences', listVideoLicences);
videosRouter.get('/languages', listVideoLanguages);
videosRouter.get('/privacies', listVideoPrivacies);
videosRouter.get('/', middlewares_1.paginationValidator, middlewares_1.videosSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.optionalAuthenticate, middlewares_1.commonVideosFiltersValidator, middlewares_1.asyncMiddleware(listVideos));
videosRouter.put('/:id', middlewares_1.authenticate, reqVideoFileUpdate, middlewares_1.asyncMiddleware(middlewares_1.videosUpdateValidator), middlewares_1.asyncRetryTransactionMiddleware(updateVideo));
videosRouter.post('/upload', middlewares_1.authenticate, reqVideoFileAdd, middlewares_1.asyncMiddleware(middlewares_1.videosAddValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideo));
videosRouter.get('/:id/description', middlewares_1.asyncMiddleware(middlewares_1.videosGetValidator), middlewares_1.asyncMiddleware(getVideoDescription));
videosRouter.get('/:id/metadata/:videoFileId', middlewares_1.asyncMiddleware(middlewares_1.videoFileMetadataGetValidator), middlewares_1.asyncMiddleware(getVideoFileMetadata));
videosRouter.get('/:id', middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-video-with-rights')), middlewares_1.asyncMiddleware(middlewares_1.checkVideoFollowConstraints), middlewares_1.asyncMiddleware(getVideo));
videosRouter.post('/:id/views', middlewares_1.asyncMiddleware(middlewares_1.videosCustomGetValidator('only-immutable-attributes')), middlewares_1.asyncMiddleware(viewVideo));
videosRouter.delete('/:id', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videosRemoveValidator), middlewares_1.asyncRetryTransactionMiddleware(removeVideo));
function listVideoCategories(req, res) {
    res.json(constants_1.VIDEO_CATEGORIES);
}
function listVideoLicences(req, res) {
    res.json(constants_1.VIDEO_LICENCES);
}
function listVideoLanguages(req, res) {
    res.json(constants_1.VIDEO_LANGUAGES);
}
function listVideoPrivacies(req, res) {
    res.json(constants_1.VIDEO_PRIVACIES);
}
function addVideo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        req.setTimeout(1000 * 60 * 100, () => {
            logger_1.logger.error('Upload video has timed out.');
            return res.sendStatus(408);
        });
        const videoPhysicalFile = req.files['videofile'][0];
        const videoInfo = req.body;
        const videoData = {
            name: videoInfo.name,
            remote: false,
            category: videoInfo.category,
            licence: videoInfo.licence,
            language: videoInfo.language,
            commentsEnabled: videoInfo.commentsEnabled !== false,
            downloadEnabled: videoInfo.downloadEnabled !== false,
            waitTranscoding: videoInfo.waitTranscoding || false,
            state: config_1.CONFIG.TRANSCODING.ENABLED ? shared_1.VideoState.TO_TRANSCODE : shared_1.VideoState.PUBLISHED,
            nsfw: videoInfo.nsfw || false,
            description: videoInfo.description,
            support: videoInfo.support,
            privacy: videoInfo.privacy || shared_1.VideoPrivacy.PRIVATE,
            duration: videoPhysicalFile['duration'],
            channelId: res.locals.videoChannel.id,
            originallyPublishedAt: videoInfo.originallyPublishedAt
        };
        const video = new video_1.VideoModel(videoData);
        video.url = url_1.getVideoActivityPubUrl(video);
        const videoFile = new video_file_1.VideoFileModel({
            extname: path_1.extname(videoPhysicalFile.filename),
            size: videoPhysicalFile.size,
            videoStreamingPlaylistId: null,
            metadata: yield ffmpeg_utils_1.getMetadataFromFile(videoPhysicalFile.path)
        });
        if (videoFile.isAudio()) {
            videoFile.resolution = constants_1.DEFAULT_AUDIO_RESOLUTION;
        }
        else {
            videoFile.fps = yield ffmpeg_utils_1.getVideoFileFPS(videoPhysicalFile.path);
            videoFile.resolution = (yield ffmpeg_utils_1.getVideoFileResolution(videoPhysicalFile.path)).videoFileResolution;
        }
        const destination = video_paths_1.getVideoFilePath(video, videoFile);
        yield fs_extra_1.move(videoPhysicalFile.path, destination);
        videoPhysicalFile.filename = video_paths_1.getVideoFilePath(video, videoFile);
        videoPhysicalFile.path = destination;
        const thumbnailField = req.files['thumbnailfile'];
        const thumbnailModel = thumbnailField
            ? yield thumbnail_1.createVideoMiniatureFromExisting(thumbnailField[0].path, video, thumbnail_type_1.ThumbnailType.MINIATURE, false)
            : yield thumbnail_1.generateVideoMiniature(video, videoFile, thumbnail_type_1.ThumbnailType.MINIATURE);
        const previewField = req.files['previewfile'];
        const previewModel = previewField
            ? yield thumbnail_1.createVideoMiniatureFromExisting(previewField[0].path, video, thumbnail_type_1.ThumbnailType.PREVIEW, false)
            : yield thumbnail_1.generateVideoMiniature(video, videoFile, thumbnail_type_1.ThumbnailType.PREVIEW);
        yield webtorrent_1.createTorrentAndSetInfoHash(video, videoFile);
        const { videoCreated } = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const sequelizeOptions = { transaction: t };
            const videoCreated = yield video.save(sequelizeOptions);
            yield videoCreated.addAndSaveThumbnail(thumbnailModel, t);
            yield videoCreated.addAndSaveThumbnail(previewModel, t);
            videoCreated.VideoChannel = res.locals.videoChannel;
            videoFile.videoId = video.id;
            yield videoFile.save(sequelizeOptions);
            video.VideoFiles = [videoFile];
            if (videoInfo.tags !== undefined) {
                const tagInstances = yield tag_1.TagModel.findOrCreateTags(videoInfo.tags, t);
                yield video.$set('Tags', tagInstances, sequelizeOptions);
                video.Tags = tagInstances;
            }
            if (videoInfo.scheduleUpdate) {
                yield schedule_video_update_1.ScheduleVideoUpdateModel.create({
                    videoId: video.id,
                    updateAt: videoInfo.scheduleUpdate.updateAt,
                    privacy: videoInfo.scheduleUpdate.privacy || null
                }, { transaction: t });
            }
            yield video_blacklist_1.autoBlacklistVideoIfNeeded({
                video,
                user: res.locals.oauth.token.User,
                isRemote: false,
                isNew: true,
                transaction: t
            });
            yield videos_1.federateVideoIfNeeded(video, true, t);
            auditLogger.create(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoAuditView(videoCreated.toFormattedDetailsJSON()));
            logger_1.logger.info('Video with name %s and uuid %s created.', videoInfo.name, videoCreated.uuid);
            return { videoCreated };
        }));
        notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(videoCreated);
        if (video.state === shared_1.VideoState.TO_TRANSCODE) {
            yield video_2.addOptimizeOrMergeAudioJob(videoCreated, videoFile);
        }
        hooks_1.Hooks.runAction('action:api.video.uploaded', { video: videoCreated });
        return res.json({
            video: {
                id: videoCreated.id,
                uuid: videoCreated.uuid
            }
        }).end();
    });
}
function updateVideo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        const videoFieldsSave = videoInstance.toJSON();
        const oldVideoAuditView = new audit_logger_1.VideoAuditView(videoInstance.toFormattedDetailsJSON());
        const videoInfoToUpdate = req.body;
        const wasConfidentialVideo = videoInstance.isConfidential();
        const hadPrivacyForFederation = videoInstance.hasPrivacyForFederation();
        const thumbnailModel = req.files && req.files['thumbnailfile']
            ? yield thumbnail_1.createVideoMiniatureFromExisting(req.files['thumbnailfile'][0].path, videoInstance, thumbnail_type_1.ThumbnailType.MINIATURE, false)
            : undefined;
        const previewModel = req.files && req.files['previewfile']
            ? yield thumbnail_1.createVideoMiniatureFromExisting(req.files['previewfile'][0].path, videoInstance, thumbnail_type_1.ThumbnailType.PREVIEW, false)
            : undefined;
        try {
            const videoInstanceUpdated = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                const sequelizeOptions = { transaction: t };
                const oldVideoChannel = videoInstance.VideoChannel;
                if (videoInfoToUpdate.name !== undefined)
                    videoInstance.name = videoInfoToUpdate.name;
                if (videoInfoToUpdate.category !== undefined)
                    videoInstance.category = videoInfoToUpdate.category;
                if (videoInfoToUpdate.licence !== undefined)
                    videoInstance.licence = videoInfoToUpdate.licence;
                if (videoInfoToUpdate.language !== undefined)
                    videoInstance.language = videoInfoToUpdate.language;
                if (videoInfoToUpdate.nsfw !== undefined)
                    videoInstance.nsfw = videoInfoToUpdate.nsfw;
                if (videoInfoToUpdate.waitTranscoding !== undefined)
                    videoInstance.waitTranscoding = videoInfoToUpdate.waitTranscoding;
                if (videoInfoToUpdate.support !== undefined)
                    videoInstance.support = videoInfoToUpdate.support;
                if (videoInfoToUpdate.description !== undefined)
                    videoInstance.description = videoInfoToUpdate.description;
                if (videoInfoToUpdate.commentsEnabled !== undefined)
                    videoInstance.commentsEnabled = videoInfoToUpdate.commentsEnabled;
                if (videoInfoToUpdate.downloadEnabled !== undefined)
                    videoInstance.downloadEnabled = videoInfoToUpdate.downloadEnabled;
                if (videoInfoToUpdate.originallyPublishedAt !== undefined && videoInfoToUpdate.originallyPublishedAt !== null) {
                    videoInstance.originallyPublishedAt = new Date(videoInfoToUpdate.originallyPublishedAt);
                }
                let isNewVideo = false;
                if (videoInfoToUpdate.privacy !== undefined) {
                    isNewVideo = videoInstance.isNewVideo(videoInfoToUpdate.privacy);
                    const newPrivacy = parseInt(videoInfoToUpdate.privacy.toString(), 10);
                    videoInstance.setPrivacy(newPrivacy);
                    if (hadPrivacyForFederation && !videoInstance.hasPrivacyForFederation()) {
                        yield video_1.VideoModel.sendDelete(videoInstance, { transaction: t });
                    }
                }
                const videoInstanceUpdated = yield videoInstance.save(sequelizeOptions);
                if (thumbnailModel)
                    yield videoInstanceUpdated.addAndSaveThumbnail(thumbnailModel, t);
                if (previewModel)
                    yield videoInstanceUpdated.addAndSaveThumbnail(previewModel, t);
                if (videoInfoToUpdate.tags !== undefined) {
                    const tagInstances = yield tag_1.TagModel.findOrCreateTags(videoInfoToUpdate.tags, t);
                    yield videoInstanceUpdated.$set('Tags', tagInstances, sequelizeOptions);
                    videoInstanceUpdated.Tags = tagInstances;
                }
                if (res.locals.videoChannel && videoInstanceUpdated.channelId !== res.locals.videoChannel.id) {
                    yield videoInstanceUpdated.$set('VideoChannel', res.locals.videoChannel, { transaction: t });
                    videoInstanceUpdated.VideoChannel = res.locals.videoChannel;
                    if (hadPrivacyForFederation === true)
                        yield share_1.changeVideoChannelShare(videoInstanceUpdated, oldVideoChannel, t);
                }
                if (videoInfoToUpdate.scheduleUpdate) {
                    yield schedule_video_update_1.ScheduleVideoUpdateModel.upsert({
                        videoId: videoInstanceUpdated.id,
                        updateAt: videoInfoToUpdate.scheduleUpdate.updateAt,
                        privacy: videoInfoToUpdate.scheduleUpdate.privacy || null
                    }, { transaction: t });
                }
                else if (videoInfoToUpdate.scheduleUpdate === null) {
                    yield schedule_video_update_1.ScheduleVideoUpdateModel.deleteByVideoId(videoInstanceUpdated.id, t);
                }
                yield video_blacklist_1.autoBlacklistVideoIfNeeded({
                    video: videoInstanceUpdated,
                    user: res.locals.oauth.token.User,
                    isRemote: false,
                    isNew: false,
                    transaction: t
                });
                yield videos_1.federateVideoIfNeeded(videoInstanceUpdated, isNewVideo, t);
                auditLogger.update(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoAuditView(videoInstanceUpdated.toFormattedDetailsJSON()), oldVideoAuditView);
                logger_1.logger.info('Video with name %s and uuid %s updated.', videoInstance.name, videoInstance.uuid);
                return videoInstanceUpdated;
            }));
            if (wasConfidentialVideo) {
                notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(videoInstanceUpdated);
            }
            hooks_1.Hooks.runAction('action:api.video.updated', { video: videoInstanceUpdated });
        }
        catch (err) {
            database_utils_1.resetSequelizeInstance(videoInstance, videoFieldsSave);
            throw err;
        }
        return res.type('json').status(204).end();
    });
}
function getVideo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = res.locals.oauth ? res.locals.oauth.token.User.id : null;
        const video = yield hooks_1.Hooks.wrapPromiseFun(video_1.VideoModel.loadForGetAPI, { id: res.locals.onlyVideoWithRights.id, userId }, 'filter:api.video.get.result');
        if (video.isOutdated()) {
            job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-refresher', payload: { type: 'video', url: video.url } });
        }
        return res.json(video.toFormattedDetailsJSON());
    });
}
function viewVideo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.onlyImmutableVideo;
        const ip = req.ip;
        const exists = yield redis_1.Redis.Instance.doesVideoIPViewExist(ip, videoInstance.uuid);
        if (exists) {
            logger_1.logger.debug('View for ip %s and video %s already exists.', ip, videoInstance.uuid);
            return res.status(204).end();
        }
        yield Promise.all([
            redis_1.Redis.Instance.addVideoView(videoInstance.id),
            redis_1.Redis.Instance.setIPVideoView(ip, videoInstance.uuid)
        ]);
        const serverActor = yield application_1.getServerActor();
        yield send_view_1.sendView(serverActor, videoInstance, undefined);
        hooks_1.Hooks.runAction('action:api.video.viewed', { video: videoInstance, ip });
        return res.status(204).end();
    });
}
function getVideoDescription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        let description = '';
        if (videoInstance.isOwned()) {
            description = videoInstance.description;
        }
        else {
            description = yield videos_1.fetchRemoteVideoDescription(videoInstance);
        }
        return res.json({ description });
    });
}
function getVideoFileMetadata(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoFile = yield video_file_1.VideoFileModel.loadWithMetadata(toInt_1.default(req.params.videoFileId));
        return res.json(videoFile.metadata);
    });
}
function listVideos(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const countVideos = express_utils_1.getCountVideos(req);
        const apiOptions = yield hooks_1.Hooks.wrapObject({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            includeLocalVideos: true,
            categoryOneOf: req.query.categoryOneOf,
            licenceOneOf: req.query.licenceOneOf,
            languageOneOf: req.query.languageOneOf,
            tagsOneOf: req.query.tagsOneOf,
            tagsAllOf: req.query.tagsAllOf,
            nsfw: express_utils_1.buildNSFWFilter(res, req.query.nsfw),
            filter: req.query.filter,
            withFiles: false,
            user: res.locals.oauth ? res.locals.oauth.token.User : undefined,
            countVideos
        }, 'filter:api.videos.list.params');
        const resultList = yield hooks_1.Hooks.wrapPromiseFun(video_1.VideoModel.listForApi, apiOptions, 'filter:api.videos.list.result');
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function removeVideo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            yield videoInstance.destroy({ transaction: t });
        }));
        auditLogger.delete(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoAuditView(videoInstance.toFormattedDetailsJSON()));
        logger_1.logger.info('Video with name %s and uuid %s deleted.', videoInstance.name, videoInstance.uuid);
        hooks_1.Hooks.runAction('action:api.video.deleted', { video: videoInstance });
        return res.type('json').status(204).end();
    });
}
