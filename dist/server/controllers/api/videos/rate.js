"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateVideoRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const logger_1 = require("../../../helpers/logger");
const constants_1 = require("../../../initializers/constants");
const video_rates_1 = require("../../../lib/activitypub/video-rates");
const middlewares_1 = require("../../../middlewares");
const account_1 = require("../../../models/account/account");
const account_video_rate_1 = require("../../../models/account/account-video-rate");
const database_1 = require("../../../initializers/database");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const rateVideoRouter = express.Router();
exports.rateVideoRouter = rateVideoRouter;
rateVideoRouter.put('/:id/rate', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoUpdateRateValidator), middlewares_1.asyncRetryTransactionMiddleware(rateVideo));
function rateVideo(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const rateType = body.rating;
        const videoInstance = res.locals.videoAll;
        const userAccount = res.locals.oauth.token.User.Account;
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sequelizeOptions = { transaction: t };
            const accountInstance = yield account_1.AccountModel.load(userAccount.id, t);
            const previousRate = yield account_video_rate_1.AccountVideoRateModel.load(accountInstance.id, videoInstance.id, t);
            let likesToIncrement = 0;
            let dislikesToIncrement = 0;
            if (rateType === constants_1.VIDEO_RATE_TYPES.LIKE)
                likesToIncrement++;
            else if (rateType === constants_1.VIDEO_RATE_TYPES.DISLIKE)
                dislikesToIncrement++;
            if (previousRate) {
                if (previousRate.type === 'like')
                    likesToIncrement--;
                else if (previousRate.type === 'dislike')
                    dislikesToIncrement--;
                if (rateType === 'none') {
                    yield previousRate.destroy(sequelizeOptions);
                }
                else {
                    previousRate.type = rateType;
                    previousRate.url = video_rates_1.getLocalRateUrl(rateType, userAccount.Actor, videoInstance);
                    yield previousRate.save(sequelizeOptions);
                }
            }
            else if (rateType !== 'none') {
                const query = {
                    accountId: accountInstance.id,
                    videoId: videoInstance.id,
                    type: rateType,
                    url: video_rates_1.getLocalRateUrl(rateType, userAccount.Actor, videoInstance)
                };
                yield account_video_rate_1.AccountVideoRateModel.create(query, sequelizeOptions);
            }
            const incrementQuery = {
                likes: likesToIncrement,
                dislikes: dislikesToIncrement
            };
            yield videoInstance.increment(incrementQuery, sequelizeOptions);
            yield video_rates_1.sendVideoRateChange(accountInstance, videoInstance, likesToIncrement, dislikesToIncrement, t);
            logger_1.logger.info('Account video rate for video %s of account %s updated.', videoInstance.name, accountInstance.name);
        }));
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
