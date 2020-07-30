"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oembedValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const path_1 = require("path");
const core_utils_1 = require("../../helpers/core-utils");
const misc_1 = require("../../helpers/custom-validators/misc");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const constants_1 = require("../../initializers/constants");
const middlewares_1 = require("../../helpers/middlewares");
const urlShouldStartWith = constants_1.WEBSERVER.SCHEME + '://' + path_1.join(constants_1.WEBSERVER.HOST, 'videos', 'watch') + '/';
const videoWatchRegex = new RegExp('([^/]+)$');
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
                .json({ error: 'Requested format is not implemented on server.' })
                .end();
        }
        const url = req.query.url;
        const startIsOk = url.startsWith(urlShouldStartWith);
        const matches = videoWatchRegex.exec(url);
        if (startIsOk === false || matches === null) {
            return res.status(400)
                .json({ error: 'Invalid url.' })
                .end();
        }
        const videoId = matches[1];
        if (misc_1.isIdOrUUIDValid(videoId) === false) {
            return res.status(400)
                .json({ error: 'Invalid video id.' })
                .end();
        }
        if (!(yield middlewares_1.doesVideoExist(videoId, res)))
            return;
        return next();
    })
];
exports.oembedValidator = oembedValidator;
