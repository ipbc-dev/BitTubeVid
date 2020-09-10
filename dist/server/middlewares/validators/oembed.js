"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oembedValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const path_1 = require("path");
const video_1 = require("@server/helpers/video");
const video_playlist_1 = require("@server/models/video/video-playlist");
const core_utils_1 = require("../../helpers/core-utils");
const misc_1 = require("../../helpers/custom-validators/misc");
const logger_1 = require("../../helpers/logger");
const constants_1 = require("../../initializers/constants");
const utils_1 = require("./utils");
const startVideoPlaylistsURL = constants_1.WEBSERVER.SCHEME + '://' + path_1.join(constants_1.WEBSERVER.HOST, 'videos', 'watch', 'playlist') + '/';
const startVideosURL = constants_1.WEBSERVER.SCHEME + '://' + path_1.join(constants_1.WEBSERVER.HOST, 'videos', 'watch') + '/';
const watchRegex = new RegExp('([^/]+)$');
const isURLOptions = {
    require_host: true,
    require_tld: true
};
if (core_utils_1.isTestInstance()) {
    isURLOptions.require_tld = false;
}
const oembedValidator = [
    express_validator_1.query('url').isURL(isURLOptions).withMessage('Should have a valid url'),
    express_validator_1.query('maxwidth').optional().isInt().withMessage('Should have a valid max width'),
    express_validator_1.query('maxheight').optional().isInt().withMessage('Should have a valid max height'),
    express_validator_1.query('format').optional().isIn(['xml', 'json']).withMessage('Should have a valid format'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking oembed parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (req.query.format !== undefined && req.query.format !== 'json') {
            return res.status(501)
                .json({ error: 'Requested format is not implemented on server.' });
        }
        const url = req.query.url;
        const isPlaylist = url.startsWith(startVideoPlaylistsURL);
        const isVideo = isPlaylist ? false : url.startsWith(startVideosURL);
        const startIsOk = isVideo || isPlaylist;
        const matches = watchRegex.exec(url);
        if (startIsOk === false || matches === null) {
            return res.status(400)
                .json({ error: 'Invalid url.' });
        }
        const elementId = matches[1];
        if (misc_1.isIdOrUUIDValid(elementId) === false) {
            return res.status(400)
                .json({ error: 'Invalid video or playlist id.' });
        }
        if (isVideo) {
            const video = yield video_1.fetchVideo(elementId, 'all');
            if (!video) {
                return res.status(404)
                    .json({ error: 'Video not found' });
            }
            if (video.privacy !== 1) {
                return res.status(403)
                    .json({ error: 'Video is not public' });
            }
            res.locals.videoAll = video;
            return next();
        }
        const videoPlaylist = yield video_playlist_1.VideoPlaylistModel.loadWithAccountAndChannelSummary(elementId, undefined);
        if (!videoPlaylist) {
            return res.status(404)
                .json({ error: 'Video playlist not found' });
        }
        if (videoPlaylist.privacy !== 1) {
            return res.status(403)
                .json({ error: 'Playlist is not public' });
        }
        res.locals.videoPlaylistSummary = videoPlaylist;
        return next();
    })
];
exports.oembedValidator = oembedValidator;
