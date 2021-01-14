"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbuseValidator = exports.abuseListForUserValidator = exports.deleteAbuseMessageValidator = exports.abuseUpdateValidator = exports.checkAbuseValidForMessagesValidator = exports.addAbuseMessageValidator = exports.abuseGetValidator = exports.abuseReportValidator = exports.abuseListForAdminsValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const abuses_1 = require("@server/helpers/custom-validators/abuses");
const misc_1 = require("@server/helpers/custom-validators/misc");
const video_comments_1 = require("@server/helpers/custom-validators/video-comments");
const logger_1 = require("@server/helpers/logger");
const middlewares_1 = require("@server/helpers/middlewares");
const abuse_message_1 = require("@server/models/abuse/abuse-message");
const utils_1 = require("./utils");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
const abuseReportValidator = [
    express_validator_1.body('account.id')
        .optional()
        .custom(misc_1.isIdValid)
        .withMessage('Should have a valid accountId'),
    express_validator_1.body('video.id')
        .optional()
        .custom(misc_1.isIdOrUUIDValid)
        .withMessage('Should have a valid videoId'),
    express_validator_1.body('video.startAt')
        .optional()
        .customSanitizer(misc_1.toIntOrNull)
        .custom(abuses_1.isAbuseTimestampValid)
        .withMessage('Should have valid starting time value'),
    express_validator_1.body('video.endAt')
        .optional()
        .customSanitizer(misc_1.toIntOrNull)
        .custom(abuses_1.isAbuseTimestampValid)
        .withMessage('Should have valid ending time value')
        .bail()
        .custom(abuses_1.isAbuseTimestampCoherent)
        .withMessage('Should have a startAt timestamp beginning before endAt'),
    express_validator_1.body('comment.id')
        .optional()
        .custom(misc_1.isIdValid)
        .withMessage('Should have a valid commentId'),
    express_validator_1.body('reason')
        .custom(abuses_1.isAbuseReasonValid)
        .withMessage('Should have a valid reason'),
    express_validator_1.body('predefinedReasons')
        .optional()
        .custom(abuses_1.areAbusePredefinedReasonsValid)
        .withMessage('Should have a valid list of predefined reasons'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        logger_1.logger.debug('Checking abuseReport parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const body = req.body;
        if (((_a = body.video) === null || _a === void 0 ? void 0 : _a.id) && !(yield middlewares_1.doesVideoExist(body.video.id, res)))
            return;
        if (((_b = body.account) === null || _b === void 0 ? void 0 : _b.id) && !(yield middlewares_1.doesAccountIdExist(body.account.id, res)))
            return;
        if (((_c = body.comment) === null || _c === void 0 ? void 0 : _c.id) && !(yield video_comments_1.doesCommentIdExist(body.comment.id, res)))
            return;
        if (!((_d = body.video) === null || _d === void 0 ? void 0 : _d.id) && !((_e = body.account) === null || _e === void 0 ? void 0 : _e.id) && !((_f = body.comment) === null || _f === void 0 ? void 0 : _f.id)) {
            res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({ error: 'video id or account id or comment id is required.' });
            return;
        }
        return next();
    })
];
exports.abuseReportValidator = abuseReportValidator;
const abuseGetValidator = [
    express_validator_1.param('id').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking abuseGetValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAbuseExist(req.params.id, res)))
            return;
        return next();
    })
];
exports.abuseGetValidator = abuseGetValidator;
const abuseUpdateValidator = [
    express_validator_1.param('id').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('state')
        .optional()
        .custom(abuses_1.isAbuseStateValid).withMessage('Should have a valid abuse state'),
    express_validator_1.body('moderationComment')
        .optional()
        .custom(abuses_1.isAbuseModerationCommentValid).withMessage('Should have a valid moderation comment'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking abuseUpdateValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAbuseExist(req.params.id, res)))
            return;
        return next();
    })
];
exports.abuseUpdateValidator = abuseUpdateValidator;
const abuseListForAdminsValidator = [
    express_validator_1.query('id')
        .optional()
        .custom(misc_1.isIdValid).withMessage('Should have a valid id'),
    express_validator_1.query('filter')
        .optional()
        .custom(abuses_1.isAbuseFilterValid)
        .withMessage('Should have a valid filter'),
    express_validator_1.query('predefinedReason')
        .optional()
        .custom(abuses_1.isAbusePredefinedReasonValid)
        .withMessage('Should have a valid predefinedReason'),
    express_validator_1.query('search')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid search'),
    express_validator_1.query('state')
        .optional()
        .custom(abuses_1.isAbuseStateValid).withMessage('Should have a valid abuse state'),
    express_validator_1.query('videoIs')
        .optional()
        .custom(abuses_1.isAbuseVideoIsValid).withMessage('Should have a valid "video is" attribute'),
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
        logger_1.logger.debug('Checking abuseListForAdminsValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.abuseListForAdminsValidator = abuseListForAdminsValidator;
const abuseListForUserValidator = [
    express_validator_1.query('id')
        .optional()
        .custom(misc_1.isIdValid).withMessage('Should have a valid id'),
    express_validator_1.query('search')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid search'),
    express_validator_1.query('state')
        .optional()
        .custom(abuses_1.isAbuseStateValid).withMessage('Should have a valid abuse state'),
    (req, res, next) => {
        logger_1.logger.debug('Checking abuseListForUserValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.abuseListForUserValidator = abuseListForUserValidator;
const getAbuseValidator = [
    express_validator_1.param('id').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking getAbuseValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAbuseExist(req.params.id, res)))
            return;
        const user = res.locals.oauth.token.user;
        const abuse = res.locals.abuse;
        if (user.hasRight(6) !== true && abuse.reporterAccountId !== user.Account.id) {
            const message = `User ${user.username} does not have right to get abuse ${abuse.id}`;
            logger_1.logger.warn(message);
            return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: message });
        }
        return next();
    })
];
exports.getAbuseValidator = getAbuseValidator;
const checkAbuseValidForMessagesValidator = [
    (req, res, next) => {
        logger_1.logger.debug('Checking checkAbuseValidForMessagesValidator parameters', { parameters: req.body });
        const abuse = res.locals.abuse;
        if (abuse.ReporterAccount.isOwned() === false) {
            return res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({
                error: 'This abuse was created by a user of your instance.'
            });
        }
        return next();
    }
];
exports.checkAbuseValidForMessagesValidator = checkAbuseValidForMessagesValidator;
const addAbuseMessageValidator = [
    express_validator_1.body('message').custom(abuses_1.isAbuseMessageValid).not().isEmpty().withMessage('Should have a valid abuse message'),
    (req, res, next) => {
        logger_1.logger.debug('Checking addAbuseMessageValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.addAbuseMessageValidator = addAbuseMessageValidator;
const deleteAbuseMessageValidator = [
    express_validator_1.param('messageId').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid message id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking deleteAbuseMessageValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const user = res.locals.oauth.token.user;
        const abuse = res.locals.abuse;
        const messageId = parseInt(req.params.messageId + '', 10);
        const abuseMessage = yield abuse_message_1.AbuseMessageModel.loadByIdAndAbuseId(messageId, abuse.id);
        if (!abuseMessage) {
            return res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404)
                .json({ error: 'Abuse message not found' });
        }
        if (user.hasRight(6) !== true && abuseMessage.accountId !== user.Account.id) {
            return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: 'Cannot delete this abuse message' });
        }
        res.locals.abuseMessage = abuseMessage;
        return next();
    })
];
exports.deleteAbuseMessageValidator = deleteAbuseMessageValidator;
