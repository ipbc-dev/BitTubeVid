"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customConfigUpdateValidator = void 0;
const express_validator_1 = require("express-validator");
const users_1 = require("../../helpers/custom-validators/users");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const theme_utils_1 = require("../../lib/plugins/theme-utils");
const config_1 = require("@server/initializers/config");
const customConfigUpdateValidator = [
    express_validator_1.body('instance.name').exists().withMessage('Should have a valid instance name'),
    express_validator_1.body('instance.shortDescription').exists().withMessage('Should have a valid instance short description'),
    express_validator_1.body('instance.description').exists().withMessage('Should have a valid instance description'),
    express_validator_1.body('instance.terms').exists().withMessage('Should have a valid instance terms'),
    express_validator_1.body('instance.defaultClientRoute').exists().withMessage('Should have a valid instance default client route'),
    express_validator_1.body('instance.defaultNSFWPolicy').custom(users_1.isUserNSFWPolicyValid).withMessage('Should have a valid NSFW policy'),
    express_validator_1.body('instance.customizations.css').exists().withMessage('Should have a valid instance CSS customization'),
    express_validator_1.body('instance.customizations.javascript').exists().withMessage('Should have a valid instance JavaScript customization'),
    express_validator_1.body('services.twitter.username').exists().withMessage('Should have a valid twitter username'),
    express_validator_1.body('services.twitter.whitelisted').isBoolean().withMessage('Should have a valid twitter whitelisted boolean'),
    express_validator_1.body('cache.previews.size').isInt().withMessage('Should have a valid previews cache size'),
    express_validator_1.body('cache.captions.size').isInt().withMessage('Should have a valid captions cache size'),
    express_validator_1.body('signup.enabled').isBoolean().withMessage('Should have a valid signup enabled boolean'),
    express_validator_1.body('signup.limit').isInt().withMessage('Should have a valid signup limit'),
    express_validator_1.body('signup.requiresEmailVerification').isBoolean().withMessage('Should have a valid requiresEmailVerification boolean'),
    express_validator_1.body('admin.email').isEmail().withMessage('Should have a valid administrator email'),
    express_validator_1.body('contactForm.enabled').isBoolean().withMessage('Should have a valid contact form enabled boolean'),
    express_validator_1.body('user.videoQuota').custom(users_1.isUserVideoQuotaValid).withMessage('Should have a valid video quota'),
    express_validator_1.body('user.videoQuotaDaily').custom(users_1.isUserVideoQuotaDailyValid).withMessage('Should have a valid daily video quota'),
    express_validator_1.body('transcoding.enabled').isBoolean().withMessage('Should have a valid transcoding enabled boolean'),
    express_validator_1.body('transcoding.allowAdditionalExtensions').isBoolean().withMessage('Should have a valid additional extensions boolean'),
    express_validator_1.body('transcoding.threads').isInt().withMessage('Should have a valid transcoding threads number'),
    express_validator_1.body('transcoding.resolutions.0p').isBoolean().withMessage('Should have a valid transcoding 0p resolution enabled boolean'),
    express_validator_1.body('transcoding.resolutions.240p').isBoolean().withMessage('Should have a valid transcoding 240p resolution enabled boolean'),
    express_validator_1.body('transcoding.resolutions.360p').isBoolean().withMessage('Should have a valid transcoding 360p resolution enabled boolean'),
    express_validator_1.body('transcoding.resolutions.480p').isBoolean().withMessage('Should have a valid transcoding 480p resolution enabled boolean'),
    express_validator_1.body('transcoding.resolutions.720p').isBoolean().withMessage('Should have a valid transcoding 720p resolution enabled boolean'),
    express_validator_1.body('transcoding.resolutions.1080p').isBoolean().withMessage('Should have a valid transcoding 1080p resolution enabled boolean'),
    express_validator_1.body('transcoding.webtorrent.enabled').isBoolean().withMessage('Should have a valid webtorrent transcoding enabled boolean'),
    express_validator_1.body('transcoding.hls.enabled').isBoolean().withMessage('Should have a valid hls transcoding enabled boolean'),
    express_validator_1.body('import.videos.http.enabled').isBoolean().withMessage('Should have a valid import video http enabled boolean'),
    express_validator_1.body('import.videos.torrent.enabled').isBoolean().withMessage('Should have a valid import video torrent enabled boolean'),
    express_validator_1.body('followers.instance.enabled').isBoolean().withMessage('Should have a valid followers of instance boolean'),
    express_validator_1.body('followers.instance.manualApproval').isBoolean().withMessage('Should have a valid manual approval boolean'),
    express_validator_1.body('theme.default').custom(v => plugins_1.isThemeNameValid(v) && theme_utils_1.isThemeRegistered(v)).withMessage('Should have a valid theme'),
    express_validator_1.body('premium_storage.enabled').isBoolean().withMessage('Should have a valid premium_storage enabled boolean'),
    express_validator_1.body('broadcastMessage.enabled').isBoolean().withMessage('Should have a valid broadcast message enabled boolean'),
    express_validator_1.body('broadcastMessage.message').exists().withMessage('Should have a valid broadcast message'),
    express_validator_1.body('broadcastMessage.level').exists().withMessage('Should have a valid broadcast level'),
    express_validator_1.body('broadcastMessage.dismissable').isBoolean().withMessage('Should have a valid broadcast dismissable boolean'),
    express_validator_1.body('search.remoteUri.users').isBoolean().withMessage('Should have a remote URI search for users boolean'),
    express_validator_1.body('search.remoteUri.anonymous').isBoolean().withMessage('Should have a valid remote URI search for anonymous boolean'),
    express_validator_1.body('search.searchIndex.enabled').isBoolean().withMessage('Should have a valid search index enabled boolean'),
    express_validator_1.body('search.searchIndex.url').exists().withMessage('Should have a valid search index URL'),
    express_validator_1.body('search.searchIndex.disableLocalSearch').isBoolean().withMessage('Should have a valid search index disable local search boolean'),
    express_validator_1.body('search.searchIndex.isDefaultSearch').isBoolean().withMessage('Should have a valid search index default enabled boolean'),
    (req, res, next) => {
        logger_1.logger.debug('Checking customConfigUpdateValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!checkInvalidConfigIfEmailDisabled(req.body, res))
            return;
        if (!checkInvalidTranscodingConfig(req.body, res))
            return;
        return next();
    }
];
exports.customConfigUpdateValidator = customConfigUpdateValidator;
function checkInvalidConfigIfEmailDisabled(customConfig, res) {
    if (config_1.isEmailEnabled())
        return true;
    if (customConfig.signup.requiresEmailVerification === true) {
        res.status(400)
            .send({ error: 'Emailer is disabled but you require signup email verification.' })
            .end();
        return false;
    }
    return true;
}
function checkInvalidTranscodingConfig(customConfig, res) {
    if (customConfig.transcoding.enabled === false)
        return true;
    if (customConfig.transcoding.webtorrent.enabled === false && customConfig.transcoding.hls.enabled === false) {
        res.status(400)
            .send({ error: 'You need to enable at least webtorrent transcoding or hls transcoding' })
            .end();
        return false;
    }
    return true;
}
