"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoCommentsFeedsValidator = exports.videoSubscriptionFeedsValidator = exports.videoFeedsValidator = exports.setFeedFormatContentType = exports.feedsFormatValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const feeds_1 = require("../../helpers/custom-validators/feeds");
const misc_1 = require("../../helpers/custom-validators/misc");
const logger_1 = require("../../helpers/logger");
const middlewares_1 = require("../../helpers/middlewares");
const videos_1 = require("../../helpers/middlewares/videos");
const utils_1 = require("./utils");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
const feedsFormatValidator = [
    express_validator_1.param('format').optional().custom(feeds_1.isValidRSSFeed).withMessage('Should have a valid format (rss, atom, json)'),
    express_validator_1.query('format').optional().custom(feeds_1.isValidRSSFeed).withMessage('Should have a valid format (rss, atom, json)')
];
exports.feedsFormatValidator = feedsFormatValidator;
function setFeedFormatContentType(req, res, next) {
    const format = req.query.format || req.params.format || 'rss';
    let acceptableContentTypes;
    if (format === 'atom' || format === 'atom1') {
        acceptableContentTypes = ['application/atom+xml', 'application/xml', 'text/xml'];
    }
    else if (format === 'json' || format === 'json1') {
        acceptableContentTypes = ['application/json'];
    }
    else if (format === 'rss' || format === 'rss2') {
        acceptableContentTypes = ['application/rss+xml', 'application/xml', 'text/xml'];
    }
    else {
        acceptableContentTypes = ['application/xml', 'text/xml'];
    }
    if (req.accepts(acceptableContentTypes)) {
        res.set('Content-Type', req.accepts(acceptableContentTypes));
    }
    else {
        return res.status(http_error_codes_1.HttpStatusCode.NOT_ACCEPTABLE_406)
            .json({
            message: `You should accept at least one of the following content-types: ${acceptableContentTypes.join(', ')}`
        });
    }
    return next();
}
exports.setFeedFormatContentType = setFeedFormatContentType;
const videoFeedsValidator = [
    express_validator_1.query('accountId')
        .optional()
        .custom(misc_1.isIdValid)
        .withMessage('Should have a valid account id'),
    express_validator_1.query('accountName')
        .optional(),
    express_validator_1.query('videoChannelId')
        .optional()
        .custom(misc_1.isIdValid)
        .withMessage('Should have a valid channel id'),
    express_validator_1.query('videoChannelName')
        .optional(),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking feeds parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (req.query.accountId && !(yield middlewares_1.doesAccountIdExist(req.query.accountId, res)))
            return;
        if (req.query.videoChannelId && !(yield middlewares_1.doesVideoChannelIdExist(req.query.videoChannelId, res)))
            return;
        if (req.query.accountName && !(yield middlewares_1.doesAccountNameWithHostExist(req.query.accountName, res)))
            return;
        if (req.query.videoChannelName && !(yield middlewares_1.doesVideoChannelNameWithHostExist(req.query.videoChannelName, res)))
            return;
        return next();
    })
];
exports.videoFeedsValidator = videoFeedsValidator;
const videoSubscriptionFeedsValidator = [
    express_validator_1.query('accountId')
        .custom(misc_1.isIdValid)
        .withMessage('Should have a valid account id'),
    express_validator_1.query('token')
        .custom(misc_1.exists)
        .withMessage('Should have a token'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking subscription feeds parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountIdExist(req.query.accountId, res)))
            return;
        if (!(yield middlewares_1.doesUserFeedTokenCorrespond(res.locals.account.userId, req.query.token, res)))
            return;
        return next();
    })
];
exports.videoSubscriptionFeedsValidator = videoSubscriptionFeedsValidator;
const videoCommentsFeedsValidator = [
    express_validator_1.query('videoId').optional().custom(misc_1.isIdOrUUIDValid),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking feeds parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (req.query.videoId && (req.query.videoChannelId || req.query.videoChannelName)) {
            return res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({
                message: 'videoId cannot be mixed with a channel filter'
            });
        }
        if (req.query.videoId && !(yield videos_1.doesVideoExist(req.query.videoId, res)))
            return;
        return next();
    })
];
exports.videoCommentsFeedsValidator = videoCommentsFeedsValidator;
