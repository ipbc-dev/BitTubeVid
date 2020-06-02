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
const video_blacklist_1 = require("@server/lib/video-blacklist");
const shared_1 = require("../../../../shared");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const database_1 = require("../../../initializers/database");
const middlewares_1 = require("../../../middlewares");
const video_blacklist_2 = require("../../../models/video/video-blacklist");
const blacklistRouter = express.Router();
exports.blacklistRouter = blacklistRouter;
blacklistRouter.post('/:videoId/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.asyncMiddleware(middlewares_1.videosBlacklistAddValidator), middlewares_1.asyncMiddleware(addVideoToBlacklistController));
blacklistRouter.get('/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.paginationValidator, middlewares_1.blacklistSortValidator, middlewares_1.setBlacklistSort, middlewares_1.setDefaultPagination, middlewares_1.videosBlacklistFiltersValidator, middlewares_1.asyncMiddleware(listBlacklist));
blacklistRouter.put('/:videoId/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.asyncMiddleware(middlewares_1.videosBlacklistUpdateValidator), middlewares_1.asyncMiddleware(updateVideoBlacklistController));
blacklistRouter.delete('/:videoId/blacklist', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST), middlewares_1.asyncMiddleware(middlewares_1.videosBlacklistRemoveValidator), middlewares_1.asyncMiddleware(removeVideoFromBlacklistController));
function addVideoToBlacklistController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        const body = req.body;
        yield video_blacklist_1.blacklistVideo(videoInstance, body);
        logger_1.logger.info('Video %s blacklisted.', videoInstance.uuid);
        return res.type('json').sendStatus(204);
    });
}
function updateVideoBlacklistController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoBlacklist = res.locals.videoBlacklist;
        if (req.body.reason !== undefined)
            videoBlacklist.reason = req.body.reason;
        yield database_1.sequelizeTypescript.transaction(t => {
            return videoBlacklist.save({ transaction: t });
        });
        return res.type('json').sendStatus(204);
    });
}
function listBlacklist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const resultList = yield video_blacklist_2.VideoBlacklistModel.listForApi({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            search: req.query.search,
            type: req.query.type
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function removeVideoFromBlacklistController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoBlacklist = res.locals.videoBlacklist;
        const video = res.locals.videoAll;
        yield video_blacklist_1.unblacklistVideo(videoBlacklist, video);
        logger_1.logger.info('Video %s removed from blacklist.', video.uuid);
        return res.type('json').sendStatus(204);
    });
}
