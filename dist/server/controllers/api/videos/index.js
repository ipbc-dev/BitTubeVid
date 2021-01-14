"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videosRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const toInt_1 = require("validator/lib/toInt");
const video_1 = require("@server/helpers/video");
const webtorrent_1 = require("@server/helpers/webtorrent");
const share_1 = require("@server/lib/activitypub/share");
const url_1 = require("@server/lib/activitypub/url");
const live_manager_1 = require("@server/lib/live-manager");
const video_2 = require("@server/lib/video");
const video_paths_1 = require("@server/lib/video-paths");
const application_1 = require("@server/models/application/application");
const audit_logger_1 = require("../../../helpers/audit-logger");
const database_utils_1 = require("../../../helpers/database-utils");
const express_utils_1 = require("../../../helpers/express-utils");
const ffprobe_utils_1 = require("../../../helpers/ffprobe-utils");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const config_1 = require("../../../initializers/config");
const constants_1 = require("../../../initializers/constants");
const database_1 = require("../../../initializers/database");
const send_view_1 = require("../../../lib/activitypub/send/send-view");
const videos_1 = require("../../../lib/activitypub/videos");
const job_queue_1 = require("../../../lib/job-queue");
const notifier_1 = require("../../../lib/notifier");
const hooks_1 = require("../../../lib/plugins/hooks");
const redis_1 = require("../../../lib/redis");
const thumbnail_1 = require("../../../lib/thumbnail");
const video_blacklist_1 = require("../../../lib/video-blacklist");
const middlewares_1 = require("../../../middlewares");
const schedule_video_update_1 = require("../../../models/video/schedule-video-update");
const video_3 = require("../../../models/video/video");
const video_file_1 = require("../../../models/video/video-file");
const blacklist_1 = require("./blacklist");
const captions_1 = require("./captions");
const comment_1 = require("./comment");
const import_1 = require("./import");
const live_1 = require("./live");
const ownership_1 = require("./ownership");
const rate_1 = require("./rate");
const watching_1 = require("./watching");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
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
videosRouter.use('/', blacklist_1.blacklistRouter);
videosRouter.use('/', rate_1.rateVideoRouter);
videosRouter.use('/', comment_1.videoCommentRouter);
videosRouter.use('/', captions_1.videoCaptionsRouter);
videosRouter.use('/', import_1.videoImportsRouter);
videosRouter.use('/', ownership_1.ownershipVideoRouter);
videosRouter.use('/', watching_1.watchingRouter);
videosRouter.use('/', live_1.liveRouter);
videosRouter.get('/categories', listVideoCategories);
videosRouter.get('/licences', listVideoLicences);
videosRouter.get('/languages', listVideoLanguages);
videosRouter.get('/privacies', listVideoPrivacies);
videosRouter.get('/', middlewares_1.paginationValidator, middlewares_1.videosSortValidator, middlewares_1.setDefaultVideosSort, middlewares_1.setDefaultPagination, middlewares_1.optionalAuthenticate, middlewares_1.commonVideosFiltersValidator, middlewares_1.asyncMiddleware(listVideos));
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        req.setTimeout(1000 * 60 * 10, () => {
            logger_1.logger.error('Upload video has timed out.');
            return res.sendStatus(http_error_codes_1.HttpStatusCode.REQUEST_TIMEOUT_408);
        });
        const videoPhysicalFile = req.files['videofile'][0];
        const videoInfo = req.body;
        const videoData = video_2.buildLocalVideoFromReq(videoInfo, res.locals.videoChannel.id);
        videoData.state = config_1.CONFIG.TRANSCODING.ENABLED ? 2 : 1;
        videoData.duration = videoPhysicalFile['duration'];
        const video = new video_3.VideoModel(videoData);
        video.url = url_1.getLocalVideoActivityPubUrl(video);
        const videoFile = new video_file_1.VideoFileModel({
            extname: path_1.extname(videoPhysicalFile.filename),
            size: videoPhysicalFile.size,
            videoStreamingPlaylistId: null,
            metadata: yield ffprobe_utils_1.getMetadataFromFile(videoPhysicalFile.path)
        });
        if (videoFile.isAudio()) {
            videoFile.resolution = constants_1.DEFAULT_AUDIO_RESOLUTION;
        }
        else {
            videoFile.fps = yield ffprobe_utils_1.getVideoFileFPS(videoPhysicalFile.path);
            videoFile.resolution = (yield ffprobe_utils_1.getVideoFileResolution(videoPhysicalFile.path)).videoFileResolution;
        }
        const destination = video_paths_1.getVideoFilePath(video, videoFile);
        yield fs_extra_1.move(videoPhysicalFile.path, destination);
        videoPhysicalFile.filename = video_paths_1.getVideoFilePath(video, videoFile);
        videoPhysicalFile.path = destination;
        const [thumbnailModel, previewModel] = yield video_2.buildVideoThumbnailsFromReq({
            video,
            files: req.files,
            fallback: type => thumbnail_1.generateVideoMiniature(video, videoFile, type)
        });
        yield webtorrent_1.createTorrentAndSetInfoHash(video, videoFile);
        const { videoCreated } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sequelizeOptions = { transaction: t };
            const videoCreated = yield video.save(sequelizeOptions);
            yield videoCreated.addAndSaveThumbnail(thumbnailModel, t);
            yield videoCreated.addAndSaveThumbnail(previewModel, t);
            videoCreated.VideoChannel = res.locals.videoChannel;
            videoFile.videoId = video.id;
            yield videoFile.save(sequelizeOptions);
            video.VideoFiles = [videoFile];
            yield video_2.setVideoTags({ video, tags: videoInfo.tags, transaction: t });
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
        if (video.state === 2) {
            yield video_1.addOptimizeOrMergeAudioJob(videoCreated, videoFile);
        }
        hooks_1.Hooks.runAction('action:api.video.uploaded', { video: videoCreated });
        return res.json({
            video: {
                id: videoCreated.id,
                uuid: videoCreated.uuid
            }
        });
    });
}
function updateVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        const videoFieldsSave = videoInstance.toJSON();
        const oldVideoAuditView = new audit_logger_1.VideoAuditView(videoInstance.toFormattedDetailsJSON());
        const videoInfoToUpdate = req.body;
        const wasConfidentialVideo = videoInstance.isConfidential();
        const hadPrivacyForFederation = videoInstance.hasPrivacyForFederation();
        const [thumbnailModel, previewModel] = yield video_2.buildVideoThumbnailsFromReq({
            video: videoInstance,
            files: req.files,
            fallback: () => Promise.resolve(undefined),
            automaticallyGenerated: false
        });
        try {
            const videoInstanceUpdated = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                        yield video_3.VideoModel.sendDelete(videoInstance, { transaction: t });
                    }
                }
                const videoInstanceUpdated = yield videoInstance.save(sequelizeOptions);
                if (thumbnailModel)
                    yield videoInstanceUpdated.addAndSaveThumbnail(thumbnailModel, t);
                if (previewModel)
                    yield videoInstanceUpdated.addAndSaveThumbnail(previewModel, t);
                yield video_2.setVideoTags({
                    video: videoInstanceUpdated,
                    tags: videoInfoToUpdate.tags,
                    transaction: t,
                    defaultValue: videoInstanceUpdated.Tags
                });
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
            hooks_1.Hooks.runAction('action:api.video.updated', { video: videoInstanceUpdated, body: req.body });
        }
        catch (err) {
            database_utils_1.resetSequelizeInstance(videoInstance, videoFieldsSave);
            throw err;
        }
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
function getVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const userId = res.locals.oauth ? res.locals.oauth.token.User.id : null;
        const video = yield hooks_1.Hooks.wrapPromiseFun(video_3.VideoModel.loadForGetAPI, { id: res.locals.onlyVideoWithRights.id, userId }, 'filter:api.video.get.result');
        if (video.isOutdated()) {
            job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-refresher', payload: { type: 'video', url: video.url } });
        }
        return res.json(video.toFormattedDetailsJSON());
    });
}
function viewVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const immutableVideoAttrs = res.locals.onlyImmutableVideo;
        const ip = req.ip;
        const exists = yield redis_1.Redis.Instance.doesVideoIPViewExist(ip, immutableVideoAttrs.uuid);
        if (exists) {
            logger_1.logger.debug('View for ip %s and video %s already exists.', ip, immutableVideoAttrs.uuid);
            return res.sendStatus(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
        }
        const video = yield video_3.VideoModel.load(immutableVideoAttrs.id);
        const promises = [
            redis_1.Redis.Instance.setIPVideoView(ip, video.uuid, video.isLive)
        ];
        let federateView = true;
        if (video.isLive && video.isOwned()) {
            live_manager_1.LiveManager.Instance.addViewTo(video.id);
            federateView = false;
        }
        if (!video.isLive) {
            promises.push(redis_1.Redis.Instance.addVideoView(video.id));
        }
        if (federateView) {
            const serverActor = yield application_1.getServerActor();
            promises.push(send_view_1.sendView(serverActor, video, undefined));
        }
        yield Promise.all(promises);
        hooks_1.Hooks.runAction('action:api.video.viewed', { video, ip });
        return res.sendStatus(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
    });
}
function getVideoDescription(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoFile = yield video_file_1.VideoFileModel.loadWithMetadata(toInt_1.default(req.params.videoFileId));
        return res.json(videoFile.metadata);
    });
}
function listVideos(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        const resultList = yield hooks_1.Hooks.wrapPromiseFun(video_3.VideoModel.listForApi, apiOptions, 'filter:api.videos.list.result');
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function removeVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield videoInstance.destroy({ transaction: t });
        }));
        auditLogger.delete(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoAuditView(videoInstance.toFormattedDetailsJSON()));
        logger_1.logger.info('Video with name %s and uuid %s deleted.', videoInstance.name, videoInstance.uuid);
        hooks_1.Hooks.runAction('action:api.video.deleted', { video: videoInstance });
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
