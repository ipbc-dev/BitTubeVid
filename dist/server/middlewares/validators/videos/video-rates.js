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
const video_rates_1 = require("../../../helpers/custom-validators/video-rates");
const videos_1 = require("../../../helpers/custom-validators/videos");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../utils");
const account_video_rate_1 = require("../../../models/account/account-video-rate");
const accounts_1 = require("../../../helpers/custom-validators/accounts");
const middlewares_1 = require("../../../helpers/middlewares");
const videoUpdateRateValidator = [
    express_validator_1.param('id').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('rating').custom(videos_1.isVideoRatingTypeValid).withMessage('Should have a valid rate type'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoRate parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.id, res)))
            return;
        return next();
    })
];
exports.videoUpdateRateValidator = videoUpdateRateValidator;
const getAccountVideoRateValidatorFactory = function (rateType) {
    return [
        express_validator_1.param('name').custom(accounts_1.isAccountNameValid).withMessage('Should have a valid account name'),
        express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
        (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.debug('Checking videoCommentGetValidator parameters.', { parameters: req.params });
            if (utils_1.areValidationErrors(req, res))
                return;
            const rate = yield account_video_rate_1.AccountVideoRateModel.loadLocalAndPopulateVideo(rateType, req.params.name, req.params.videoId);
            if (!rate) {
                return res.status(404)
                    .json({ error: 'Video rate not found' })
                    .end();
            }
            res.locals.accountVideoRate = rate;
            return next();
        })
    ];
};
exports.getAccountVideoRateValidatorFactory = getAccountVideoRateValidatorFactory;
const videoRatingValidator = [
    express_validator_1.query('rating').optional().custom(video_rates_1.isRatingValid).withMessage('Value must be one of "like" or "dislike"'),
    (req, res, next) => {
        logger_1.logger.debug('Checking rating parameter', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.videoRatingValidator = videoRatingValidator;
