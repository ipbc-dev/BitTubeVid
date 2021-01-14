"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoImportAddValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const moderation_1 = require("@server/lib/moderation");
const hooks_1 = require("@server/lib/plugins/hooks");
const misc_1 = require("../../../helpers/custom-validators/misc");
const video_imports_1 = require("../../../helpers/custom-validators/video-imports");
const videos_1 = require("../../../helpers/custom-validators/videos");
const express_utils_1 = require("../../../helpers/express-utils");
const logger_1 = require("../../../helpers/logger");
const middlewares_1 = require("../../../helpers/middlewares");
const config_1 = require("../../../initializers/config");
const constants_1 = require("../../../initializers/constants");
const utils_1 = require("../utils");
const videos_2 = require("./videos");
const http_error_codes_1 = require("@shared/core-utils/miscs/http-error-codes");
const videoImportAddValidator = videos_2.getCommonVideoEditAttributes().concat([
    express_validator_1.body('channelId')
        .customSanitizer(misc_1.toIntOrNull)
        .custom(misc_1.isIdValid).withMessage('Should have correct video channel id'),
    express_validator_1.body('targetUrl')
        .optional()
        .custom(video_imports_1.isVideoImportTargetUrlValid).withMessage('Should have a valid video import target URL'),
    express_validator_1.body('magnetUri')
        .optional()
        .custom(videos_1.isVideoMagnetUriValid).withMessage('Should have a valid video magnet URI'),
    express_validator_1.body('torrentfile')
        .custom((value, { req }) => video_imports_1.isVideoImportTorrentFile(req.files))
        .withMessage('This torrent file is not supported or too large. Please, make sure it is of the following type: ' +
        constants_1.CONSTRAINTS_FIELDS.VIDEO_IMPORTS.TORRENT_FILE.EXTNAME.join(', ')),
    express_validator_1.body('name')
        .optional()
        .custom(videos_1.isVideoNameValid).withMessage('Should have a valid name'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        var _a;
        logger_1.logger.debug('Checking videoImportAddValidator parameters', { parameters: req.body });
        const user = res.locals.oauth.token.User;
        const torrentFile = ((_a = req.files) === null || _a === void 0 ? void 0 : _a['torrentfile']) ? req.files['torrentfile'][0] : undefined;
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        if (req.body.targetUrl && config_1.CONFIG.IMPORT.VIDEOS.HTTP.ENABLED !== true) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(http_error_codes_1.HttpStatusCode.CONFLICT_409)
                .json({ error: 'HTTP import is not enabled on this instance.' })
                .end();
        }
        if (config_1.CONFIG.IMPORT.VIDEOS.TORRENT.ENABLED !== true && (req.body.magnetUri || torrentFile)) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(http_error_codes_1.HttpStatusCode.CONFLICT_409)
                .json({ error: 'Torrent/magnet URI import is not enabled on this instance.' })
                .end();
        }
        if (!(yield middlewares_1.doesVideoChannelOfAccountExist(req.body.channelId, user, res)))
            return express_utils_1.cleanUpReqFiles(req);
        if (!req.body.targetUrl && !req.body.magnetUri && !torrentFile) {
            express_utils_1.cleanUpReqFiles(req);
            return res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({ error: 'Should have a magnetUri or a targetUrl or a torrent file.' })
                .end();
        }
        if (!(yield isImportAccepted(req, res)))
            return express_utils_1.cleanUpReqFiles(req);
        return next();
    })
]);
exports.videoImportAddValidator = videoImportAddValidator;
function isImportAccepted(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const hookName = body.targetUrl
            ? 'filter:api.video.pre-import-url.accept.result'
            : 'filter:api.video.pre-import-torrent.accept.result';
        const acceptParameters = {
            videoImportBody: body,
            user: res.locals.oauth.token.User
        };
        const acceptedResult = yield hooks_1.Hooks.wrapFun(moderation_1.isPreImportVideoAccepted, acceptParameters, hookName);
        if (!acceptedResult || acceptedResult.accepted !== true) {
            logger_1.logger.info('Refused to import video.', { acceptedResult, acceptParameters });
            res.status(http_error_codes_1.HttpStatusCode.FORBIDDEN_403)
                .json({ error: acceptedResult.errorMessage || 'Refused to import video' });
            return false;
        }
        return true;
    });
}
