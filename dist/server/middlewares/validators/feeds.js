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
const misc_1 = require("../../helpers/custom-validators/misc");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const feeds_1 = require("../../helpers/custom-validators/feeds");
const videos_1 = require("../../helpers/middlewares/videos");
const middlewares_1 = require("../../helpers/middlewares");
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
        return res.status(406).send({
            message: `You should accept at least one of the following content-types: ${acceptableContentTypes.join(', ')}`
        }).end();
    }
    return next();
}
exports.setFeedFormatContentType = setFeedFormatContentType;
const videoFeedsValidator = [
    express_validator_1.query('accountId').optional().custom(misc_1.isIdValid),
    express_validator_1.query('accountName').optional(),
    express_validator_1.query('videoChannelId').optional().custom(misc_1.isIdValid),
    express_validator_1.query('videoChannelName').optional(),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
const videoCommentsFeedsValidator = [
    express_validator_1.query('videoId').optional().custom(misc_1.isIdOrUUIDValid),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking feeds parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (req.query.videoId && !(yield videos_1.doesVideoExist(req.query.videoId, res)))
            return;
        return next();
    })
];
exports.videoCommentsFeedsValidator = videoCommentsFeedsValidator;
