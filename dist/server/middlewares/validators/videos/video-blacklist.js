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
const express_validator_1 = require("express-validator");
const misc_1 = require("../../../helpers/custom-validators/misc");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../utils");
const video_blacklist_1 = require("../../../helpers/custom-validators/video-blacklist");
const middlewares_1 = require("../../../helpers/middlewares");
const videosBlacklistRemoveValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking blacklistRemove parameters.', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!(yield middlewares_1.doesVideoBlacklistExist(res.locals.videoAll.id, res)))
            return;
        return next();
    })
];
exports.videosBlacklistRemoveValidator = videosBlacklistRemoveValidator;
const videosBlacklistAddValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.body('unfederate')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull)
        .custom(misc_1.isBooleanValid).withMessage('Should have a valid unfederate boolean'),
    express_validator_1.body('reason')
        .optional()
        .custom(video_blacklist_1.isVideoBlacklistReasonValid).withMessage('Should have a valid reason'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videosBlacklistAdd parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        const video = res.locals.videoAll;
        if (req.body.unfederate === true && video.remote === true) {
            return res
                .status(409)
                .send({ error: 'You cannot unfederate a remote video.' })
                .end();
        }
        return next();
    })
];
exports.videosBlacklistAddValidator = videosBlacklistAddValidator;
const videosBlacklistUpdateValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.body('reason')
        .optional()
        .custom(video_blacklist_1.isVideoBlacklistReasonValid).withMessage('Should have a valid reason'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videosBlacklistUpdate parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!(yield middlewares_1.doesVideoBlacklistExist(res.locals.videoAll.id, res)))
            return;
        return next();
    })
];
exports.videosBlacklistUpdateValidator = videosBlacklistUpdateValidator;
const videosBlacklistFiltersValidator = [
    express_validator_1.query('type')
        .optional()
        .custom(video_blacklist_1.isVideoBlacklistTypeValid).withMessage('Should have a valid video blacklist type attribute'),
    (req, res, next) => {
        logger_1.logger.debug('Checking videos blacklist filters query', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.videosBlacklistFiltersValidator = videosBlacklistFiltersValidator;
