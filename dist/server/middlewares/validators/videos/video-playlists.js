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
const shared_1 = require("../../../../shared");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../utils");
const videos_1 = require("../../../helpers/custom-validators/videos");
const constants_1 = require("../../../initializers/constants");
const misc_1 = require("../../../helpers/custom-validators/misc");
const video_playlists_1 = require("../../../helpers/custom-validators/video-playlists");
const express_utils_1 = require("../../../helpers/express-utils");
const video_playlist_element_1 = require("../../../models/video/video-playlist-element");
const oauth_1 = require("../../oauth");
const video_playlist_privacy_model_1 = require("../../../../shared/models/videos/playlist/video-playlist-privacy.model");
const video_playlist_type_model_1 = require("../../../../shared/models/videos/playlist/video-playlist-type.model");
const middlewares_1 = require("../../../helpers/middlewares");
const videoPlaylistsAddValidator = getCommonPlaylistEditAttributes().concat([
    express_validator_1.body('displayName')
        .custom(video_playlists_1.isVideoPlaylistNameValid).withMessage('Should have a valid display name'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistsAddValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        const body = req.body;
        if (body.videoChannelId && !(yield middlewares_1.doesVideoChannelIdExist(body.videoChannelId, res)))
            return express_utils_1.cleanUpReqFiles(req);
        if (body.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC && !body.videoChannelId) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(400)
                .json({ error: 'Cannot set "public" a playlist that is not assigned to a channel.' });
        }
        return next();
    })
]);
exports.videoPlaylistsAddValidator = videoPlaylistsAddValidator;
const videoPlaylistsUpdateValidator = getCommonPlaylistEditAttributes().concat([
    express_validator_1.param('playlistId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid playlist id/uuid'),
    express_validator_1.body('displayName')
        .optional()
        .custom(video_playlists_1.isVideoPlaylistNameValid).withMessage('Should have a valid display name'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistsUpdateValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (!(yield middlewares_1.doesVideoPlaylistExist(req.params.playlistId, res, 'all')))
            return express_utils_1.cleanUpReqFiles(req);
        const videoPlaylist = getPlaylist(res);
        if (!checkUserCanManageVideoPlaylist(res.locals.oauth.token.User, videoPlaylist, shared_1.UserRight.REMOVE_ANY_VIDEO_PLAYLIST, res)) {
            return express_utils_1.cleanUpReqFiles(req);
        }
        const body = req.body;
        const newPrivacy = body.privacy || videoPlaylist.privacy;
        if (newPrivacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC &&
            ((!videoPlaylist.videoChannelId && !body.videoChannelId) ||
                body.videoChannelId === null)) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(400)
                .json({ error: 'Cannot set "public" a playlist that is not assigned to a channel.' });
        }
        if (videoPlaylist.type === video_playlist_type_model_1.VideoPlaylistType.WATCH_LATER) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(400)
                .json({ error: 'Cannot update a watch later playlist.' });
        }
        if (body.videoChannelId && !(yield middlewares_1.doesVideoChannelIdExist(body.videoChannelId, res)))
            return express_utils_1.cleanUpReqFiles(req);
        return next();
    })
]);
exports.videoPlaylistsUpdateValidator = videoPlaylistsUpdateValidator;
const videoPlaylistsDeleteValidator = [
    express_validator_1.param('playlistId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid playlist id/uuid'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistsDeleteValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoPlaylistExist(req.params.playlistId, res)))
            return;
        const videoPlaylist = getPlaylist(res);
        if (videoPlaylist.type === video_playlist_type_model_1.VideoPlaylistType.WATCH_LATER) {
            return res.status(400)
                .json({ error: 'Cannot delete a watch later playlist.' });
        }
        if (!checkUserCanManageVideoPlaylist(res.locals.oauth.token.User, videoPlaylist, shared_1.UserRight.REMOVE_ANY_VIDEO_PLAYLIST, res)) {
            return;
        }
        return next();
    })
];
exports.videoPlaylistsDeleteValidator = videoPlaylistsDeleteValidator;
const videoPlaylistsGetValidator = (fetchType) => {
    return [
        express_validator_1.param('playlistId')
            .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid playlist id/uuid'),
        (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.logger.debug('Checking videoPlaylistsGetValidator parameters', { parameters: req.params });
            if (utils_1.areValidationErrors(req, res))
                return;
            if (!(yield middlewares_1.doesVideoPlaylistExist(req.params.playlistId, res, fetchType)))
                return;
            const videoPlaylist = res.locals.videoPlaylistFull || res.locals.videoPlaylistSummary;
            if (videoPlaylist.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.UNLISTED) {
                if (misc_1.isUUIDValid(req.params.playlistId))
                    return next();
                return res.status(404).end();
            }
            if (videoPlaylist.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE) {
                yield oauth_1.authenticatePromiseIfNeeded(req, res);
                const user = res.locals.oauth ? res.locals.oauth.token.User : null;
                if (!user ||
                    (videoPlaylist.OwnerAccount.id !== user.Account.id && !user.hasRight(shared_1.UserRight.UPDATE_ANY_VIDEO_PLAYLIST))) {
                    return res.status(403)
                        .json({ error: 'Cannot get this private video playlist.' });
                }
                return next();
            }
            return next();
        })
    ];
};
exports.videoPlaylistsGetValidator = videoPlaylistsGetValidator;
const videoPlaylistsSearchValidator = [
    express_validator_1.query('search').optional().not().isEmpty().withMessage('Should have a valid search'),
    (req, res, next) => {
        logger_1.logger.debug('Checking videoPlaylists search query', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.videoPlaylistsSearchValidator = videoPlaylistsSearchValidator;
const videoPlaylistsAddVideoValidator = [
    express_validator_1.param('playlistId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid playlist id/uuid'),
    express_validator_1.body('videoId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid video id/uuid'),
    express_validator_1.body('startTimestamp')
        .optional()
        .custom(video_playlists_1.isVideoPlaylistTimestampValid).withMessage('Should have a valid start timestamp'),
    express_validator_1.body('stopTimestamp')
        .optional()
        .custom(video_playlists_1.isVideoPlaylistTimestampValid).withMessage('Should have a valid stop timestamp'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistsAddVideoValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoPlaylistExist(req.params.playlistId, res, 'all')))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.body.videoId, res, 'only-video')))
            return;
        const videoPlaylist = getPlaylist(res);
        const video = res.locals.onlyVideo;
        const videoPlaylistElement = yield video_playlist_element_1.VideoPlaylistElementModel.loadByPlaylistAndVideo(videoPlaylist.id, video.id);
        if (videoPlaylistElement) {
            res.status(409)
                .json({ error: 'This video in this playlist already exists' })
                .end();
            return;
        }
        if (!checkUserCanManageVideoPlaylist(res.locals.oauth.token.User, videoPlaylist, shared_1.UserRight.UPDATE_ANY_VIDEO_PLAYLIST, res)) {
            return;
        }
        return next();
    })
];
exports.videoPlaylistsAddVideoValidator = videoPlaylistsAddVideoValidator;
const videoPlaylistsUpdateOrRemoveVideoValidator = [
    express_validator_1.param('playlistId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid playlist id/uuid'),
    express_validator_1.param('playlistElementId')
        .custom(misc_1.isIdValid).withMessage('Should have an element id/uuid'),
    express_validator_1.body('startTimestamp')
        .optional()
        .custom(video_playlists_1.isVideoPlaylistTimestampValid).withMessage('Should have a valid start timestamp'),
    express_validator_1.body('stopTimestamp')
        .optional()
        .custom(video_playlists_1.isVideoPlaylistTimestampValid).withMessage('Should have a valid stop timestamp'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistsRemoveVideoValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoPlaylistExist(req.params.playlistId, res, 'all')))
            return;
        const videoPlaylist = getPlaylist(res);
        const videoPlaylistElement = yield video_playlist_element_1.VideoPlaylistElementModel.loadById(req.params.playlistElementId);
        if (!videoPlaylistElement) {
            res.status(404)
                .json({ error: 'Video playlist element not found' })
                .end();
            return;
        }
        res.locals.videoPlaylistElement = videoPlaylistElement;
        if (!checkUserCanManageVideoPlaylist(res.locals.oauth.token.User, videoPlaylist, shared_1.UserRight.UPDATE_ANY_VIDEO_PLAYLIST, res))
            return;
        return next();
    })
];
exports.videoPlaylistsUpdateOrRemoveVideoValidator = videoPlaylistsUpdateOrRemoveVideoValidator;
const videoPlaylistElementAPGetValidator = [
    express_validator_1.param('playlistId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid playlist id/uuid'),
    express_validator_1.param('videoId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have an video id/uuid'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistElementAPGetValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const videoPlaylistElement = yield video_playlist_element_1.VideoPlaylistElementModel.loadByPlaylistAndVideoForAP(req.params.playlistId, req.params.videoId);
        if (!videoPlaylistElement) {
            res.status(404)
                .json({ error: 'Video playlist element not found' })
                .end();
            return;
        }
        if (videoPlaylistElement.VideoPlaylist.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE) {
            return res.status(403).end();
        }
        res.locals.videoPlaylistElementAP = videoPlaylistElement;
        return next();
    })
];
exports.videoPlaylistElementAPGetValidator = videoPlaylistElementAPGetValidator;
const videoPlaylistsReorderVideosValidator = [
    express_validator_1.param('playlistId')
        .custom(misc_1.isIdOrUUIDValid).withMessage('Should have a valid playlist id/uuid'),
    express_validator_1.body('startPosition')
        .isInt({ min: 1 }).withMessage('Should have a valid start position'),
    express_validator_1.body('insertAfterPosition')
        .isInt({ min: 0 }).withMessage('Should have a valid insert after position'),
    express_validator_1.body('reorderLength')
        .optional()
        .isInt({ min: 1 }).withMessage('Should have a valid range length'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoPlaylistsReorderVideosValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoPlaylistExist(req.params.playlistId, res, 'all')))
            return;
        const videoPlaylist = getPlaylist(res);
        if (!checkUserCanManageVideoPlaylist(res.locals.oauth.token.User, videoPlaylist, shared_1.UserRight.UPDATE_ANY_VIDEO_PLAYLIST, res))
            return;
        const nextPosition = yield video_playlist_element_1.VideoPlaylistElementModel.getNextPositionOf(videoPlaylist.id);
        const startPosition = req.body.startPosition;
        const insertAfterPosition = req.body.insertAfterPosition;
        const reorderLength = req.body.reorderLength;
        if (startPosition >= nextPosition || insertAfterPosition >= nextPosition) {
            res.status(400)
                .json({ error: `Start position or insert after position exceed the playlist limits (max: ${nextPosition - 1})` })
                .end();
            return;
        }
        if (reorderLength && reorderLength + startPosition > nextPosition) {
            res.status(400)
                .json({ error: `Reorder length with this start position exceeds the playlist limits (max: ${nextPosition - startPosition})` })
                .end();
            return;
        }
        return next();
    })
];
exports.videoPlaylistsReorderVideosValidator = videoPlaylistsReorderVideosValidator;
const commonVideoPlaylistFiltersValidator = [
    express_validator_1.query('playlistType')
        .optional()
        .custom(video_playlists_1.isVideoPlaylistTypeValid).withMessage('Should have a valid playlist type'),
    (req, res, next) => {
        logger_1.logger.debug('Checking commonVideoPlaylistFiltersValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.commonVideoPlaylistFiltersValidator = commonVideoPlaylistFiltersValidator;
const doVideosInPlaylistExistValidator = [
    express_validator_1.query('videoIds')
        .customSanitizer(misc_1.toIntArray)
        .custom(v => misc_1.isArrayOf(v, misc_1.isIdValid)).withMessage('Should have a valid video ids array'),
    (req, res, next) => {
        logger_1.logger.debug('Checking areVideosInPlaylistExistValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.doVideosInPlaylistExistValidator = doVideosInPlaylistExistValidator;
function getCommonPlaylistEditAttributes() {
    return [
        express_validator_1.body('thumbnailfile')
            .custom((value, { req }) => videos_1.isVideoImage(req.files, 'thumbnailfile')).withMessage('This thumbnail file is not supported or too large. Please, make sure it is of the following type: '
            + constants_1.CONSTRAINTS_FIELDS.VIDEO_PLAYLISTS.IMAGE.EXTNAME.join(', ')),
        express_validator_1.body('description')
            .optional()
            .customSanitizer(misc_1.toValueOrNull)
            .custom(video_playlists_1.isVideoPlaylistDescriptionValid).withMessage('Should have a valid description'),
        express_validator_1.body('privacy')
            .optional()
            .customSanitizer(misc_1.toIntOrNull)
            .custom(video_playlists_1.isVideoPlaylistPrivacyValid).withMessage('Should have correct playlist privacy'),
        express_validator_1.body('videoChannelId')
            .optional()
            .customSanitizer(misc_1.toIntOrNull)
    ];
}
function checkUserCanManageVideoPlaylist(user, videoPlaylist, right, res) {
    if (videoPlaylist.isOwned() === false) {
        res.status(403)
            .json({ error: 'Cannot manage video playlist of another server.' })
            .end();
        return false;
    }
    if (user.hasRight(right) === false && videoPlaylist.ownerAccountId !== user.Account.id) {
        res.status(403)
            .json({ error: 'Cannot manage video playlist of another user' })
            .end();
        return false;
    }
    return true;
}
function getPlaylist(res) {
    return res.locals.videoPlaylistFull || res.locals.videoPlaylistSummary;
}
