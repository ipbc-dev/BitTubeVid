"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoAbuseUpdateValidator = exports.videoAbuseGetValidator = exports.videoAbuseReportValidator = exports.videoAbuseListValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const misc_1 = require("../../../helpers/custom-validators/misc");
const video_abuses_1 = require("../../../helpers/custom-validators/video-abuses");
const logger_1 = require("../../../helpers/logger");
const middlewares_1 = require("../../../helpers/middlewares");
const utils_1 = require("../utils");
const videoAbuseReportValidator = [
    express_validator_1.param('videoId')
        .custom(misc_1.isIdOrUUIDValid)
        .not()
        .isEmpty()
        .withMessage('Should have a valid videoId'),
    express_validator_1.body('reason')
        .custom(video_abuses_1.isVideoAbuseReasonValid)
        .withMessage('Should have a valid reason'),
    express_validator_1.body('predefinedReasons')
        .optional()
        .custom(video_abuses_1.isVideoAbusePredefinedReasonsValid)
        .withMessage('Should have a valid list of predefined reasons'),
    express_validator_1.body('startAt')
        .optional()
        .customSanitizer(misc_1.toIntOrNull)
        .custom(video_abuses_1.isVideoAbuseTimestampValid)
        .withMessage('Should have valid starting time value'),
    express_validator_1.body('endAt')
        .optional()
        .customSanitizer(misc_1.toIntOrNull)
        .custom(video_abuses_1.isVideoAbuseTimestampValid)
        .withMessage('Should have valid ending time value')
        .bail()
        .custom(video_abuses_1.isVideoAbuseTimestampCoherent)
        .withMessage('Should have a startAt timestamp beginning before endAt'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
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
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoAbuseGetValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoAbuseExist(req.params.id, req.params.videoId, res)))
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
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoAbuseUpdateValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoAbuseExist(req.params.id, req.params.videoId, res)))
            return;
        return next();
    })
];
exports.videoAbuseUpdateValidator = videoAbuseUpdateValidator;
const videoAbuseListValidator = [
    express_validator_1.query('id')
        .optional()
        .custom(misc_1.isIdValid).withMessage('Should have a valid id'),
    express_validator_1.query('predefinedReason')
        .optional()
        .custom(video_abuses_1.isVideoAbusePredefinedReasonValid)
        .withMessage('Should have a valid predefinedReason'),
    express_validator_1.query('search')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid search'),
    express_validator_1.query('state')
        .optional()
        .custom(video_abuses_1.isVideoAbuseStateValid).withMessage('Should have a valid video abuse state'),
    express_validator_1.query('videoIs')
        .optional()
        .custom(video_abuses_1.isAbuseVideoIsValid).withMessage('Should have a valid "video is" attribute'),
    express_validator_1.query('searchReporter')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid reporter search'),
    express_validator_1.query('searchReportee')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid reportee search'),
    express_validator_1.query('searchVideo')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid video search'),
    express_validator_1.query('searchVideoChannel')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid video channel search'),
    (req, res, next) => {
        logger_1.logger.debug('Checking videoAbuseListValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.videoAbuseListValidator = videoAbuseListValidator;
