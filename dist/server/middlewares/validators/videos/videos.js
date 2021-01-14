"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videosOverviewValidator = exports.commonVideosFiltersValidator = exports.getCommonVideoEditAttributes = exports.videosAcceptChangeOwnershipValidator = exports.videosTerminateChangeOwnershipValidator = exports.videosChangeOwnershipValidator = exports.videosRemoveValidator = exports.videosCustomGetValidator = exports.checkVideoFollowConstraints = exports.videosDownloadValidator = exports.videoFileMetadataGetValidator = exports.videosGetValidator = exports.videosUpdateValidator = exports.videosAddValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const user_1 = require("@server/lib/user");
const application_1 = require("@server/models/application/application");
const misc_1 = require("../../../helpers/custom-validators/misc");
const search_1 = require("../../../helpers/custom-validators/search");
const video_ownership_1 = require("../../../helpers/custom-validators/video-ownership");
const videos_1 = require("../../../helpers/custom-validators/videos");
const express_utils_1 = require("../../../helpers/express-utils");
const ffprobe_utils_1 = require("../../../helpers/ffprobe-utils");
const logger_1 = require("../../../helpers/logger");
const middlewares_1 = require("../../../helpers/middlewares");
const video_1 = require("../../../helpers/video");
const config_1 = require("../../../initializers/config");
const constants_1 = require("../../../initializers/constants");
const moderation_1 = require("../../../lib/moderation");
const hooks_1 = require("../../../lib/plugins/hooks");
const account_1 = require("../../../models/account/account");
const video_2 = require("../../../models/video/video");
const oauth_1 = require("../../oauth");
const utils_1 = require("../utils");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const videosAddValidator = getCommonVideoEditAttributes().concat([
    express_validator_1.body('videofile')
        .custom((value, { req }) => misc_1.isFileFieldValid(req.files, 'videofile'))
        .withMessage('Should have a file'),
    express_validator_1.body('name')
        .custom(videos_1.isVideoNameValid)
        .withMessage('Should have a valid name'),
    express_validator_1.body('channelId')
        .customSanitizer(misc_1.toIntOrNull)
        .custom(misc_1.isIdValid).withMessage('Should have correct video channel id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videosAdd parameters', { parameters: req.body, files: req.files });
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (areErrorsInScheduleUpdate(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        const videoFile = req.files['videofile'][0];
        const user = res.locals.oauth.token.User;
        if (!(yield middlewares_1.doesVideoChannelOfAccountExist(req.body.channelId, user, res)))
            return express_utils_1.cleanUpReqFiles(req);
        if (!videos_1.isVideoFileMimeTypeValid(req.files)) {
            res.status(http_error_codes_1.HttpStatusCode.UNSUPPORTED_MEDIA_TYPE_415)
                .json({
                error: 'This file is not supported. Please, make sure it is of the following type: ' +
                    constants_1.CONSTRAINTS_FIELDS.VIDEOS.EXTNAME.join(', ')
            });
            return express_utils_1.cleanUpReqFiles(req);
        }
        if (!videos_1.isVideoFileSizeValid(videoFile.size.toString())) {
            res.status(http_error_codes_1.HttpStatusCode.PAYLOAD_TOO_LARGE_413)
                .json({
                error: 'This file is too large.'
            });
            return express_utils_1.cleanUpReqFiles(req);
        }
        if ((yield user_1.isAbleToUploadVideo(user.id, videoFile.size)) === false) {
            res.status(http_error_codes_1.HttpStatusCode.PAYLOAD_TOO_LARGE_413)
                .json({ error: 'The user video quota is exceeded with this video.' });
            return express_utils_1.cleanUpReqFiles(req);
        }
        let duration;
        try {
            duration = yield ffprobe_utils_1.getDurationFromVideoFile(videoFile.path);
        }
        catch (err) {
            logger_1.logger.error('Invalid input file in videosAddValidator.', { err });
            res.status(http_error_codes_1.HttpStatusCode.UNPROCESSABLE_ENTITY_422)
                .json({ error: 'Video file unreadable.' });
            return express_utils_1.cleanUpReqFiles(req);
        }
        videoFile.duration = duration;
        if (!(yield isVideoAccepted(req, res, videoFile)))
            return express_utils_1.cleanUpReqFiles(req);
        return next();
    })
]);
exports.videosAddValidator = videosAddValidator;
const videosUpdateValidator = getCommonVideoEditAttributes().concat([
    express_validator_1.param('id').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('name')
        .optional()
        .custom(videos_1.isVideoNameValid).withMessage('Should have a valid name'),
    express_validator_1.body('channelId')
        .optional()
        .customSanitizer(misc_1.toIntOrNull)
        .custom(misc_1.isIdValid).withMessage('Should have correct video channel id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videosUpdate parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (areErrorsInScheduleUpdate(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (!(yield middlewares_1.doesVideoExist(req.params.id, res)))
            return express_utils_1.cleanUpReqFiles(req);
        const user = res.locals.oauth.token.User;
        if (!middlewares_1.checkUserCanManageVideo(user, res.locals.videoAll, 16, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (req.body.channelId && !(yield middlewares_1.doesVideoChannelOfAccountExist(req.body.channelId, user, res)))
            return express_utils_1.cleanUpReqFiles(req);
        return next();
    })
]);
exports.videosUpdateValidator = videosUpdateValidator;
function checkVideoFollowConstraints(req, res, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = video_1.getVideoWithAttributes(res);
        if (video.isOwned() === true)
            return next();
        if (res.locals.oauth) {
            if (config_1.CONFIG.SEARCH.REMOTE_URI.USERS === true)
                return next();
        }
        if (config_1.CONFIG.SEARCH.REMOTE_URI.ANONYMOUS === true)
            return next();
        const serverActor = yield application_1.getServerActor();
        if ((yield video_2.VideoModel.checkVideoHasInstanceFollow(video.id, serverActor.id)) === true)
            return next();
        return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
            .json({
            errorCode: 1,
            error: 'Cannot get this video regarding follow constraints.',
            originUrl: video.url
        });
    });
}
exports.checkVideoFollowConstraints = checkVideoFollowConstraints;
const videosCustomGetValidator = (fetchType, authenticateInQuery = false) => {
    return [
        express_validator_1.param('id').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
        (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            logger_1.logger.debug('Checking videosGet parameters', { parameters: req.params });
            if (utils_1.areValidationErrors(req, res))
                return;
            if (!(yield middlewares_1.doesVideoExist(req.params.id, res, fetchType)))
                return;
            if (fetchType === 'only-immutable-attributes')
                return next();
            const video = video_1.getVideoWithAttributes(res);
            const videoAll = video;
            if (videoAll.requiresAuth()) {
                yield oauth_1.authenticatePromiseIfNeeded(req, res, authenticateInQuery);
                const user = res.locals.oauth ? res.locals.oauth.token.User : null;
                if (!user || !user.canGetVideo(videoAll)) {
                    return res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                        .json({ error: 'Cannot get this private/internal or blacklisted video.' });
                }
                return next();
            }
            if (video.privacy === 1)
                return next();
            if (video.privacy === 2) {
                if (misc_1.isUUIDValid(req.params.id))
                    return next();
                return res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404).end();
            }
        })
    ];
};
exports.videosCustomGetValidator = videosCustomGetValidator;
const videosGetValidator = videosCustomGetValidator('all');
exports.videosGetValidator = videosGetValidator;
const videosDownloadValidator = videosCustomGetValidator('all', true);
exports.videosDownloadValidator = videosDownloadValidator;
const videoFileMetadataGetValidator = getCommonVideoEditAttributes().concat([
    express_validator_1.param('id').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.param('videoFileId').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid videoFileId'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoFileMetadataGet parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoFileOfVideoExist(+req.params.videoFileId, req.params.id, res)))
            return;
        return next();
    })
]);
exports.videoFileMetadataGetValidator = videoFileMetadataGetValidator;
const videosRemoveValidator = [
    express_validator_1.param('id').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videosRemove parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.id, res)))
            return;
        if (!middlewares_1.checkUserCanManageVideo(res.locals.oauth.token.User, res.locals.videoAll, 12, res))
            return;
        return next();
    })
];
exports.videosRemoveValidator = videosRemoveValidator;
const videosChangeOwnershipValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking changeOwnership parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!middlewares_1.checkUserCanManageVideo(res.locals.oauth.token.User, res.locals.videoAll, 21, res))
            return;
        const nextOwner = yield account_1.AccountModel.loadLocalByName(req.body.username);
        if (!nextOwner) {
            res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({ error: 'Changing video ownership to a remote account is not supported yet' });
            return;
        }
        res.locals.nextOwner = nextOwner;
        return next();
    })
];
exports.videosChangeOwnershipValidator = videosChangeOwnershipValidator;
const videosTerminateChangeOwnershipValidator = [
    express_validator_1.param('id').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking changeOwnership parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield video_ownership_1.doesChangeVideoOwnershipExist(req.params.id, res)))
            return;
        if (!video_ownership_1.checkUserCanTerminateOwnershipChange(res.locals.oauth.token.User, res.locals.videoChangeOwnership, res))
            return;
        const videoChangeOwnership = res.locals.videoChangeOwnership;
        if (videoChangeOwnership.status !== "WAITING") {
            res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: 'Ownership already accepted or refused' });
            return;
        }
        return next();
    })
];
exports.videosTerminateChangeOwnershipValidator = videosTerminateChangeOwnershipValidator;
const videosAcceptChangeOwnershipValidator = [
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const body = req.body;
        if (!(yield middlewares_1.doesVideoChannelOfAccountExist(body.channelId, res.locals.oauth.token.User, res)))
            return;
        const user = res.locals.oauth.token.User;
        const videoChangeOwnership = res.locals.videoChangeOwnership;
        const isAble = yield user_1.isAbleToUploadVideo(user.id, videoChangeOwnership.Video.getMaxQualityFile().size);
        if (isAble === false) {
            res.status(http_error_codes_1.HttpStatusCode.PAYLOAD_TOO_LARGE_413)
                .json({ error: 'The user video quota is exceeded with this video.' });
            return;
        }
        return next();
    })
];
exports.videosAcceptChangeOwnershipValidator = videosAcceptChangeOwnershipValidator;
const videosOverviewValidator = [
    express_validator_1.query('page')
        .optional()
        .isInt({ min: 1, max: constants_1.OVERVIEWS.VIDEOS.SAMPLES_COUNT })
        .withMessage('Should have a valid pagination'),
    (req, res, next) => {
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.videosOverviewValidator = videosOverviewValidator;
function getCommonVideoEditAttributes() {
    return [
        express_validator_1.body('thumbnailfile')
            .custom((value, { req }) => videos_1.isVideoImage(req.files, 'thumbnailfile')).withMessage('This thumbnail file is not supported or too large. Please, make sure it is of the following type: ' +
            constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.EXTNAME.join(', ')),
        express_validator_1.body('previewfile')
            .custom((value, { req }) => videos_1.isVideoImage(req.files, 'previewfile')).withMessage('This preview file is not supported or too large. Please, make sure it is of the following type: ' +
            constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.EXTNAME.join(', ')),
        express_validator_1.body('category')
            .optional()
            .customSanitizer(misc_1.toIntOrNull)
            .custom(videos_1.isVideoCategoryValid).withMessage('Should have a valid category'),
        express_validator_1.body('licence')
            .optional()
            .customSanitizer(misc_1.toIntOrNull)
            .custom(videos_1.isVideoLicenceValid).withMessage('Should have a valid licence'),
        express_validator_1.body('language')
            .optional()
            .customSanitizer(misc_1.toValueOrNull)
            .custom(videos_1.isVideoLanguageValid).withMessage('Should have a valid language'),
        express_validator_1.body('nsfw')
            .optional()
            .customSanitizer(misc_1.toBooleanOrNull)
            .custom(misc_1.isBooleanValid).withMessage('Should have a valid NSFW attribute'),
        express_validator_1.body('waitTranscoding')
            .optional()
            .customSanitizer(misc_1.toBooleanOrNull)
            .custom(misc_1.isBooleanValid).withMessage('Should have a valid wait transcoding attribute'),
        express_validator_1.body('privacy')
            .optional()
            .customSanitizer(misc_1.toValueOrNull)
            .custom(videos_1.isVideoPrivacyValid).withMessage('Should have correct video privacy'),
        express_validator_1.body('description')
            .optional()
            .customSanitizer(misc_1.toValueOrNull)
            .custom(videos_1.isVideoDescriptionValid).withMessage('Should have a valid description'),
        express_validator_1.body('support')
            .optional()
            .customSanitizer(misc_1.toValueOrNull)
            .custom(videos_1.isVideoSupportValid).withMessage('Should have a valid support text'),
        express_validator_1.body('tags')
            .optional()
            .customSanitizer(misc_1.toValueOrNull)
            .custom(videos_1.isVideoTagsValid).withMessage('Should have correct tags'),
        express_validator_1.body('commentsEnabled')
            .optional()
            .customSanitizer(misc_1.toBooleanOrNull)
            .custom(misc_1.isBooleanValid).withMessage('Should have comments enabled boolean'),
        express_validator_1.body('downloadEnabled')
            .optional()
            .customSanitizer(misc_1.toBooleanOrNull)
            .custom(misc_1.isBooleanValid).withMessage('Should have downloading enabled boolean'),
        express_validator_1.body('originallyPublishedAt')
            .optional()
            .customSanitizer(misc_1.toValueOrNull)
            .custom(videos_1.isVideoOriginallyPublishedAtValid).withMessage('Should have a valid original publication date'),
        express_validator_1.body('scheduleUpdate')
            .optional()
            .customSanitizer(misc_1.toValueOrNull),
        express_validator_1.body('scheduleUpdate.updateAt')
            .optional()
            .custom(misc_1.isDateValid).withMessage('Should have a valid schedule update date'),
        express_validator_1.body('scheduleUpdate.privacy')
            .optional()
            .customSanitizer(misc_1.toIntOrNull)
            .custom(videos_1.isScheduleVideoUpdatePrivacyValid).withMessage('Should have correct schedule update privacy')
    ];
}
exports.getCommonVideoEditAttributes = getCommonVideoEditAttributes;
const commonVideosFiltersValidator = [
    express_validator_1.query('categoryOneOf')
        .optional()
        .customSanitizer(misc_1.toArray)
        .custom(search_1.isNumberArray).withMessage('Should have a valid one of category array'),
    express_validator_1.query('licenceOneOf')
        .optional()
        .customSanitizer(misc_1.toArray)
        .custom(search_1.isNumberArray).withMessage('Should have a valid one of licence array'),
    express_validator_1.query('languageOneOf')
        .optional()
        .customSanitizer(misc_1.toArray)
        .custom(search_1.isStringArray).withMessage('Should have a valid one of language array'),
    express_validator_1.query('tagsOneOf')
        .optional()
        .customSanitizer(misc_1.toArray)
        .custom(search_1.isStringArray).withMessage('Should have a valid one of tags array'),
    express_validator_1.query('tagsAllOf')
        .optional()
        .customSanitizer(misc_1.toArray)
        .custom(search_1.isStringArray).withMessage('Should have a valid all of tags array'),
    express_validator_1.query('nsfw')
        .optional()
        .custom(search_1.isNSFWQueryValid).withMessage('Should have a valid NSFW attribute'),
    express_validator_1.query('filter')
        .optional()
        .custom(videos_1.isVideoFilterValid).withMessage('Should have a valid filter attribute'),
    express_validator_1.query('skipCount')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull)
        .custom(misc_1.isBooleanValid).withMessage('Should have a valid skip count boolean'),
    (req, res, next) => {
        logger_1.logger.debug('Checking commons video filters query', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        const user = res.locals.oauth ? res.locals.oauth.token.User : undefined;
        if ((req.query.filter === 'all-local' || req.query.filter === 'all') &&
            (!user || user.hasRight(19) === false)) {
            res.status(http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401)
                .json({ error: 'You are not allowed to see all local videos.' });
            return;
        }
        return next();
    }
];
exports.commonVideosFiltersValidator = commonVideosFiltersValidator;
function areErrorsInScheduleUpdate(req, res) {
    if (req.body.scheduleUpdate) {
        if (!req.body.scheduleUpdate.updateAt) {
            logger_1.logger.warn('Invalid parameters: scheduleUpdate.updateAt is mandatory.');
            res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({ error: 'Schedule update at is mandatory.' });
            return true;
        }
    }
    return false;
}
function isVideoAccepted(req, res, videoFile) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const acceptParameters = {
            videoBody: req.body,
            videoFile,
            user: res.locals.oauth.token.User
        };
        const acceptedResult = yield hooks_1.Hooks.wrapFun(moderation_1.isLocalVideoAccepted, acceptParameters, 'filter:api.video.upload.accept.result');
        if (!acceptedResult || acceptedResult.accepted !== true) {
            logger_1.logger.info('Refused local video.', { acceptedResult, acceptParameters });
            res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: acceptedResult.errorMessage || 'Refused local video' });
            return false;
        }
        return true;
    });
}
