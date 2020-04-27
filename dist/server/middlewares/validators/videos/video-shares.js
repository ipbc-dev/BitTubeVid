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
const video_share_1 = require("../../../models/video/video-share");
const utils_1 = require("../utils");
const middlewares_1 = require("../../../helpers/middlewares");
const videosShareValidator = [
    express_validator_1.param('id').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.param('actorId').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid actor id'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoShare parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.id, res)))
            return;
        const video = res.locals.videoAll;
        const share = yield video_share_1.VideoShareModel.load(req.params.actorId, video.id);
        if (!share) {
            return res.status(404)
                .end();
        }
        res.locals.videoShare = share;
        return next();
    })
];
exports.videosShareValidator = videosShareValidator;
