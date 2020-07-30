"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideoCaptionValidator = exports.listVideoCaptionsValidator = exports.addVideoCaptionValidator = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("../utils");
const misc_1 = require("../../../helpers/custom-validators/misc");
const express_validator_1 = require("express-validator");
const constants_1 = require("../../../initializers/constants");
const shared_1 = require("../../../../shared");
const logger_1 = require("../../../helpers/logger");
const video_captions_1 = require("../../../helpers/custom-validators/video-captions");
const express_utils_1 = require("../../../helpers/express-utils");
const middlewares_1 = require("../../../helpers/middlewares");
const addVideoCaptionValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid video id'),
    express_validator_1.param('captionLanguage').custom(video_captions_1.isVideoCaptionLanguageValid).not().isEmpty().withMessage('Should have a valid caption language'),
    express_validator_1.body('captionfile')
        .custom((_, { req }) => video_captions_1.isVideoCaptionFile(req.files, 'captionfile'))
        .withMessage('This caption file is not supported or too large. ' +
        `Please, make sure it is under ${constants_1.CONSTRAINTS_FIELDS.VIDEO_CAPTIONS.CAPTION_FILE.FILE_SIZE} and one of the following mimetypes: ` +
        Object.keys(constants_1.MIMETYPES.VIDEO_CAPTIONS.MIMETYPE_EXT).map(key => `${key} (${constants_1.MIMETYPES.VIDEO_CAPTIONS.MIMETYPE_EXT[key]})`).join(', ')),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking addVideoCaption parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return express_utils_1.cleanUpReqFiles(req);
        const user = res.locals.oauth.token.User;
        if (!middlewares_1.checkUserCanManageVideo(user, res.locals.videoAll, shared_1.UserRight.UPDATE_ANY_VIDEO, res))
            return express_utils_1.cleanUpReqFiles(req);
        return next();
    })
];
exports.addVideoCaptionValidator = addVideoCaptionValidator;
const deleteVideoCaptionValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid video id'),
    express_validator_1.param('captionLanguage').custom(video_captions_1.isVideoCaptionLanguageValid).not().isEmpty().withMessage('Should have a valid caption language'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking deleteVideoCaption parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!(yield middlewares_1.doesVideoCaptionExist(res.locals.videoAll, req.params.captionLanguage, res)))
            return;
        const user = res.locals.oauth.token.User;
        if (!middlewares_1.checkUserCanManageVideo(user, res.locals.videoAll, shared_1.UserRight.UPDATE_ANY_VIDEO, res))
            return;
        return next();
    })
];
exports.deleteVideoCaptionValidator = deleteVideoCaptionValidator;
const listVideoCaptionsValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid video id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking listVideoCaptions parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res, 'id')))
            return;
        return next();
    })
];
exports.listVideoCaptionsValidator = listVideoCaptionsValidator;
