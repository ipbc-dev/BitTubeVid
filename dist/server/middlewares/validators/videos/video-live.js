"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoLiveGetValidator = exports.videoLiveUpdateValidator = exports.videoLiveAddValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const videos_1 = require("@server/helpers/middlewares/videos");
const video_live_1 = require("@server/models/video/video-live");
const misc_1 = require("../../../helpers/custom-validators/misc");
const videos_2 = require("../../../helpers/custom-validators/videos");
const express_utils_1 = require("../../../helpers/express-utils");
const logger_1 = require("../../../helpers/logger");
const config_1 = require("../../../initializers/config");
const utils_1 = require("../utils");
const videos_3 = require("./videos");
const video_1 = require("@server/models/video/video");
const hooks_1 = require("@server/lib/plugins/hooks");
const moderation_1 = require("@server/lib/moderation");
const http_error_codes_1 = require("@shared/core-utils/miscs/http-error-codes");
const videoLiveGetValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoLiveGetValidator parameters', { parameters: req.params, user: res.locals.oauth.token.User.username });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield videos_1.doesVideoExist(req.params.videoId, res, 'all')))
            return;
        const user = res.locals.oauth.token.User;
        if (!videos_1.checkUserCanManageVideo(user, res.locals.videoAll, 18, res, false))
            return;
        const videoLive = yield video_live_1.VideoLiveModel.loadByVideoId(res.locals.videoAll.id);
        if (!videoLive)
            return res.sendStatus(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
        res.locals.videoLive = videoLive;
        return next();
    })
];
exports.videoLiveGetValidator = videoLiveGetValidator;
const videoLiveAddValidator = videos_3.getCommonVideoEditAttributes().concat([
    express_validator_1.body('channelId')
        .customSanitizer(misc_1.toIntOrNull)
        .custom(misc_1.isIdValid).withMessage('Should have correct video channel id'),
    express_validator_1.body('name')
        .custom(videos_2.isVideoNameValid).withMessage('Should have a valid name'),
    express_validator_1.body('saveReplay')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull)
        .custom(misc_1.isBooleanValid).withMessage('Should have a valid saveReplay attribute'),
    express_validator_1.body('permanentLive')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull)
        .custom(misc_1.isBooleanValid).withMessage('Should have a valid permanentLive attribute'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoLiveAddValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (config_1.CONFIG.LIVE.ENABLED !== true) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: 'Live is not enabled on this instance' });
        }
        if (config_1.CONFIG.LIVE.ALLOW_REPLAY !== true && req.body.saveReplay === true) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: 'Saving live replay is not allowed instance' });
        }
        if (req.body.permanentLive && req.body.saveReplay) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({ error: 'Cannot set this live as permanent while saving its replay' });
        }
        const user = res.locals.oauth.token.User;
        if (!(yield videos_1.doesVideoChannelOfAccountExist(req.body.channelId, user, res)))
            return express_utils_1.cleanUpReqFiles(req);
        if (config_1.CONFIG.LIVE.MAX_INSTANCE_LIVES !== -1) {
            const totalInstanceLives = yield video_1.VideoModel.countLocalLives();
            if (totalInstanceLives >= config_1.CONFIG.LIVE.MAX_INSTANCE_LIVES) {
                express_utils_1.cleanUpReqFiles(req);
                return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                    .json({
                    code: 2,
                    error: 'Cannot create this live because the max instance lives limit is reached.'
                });
            }
        }
        if (config_1.CONFIG.LIVE.MAX_USER_LIVES !== -1) {
            const totalUserLives = yield video_1.VideoModel.countLivesOfAccount(user.Account.id);
            if (totalUserLives >= config_1.CONFIG.LIVE.MAX_USER_LIVES) {
                express_utils_1.cleanUpReqFiles(req);
                return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                    .json({
                    code: 3,
                    error: 'Cannot create this live because the max user lives limit is reached.'
                });
            }
        }
        if (!(yield isLiveVideoAccepted(req, res)))
            return express_utils_1.cleanUpReqFiles(req);
        return next();
    })
]);
exports.videoLiveAddValidator = videoLiveAddValidator;
const videoLiveUpdateValidator = [
    express_validator_1.body('saveReplay')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull)
        .custom(misc_1.isBooleanValid).withMessage('Should have a valid saveReplay attribute'),
    (req, res, next) => {
        logger_1.logger.debug('Checking videoLiveUpdateValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (req.body.permanentLive && req.body.saveReplay) {
            return res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({ error: 'Cannot set this live as permanent while saving its replay' });
        }
        if (config_1.CONFIG.LIVE.ALLOW_REPLAY !== true && req.body.saveReplay === true) {
            return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: 'Saving live replay is not allowed instance' });
        }
        if (res.locals.videoAll.state !== 4) {
            return res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({ error: 'Cannot update a live that has already started' });
        }
        const user = res.locals.oauth.token.User;
        if (!videos_1.checkUserCanManageVideo(user, res.locals.videoAll, 18, res))
            return;
        return next();
    }
];
exports.videoLiveUpdateValidator = videoLiveUpdateValidator;
function isLiveVideoAccepted(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const acceptParameters = {
            liveVideoBody: req.body,
            user: res.locals.oauth.token.User
        };
        const acceptedResult = yield hooks_1.Hooks.wrapFun(moderation_1.isLocalLiveVideoAccepted, acceptParameters, 'filter:api.live-video.create.accept.result');
        if (!acceptedResult || acceptedResult.accepted !== true) {
            logger_1.logger.info('Refused local live video.', { acceptedResult, acceptParameters });
            res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: acceptedResult.errorMessage || 'Refused local live video' });
            return false;
        }
        return true;
    });
}
