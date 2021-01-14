"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const uuid_1 = require("uuid");
const express_utils_1 = require("@server/helpers/express-utils");
const config_1 = require("@server/initializers/config");
const constants_1 = require("@server/initializers/constants");
const url_1 = require("@server/lib/activitypub/url");
const videos_1 = require("@server/lib/activitypub/videos");
const hooks_1 = require("@server/lib/plugins/hooks");
const video_1 = require("@server/lib/video");
const video_live_1 = require("@server/middlewares/validators/videos/video-live");
const video_live_2 = require("@server/models/video/video-live");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
const thumbnail_1 = require("../../../lib/thumbnail");
const middlewares_1 = require("../../../middlewares");
const video_2 = require("../../../models/video/video");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const liveRouter = express.Router();
exports.liveRouter = liveRouter;
const reqVideoFileLive = express_utils_1.createReqFiles(['thumbnailfile', 'previewfile'], constants_1.MIMETYPES.IMAGE.MIMETYPE_EXT, {
    thumbnailfile: config_1.CONFIG.STORAGE.TMP_DIR,
    previewfile: config_1.CONFIG.STORAGE.TMP_DIR
});
liveRouter.post('/live', middlewares_1.authenticate, reqVideoFileLive, middlewares_1.asyncMiddleware(video_live_1.videoLiveAddValidator), middlewares_1.asyncRetryTransactionMiddleware(addLiveVideo));
liveRouter.get('/live/:videoId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(video_live_1.videoLiveGetValidator), middlewares_1.asyncRetryTransactionMiddleware(getLiveVideo));
liveRouter.put('/live/:videoId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(video_live_1.videoLiveGetValidator), video_live_1.videoLiveUpdateValidator, middlewares_1.asyncRetryTransactionMiddleware(updateLiveVideo));
function getLiveVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoLive = res.locals.videoLive;
        return res.json(videoLive.toFormattedJSON());
    });
}
function updateLiveVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const video = res.locals.videoAll;
        const videoLive = res.locals.videoLive;
        videoLive.saveReplay = body.saveReplay || false;
        videoLive.permanentLive = body.permanentLive || false;
        video.VideoLive = yield videoLive.save();
        yield videos_1.federateVideoIfNeeded(video, false);
        return res.sendStatus(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
    });
}
function addLiveVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoInfo = req.body;
        const videoData = video_1.buildLocalVideoFromReq(videoInfo, res.locals.videoChannel.id);
        videoData.isLive = true;
        videoData.state = 4;
        videoData.duration = 0;
        const video = new video_2.VideoModel(videoData);
        video.url = url_1.getLocalVideoActivityPubUrl(video);
        const videoLive = new video_live_2.VideoLiveModel();
        videoLive.saveReplay = videoInfo.saveReplay || false;
        videoLive.permanentLive = videoInfo.permanentLive || false;
        videoLive.streamKey = uuid_1.v4();
        const [thumbnailModel, previewModel] = yield video_1.buildVideoThumbnailsFromReq({
            video,
            files: req.files,
            fallback: type => {
                return thumbnail_1.createVideoMiniatureFromExisting({
                    inputPath: constants_1.ASSETS_PATH.DEFAULT_LIVE_BACKGROUND,
                    video,
                    type,
                    automaticallyGenerated: true,
                    keepOriginal: true
                });
            }
        });
        const { videoCreated } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sequelizeOptions = { transaction: t };
            const videoCreated = yield video.save(sequelizeOptions);
            if (thumbnailModel)
                yield videoCreated.addAndSaveThumbnail(thumbnailModel, t);
            if (previewModel)
                yield videoCreated.addAndSaveThumbnail(previewModel, t);
            videoCreated.VideoChannel = res.locals.videoChannel;
            videoLive.videoId = videoCreated.id;
            videoCreated.VideoLive = yield videoLive.save(sequelizeOptions);
            yield video_1.setVideoTags({ video, tags: videoInfo.tags, transaction: t });
            yield videos_1.federateVideoIfNeeded(videoCreated, true, t);
            logger_1.logger.info('Video live %s with uuid %s created.', videoInfo.name, videoCreated.uuid);
            return { videoCreated };
        }));
        hooks_1.Hooks.runAction('action:api.live-video.created', { video: videoCreated });
        return res.json({
            video: {
                id: videoCreated.id,
                uuid: videoCreated.uuid
            }
        });
    });
}
