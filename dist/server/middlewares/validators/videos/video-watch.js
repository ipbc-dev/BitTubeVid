"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoWatchingValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const misc_1 = require("../../../helpers/custom-validators/misc");
const utils_1 = require("../utils");
const logger_1 = require("../../../helpers/logger");
const middlewares_1 = require("../../../helpers/middlewares");
const videoWatchingValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('currentTime')
        .customSanitizer(misc_1.toIntOrNull)
        .isInt().withMessage('Should have correct current time'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoWatching parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res, 'id')))
            return;
        const user = res.locals.oauth.token.User;
        if (user.videosHistoryEnabled === false) {
            logger_1.logger.warn('Cannot set videos to watch by user %d: videos history is disabled.', user.id);
            return res.status(409).end();
        }
        return next();
    })
];
exports.videoWatchingValidator = videoWatchingValidator;
