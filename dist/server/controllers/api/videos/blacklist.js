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
const shared_1 = require("../../../../shared");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const middlewares_1 = require("../../../middlewares");
const video_blacklist_1 = require("../../../models/video/video-blacklist");
const initializers_1 = require("../../../initializers");
const notifier_1 = require("../../../lib/notifier");
const send_1 = require("../../../lib/activitypub/send");
const activitypub_1 = require("../../../lib/activitypub");
const blacklistRouter = express.Router();
exports.blacklistRouter = blacklistRouter;
blacklistRouter.post('/:videoId/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.asyncMiddleware(middlewares_1.videosBlacklistAddValidator), middlewares_1.asyncMiddleware(addVideoToBlacklist));
blacklistRouter.get('/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.paginationValidator, middlewares_1.blacklistSortValidator, middlewares_1.setBlacklistSort, middlewares_1.setDefaultPagination, middlewares_1.videosBlacklistFiltersValidator, middlewares_1.asyncMiddleware(listBlacklist));
blacklistRouter.put('/:videoId/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.asyncMiddleware(middlewares_1.videosBlacklistUpdateValidator), middlewares_1.asyncMiddleware(updateVideoBlacklistController));
blacklistRouter.delete('/:videoId/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.asyncMiddleware(middlewares_1.videosBlacklistRemoveValidator), middlewares_1.asyncMiddleware(removeVideoFromBlacklistController));
function addVideoToBlacklist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        const body = req.body;
        const toCreate = {
            videoId: videoInstance.id,
            unfederated: body.unfederate === true,
            reason: body.reason,
            type: shared_1.VideoBlacklistType.MANUAL
        };
        const blacklist = yield video_blacklist_1.VideoBlacklistModel.create(toCreate);
        blacklist.Video = videoInstance;
        if (body.unfederate === true) {
            yield send_1.sendDeleteVideo(videoInstance, undefined);
        }
        notifier_1.Notifier.Instance.notifyOnVideoBlacklist(blacklist);
        logger_1.logger.info('Video %s blacklisted.', videoInstance.uuid);
        return res.type('json').status(204).end();
    });
}
function updateVideoBlacklistController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoBlacklist = res.locals.videoBlacklist;
        if (req.body.reason !== undefined)
            videoBlacklist.reason = req.body.reason;
        yield initializers_1.sequelizeTypescript.transaction(t => {
            return videoBlacklist.save({ transaction: t });
        });
        return res.type('json').status(204).end();
    });
}
function listBlacklist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const resultList = yield video_blacklist_1.VideoBlacklistModel.listForApi(req.query.start, req.query.count, req.query.sort, req.query.type);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function removeVideoFromBlacklistController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoBlacklist = res.locals.videoBlacklist;
        const video = res.locals.videoAll;
        const videoBlacklistType = yield initializers_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const unfederated = videoBlacklist.unfederated;
            const videoBlacklistType = videoBlacklist.type;
            yield videoBlacklist.destroy({ transaction: t });
            video.VideoBlacklist = undefined;
            if (unfederated === true) {
                yield activitypub_1.federateVideoIfNeeded(video, true, t);
            }
            return videoBlacklistType;
        }));
        notifier_1.Notifier.Instance.notifyOnVideoUnblacklist(video);
        if (videoBlacklistType === shared_1.VideoBlacklistType.AUTO_BEFORE_PUBLISHED) {
            notifier_1.Notifier.Instance.notifyOnVideoPublishedAfterRemovedFromAutoBlacklist(video);
            delete video.VideoBlacklist;
            notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(video);
        }
        logger_1.logger.info('Video %s removed from blacklist.', video.uuid);
        return res.type('json').status(204).end();
    });
}
