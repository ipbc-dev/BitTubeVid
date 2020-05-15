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
const video_abuses_1 = require("../../../helpers/custom-validators/video-abuses");
const middlewares_1 = require("../../../helpers/middlewares");
const videoAbuseReportValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.body('reason').custom(video_abuses_1.isVideoAbuseReasonValid).withMessage('Should have a valid reason'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoAbuseReport parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        return next();
    })
];
exports.videoAbuseReportValidator = videoAbuseReportValidator;
const videoAbuseGetValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.param('id').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid id'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoAbuseGetValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!(yield middlewares_1.doesVideoAbuseExist(req.params.id, res.locals.videoAll.id, res)))
            return;
        return next();
    })
];
exports.videoAbuseGetValidator = videoAbuseGetValidator;
const videoAbuseUpdateValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.param('id').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('state')
        .optional()
        .custom(video_abuses_1.isVideoAbuseStateValid).withMessage('Should have a valid video abuse state'),
    express_validator_1.body('moderationComment')
        .optional()
        .custom(video_abuses_1.isVideoAbuseModerationCommentValid).withMessage('Should have a valid video moderation comment'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoAbuseUpdateValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!(yield middlewares_1.doesVideoAbuseExist(req.params.id, res.locals.videoAll.id, res)))
            return;
        return next();
    })
];
exports.videoAbuseUpdateValidator = videoAbuseUpdateValidator;
