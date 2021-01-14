"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownershipVideoRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
const middlewares_1 = require("../../../middlewares");
const video_change_ownership_1 = require("../../../models/video/video-change-ownership");
const video_channel_1 = require("../../../models/video/video-channel");
const utils_1 = require("../../../helpers/utils");
const share_1 = require("../../../lib/activitypub/share");
const send_1 = require("../../../lib/activitypub/send");
const video_1 = require("../../../models/video/video");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const ownershipVideoRouter = express.Router();
exports.ownershipVideoRouter = ownershipVideoRouter;
ownershipVideoRouter.post('/:videoId/give-ownership', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videosChangeOwnershipValidator), middlewares_1.asyncRetryTransactionMiddleware(giveVideoOwnership));
ownershipVideoRouter.get('/ownership', middlewares_1.authenticate, middlewares_1.paginationValidator, middlewares_1.setDefaultPagination, middlewares_1.asyncRetryTransactionMiddleware(listVideoOwnership));
ownershipVideoRouter.post('/ownership/:id/accept', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videosTerminateChangeOwnershipValidator), middlewares_1.asyncMiddleware(middlewares_1.videosAcceptChangeOwnershipValidator), middlewares_1.asyncRetryTransactionMiddleware(acceptOwnership));
ownershipVideoRouter.post('/ownership/:id/refuse', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videosTerminateChangeOwnershipValidator), middlewares_1.asyncRetryTransactionMiddleware(refuseOwnership));
function giveVideoOwnership(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        const initiatorAccountId = res.locals.oauth.token.User.Account.id;
        const nextOwner = res.locals.nextOwner;
        yield database_1.sequelizeTypescript.transaction(t => {
            return video_change_ownership_1.VideoChangeOwnershipModel.findOrCreate({
                where: {
                    initiatorAccountId,
                    nextOwnerAccountId: nextOwner.id,
                    videoId: videoInstance.id,
                    status: "WAITING"
                },
                defaults: {
                    initiatorAccountId,
                    nextOwnerAccountId: nextOwner.id,
                    videoId: videoInstance.id,
                    status: "WAITING"
                },
                transaction: t
            });
        });
        logger_1.logger.info('Ownership change for video %s created.', videoInstance.name);
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
function listVideoOwnership(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const currentAccountId = res.locals.oauth.token.User.Account.id;
        const resultList = yield video_change_ownership_1.VideoChangeOwnershipModel.listForApi(currentAccountId, req.query.start || 0, req.query.count || 10, req.query.sort || 'createdAt');
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function acceptOwnership(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoChangeOwnership = res.locals.videoChangeOwnership;
            const channel = res.locals.videoChannel;
            const targetVideo = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoChangeOwnership.Video.id);
            const oldVideoChannel = yield video_channel_1.VideoChannelModel.loadByIdAndPopulateAccount(targetVideo.channelId);
            targetVideo.channelId = channel.id;
            const targetVideoUpdated = yield targetVideo.save({ transaction: t });
            targetVideoUpdated.VideoChannel = channel;
            if (targetVideoUpdated.hasPrivacyForFederation() && targetVideoUpdated.state === 1) {
                yield share_1.changeVideoChannelShare(targetVideoUpdated, oldVideoChannel, t);
                yield send_1.sendUpdateVideo(targetVideoUpdated, t, oldVideoChannel.Account.Actor);
            }
            videoChangeOwnership.status = "ACCEPTED";
            yield videoChangeOwnership.save({ transaction: t });
            return res.sendStatus(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
        }));
    });
}
function refuseOwnership(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoChangeOwnership = res.locals.videoChangeOwnership;
            videoChangeOwnership.status = "REFUSED";
            yield videoChangeOwnership.save({ transaction: t });
            return res.sendStatus(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
        }));
    });
}
