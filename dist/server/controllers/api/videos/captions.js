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
const middlewares_1 = require("../../../middlewares");
const validators_1 = require("../../../middlewares/validators");
const express_utils_1 = require("../../../helpers/express-utils");
const constants_1 = require("../../../initializers/constants");
const utils_1 = require("../../../helpers/utils");
const video_caption_1 = require("../../../models/video/video-caption");
const logger_1 = require("../../../helpers/logger");
const activitypub_1 = require("../../../lib/activitypub");
const captions_utils_1 = require("../../../helpers/captions-utils");
const config_1 = require("../../../initializers/config");
const database_1 = require("../../../initializers/database");
const reqVideoCaptionAdd = express_utils_1.createReqFiles(['captionfile'], constants_1.MIMETYPES.VIDEO_CAPTIONS.MIMETYPE_EXT, {
    captionfile: config_1.CONFIG.STORAGE.CAPTIONS_DIR
});
const videoCaptionsRouter = express.Router();
exports.videoCaptionsRouter = videoCaptionsRouter;
videoCaptionsRouter.get('/:videoId/captions', middlewares_1.asyncMiddleware(validators_1.listVideoCaptionsValidator), middlewares_1.asyncMiddleware(listVideoCaptions));
videoCaptionsRouter.put('/:videoId/captions/:captionLanguage', middlewares_1.authenticate, reqVideoCaptionAdd, middlewares_1.asyncMiddleware(validators_1.addVideoCaptionValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoCaption));
videoCaptionsRouter.delete('/:videoId/captions/:captionLanguage', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.deleteVideoCaptionValidator), middlewares_1.asyncRetryTransactionMiddleware(deleteVideoCaption));
function listVideoCaptions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield video_caption_1.VideoCaptionModel.listVideoCaptions(res.locals.videoId.id);
        return res.json(utils_1.getFormattedObjects(data, data.length));
    });
}
function addVideoCaption(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoCaptionPhysicalFile = req.files['captionfile'][0];
        const video = res.locals.videoAll;
        const videoCaption = new video_caption_1.VideoCaptionModel({
            videoId: video.id,
            language: req.params.captionLanguage
        });
        videoCaption.Video = video;
        yield captions_utils_1.moveAndProcessCaptionFile(videoCaptionPhysicalFile, videoCaption);
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            yield video_caption_1.VideoCaptionModel.insertOrReplaceLanguage(video.id, req.params.captionLanguage, t);
            yield activitypub_1.federateVideoIfNeeded(video, false, t);
        }));
        return res.status(204).end();
    });
}
function deleteVideoCaption(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = res.locals.videoAll;
        const videoCaption = res.locals.videoCaption;
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            yield videoCaption.destroy({ transaction: t });
            yield activitypub_1.federateVideoIfNeeded(video, false, t);
        }));
        logger_1.logger.info('Video caption %s of video %s deleted.', videoCaption.language, video.uuid);
        return res.type('json').status(204).end();
    });
}
