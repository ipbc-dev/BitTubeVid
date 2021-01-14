"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkActivityPubUrls = exports.applicationExist = exports.usersExist = exports.clientsExist = exports.checkConfig = void 0;
const tslib_1 = require("tslib");
const config = require("config");
const core_utils_1 = require("../helpers/core-utils");
const user_1 = require("../models/account/user");
const application_1 = require("../models/application/application");
const oauth_client_1 = require("../models/oauth/oauth-client");
const url_1 = require("url");
const config_1 = require("./config");
const logger_1 = require("../helpers/logger");
const misc_1 = require("../helpers/custom-validators/misc");
const lodash_1 = require("lodash");
const constants_1 = require("./constants");
function checkActivityPubUrls() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const actor = yield application_1.getServerActor();
        const parsed = new url_1.URL(actor.url);
        if (constants_1.WEBSERVER.HOST !== parsed.host) {
            const NODE_ENV = config.util.getEnv('NODE_ENV');
            const NODE_CONFIG_DIR = config.util.getEnv('NODE_CONFIG_DIR');
            logger_1.logger.warn('It seems BitTube was started (and created some data) with another domain name. ' +
                'This means you will not be able to federate! ' +
                'Please use %s %s npm run update-host to fix this.', NODE_CONFIG_DIR ? `NODE_CONFIG_DIR=${NODE_CONFIG_DIR}` : '', NODE_ENV ? `NODE_ENV=${NODE_ENV}` : '');
        }
    });
}
exports.checkActivityPubUrls = checkActivityPubUrls;
function checkConfig() {
    if (config.has('services.csp-logger')) {
        logger_1.logger.warn('services.csp-logger configuration has been renamed to csp.report_uri. Please update your configuration file.');
    }
    if (!config_1.isEmailEnabled()) {
        if (config_1.CONFIG.SIGNUP.ENABLED && config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION) {
            return 'Emailer is disabled but you require signup email verification.';
        }
        if (config_1.CONFIG.CONTACT_FORM.ENABLED) {
            logger_1.logger.warn('Emailer is disabled so the contact form will not work.');
        }
    }
    const defaultNSFWPolicy = config_1.CONFIG.INSTANCE.DEFAULT_NSFW_POLICY;
    {
        const available = ['do_not_list', 'blur', 'display'];
        if (available.includes(defaultNSFWPolicy) === false) {
            return 'NSFW policy setting should be ' + available.join(' or ') + ' instead of ' + defaultNSFWPolicy;
        }
    }
    const redundancyVideos = config_1.CONFIG.REDUNDANCY.VIDEOS.STRATEGIES;
    if (misc_1.isArray(redundancyVideos)) {
        const available = ['most-views', 'trending', 'recently-added'];
        for (const r of redundancyVideos) {
            if (available.includes(r.strategy) === false) {
                return 'Videos redundancy should have ' + available.join(' or ') + ' strategy instead of ' + r.strategy;
            }
            if (!core_utils_1.isTestInstance() && r.minLifetime < 1000 * 3600 * 10) {
                return 'Video redundancy minimum lifetime should be >= 10 hours for strategy ' + r.strategy;
            }
        }
        const filtered = lodash_1.uniq(redundancyVideos.map(r => r.strategy));
        if (filtered.length !== redundancyVideos.length) {
            return 'Redundancy video entries should have unique strategies';
        }
        const recentlyAddedStrategy = redundancyVideos.find(r => r.strategy === 'recently-added');
        if (recentlyAddedStrategy && isNaN(recentlyAddedStrategy.minViews)) {
            return 'Min views in recently added strategy is not a number';
        }
    }
    else {
        return 'Videos redundancy should be an array (you must uncomment lines containing - too)';
    }
    const acceptFrom = config_1.CONFIG.REMOTE_REDUNDANCY.VIDEOS.ACCEPT_FROM;
    const acceptFromValues = new Set(['nobody', 'anybody', 'followings']);
    if (acceptFromValues.has(acceptFrom) === false) {
        return 'remote_redundancy.videos.accept_from has an incorrect value';
    }
    if (core_utils_1.isProdInstance()) {
        const configStorage = config.get('storage');
        for (const key of Object.keys(configStorage)) {
            if (configStorage[key].startsWith('storage/')) {
                logger_1.logger.warn('Directory of %s should not be in the production directory of BitTube. Please check your production configuration file.', key);
            }
        }
    }
    if (config_1.CONFIG.STORAGE.VIDEOS_DIR === config_1.CONFIG.STORAGE.REDUNDANCY_DIR) {
        logger_1.logger.warn('Redundancy directory should be different than the videos folder.');
    }
    if (config_1.CONFIG.TRANSCODING.ENABLED) {
        if (config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED === false && config_1.CONFIG.TRANSCODING.HLS.ENABLED === false) {
            return 'You need to enable at least WebTorrent transcoding or HLS transcoding.';
        }
    }
    if (config_1.CONFIG.BROADCAST_MESSAGE.ENABLED) {
        const currentLevel = config_1.CONFIG.BROADCAST_MESSAGE.LEVEL;
        const available = ['info', 'warning', 'error'];
        if (available.includes(currentLevel) === false) {
            return 'Broadcast message level should be ' + available.join(' or ') + ' instead of ' + currentLevel;
        }
    }
    if (config_1.CONFIG.SEARCH.SEARCH_INDEX.ENABLED === true) {
        if (config_1.CONFIG.SEARCH.REMOTE_URI.USERS === false) {
            return 'You cannot enable search index without enabling remote URI search for users.';
        }
    }
    if (config_1.CONFIG.LIVE.ENABLED === true) {
        if (config_1.CONFIG.LIVE.ALLOW_REPLAY === true && config_1.CONFIG.TRANSCODING.ENABLED === false) {
            return 'Live allow replay cannot be enabled if transcoding is not enabled.';
        }
    }
    return null;
}
exports.checkConfig = checkConfig;
function clientsExist() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const totalClients = yield oauth_client_1.OAuthClientModel.countTotal();
        return totalClients !== 0;
    });
}
exports.clientsExist = clientsExist;
function usersExist() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const totalUsers = yield user_1.UserModel.countTotal();
        return totalUsers !== 0;
    });
}
exports.usersExist = usersExist;
function applicationExist() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const totalApplication = yield application_1.ApplicationModel.countTotal();
        return totalApplication !== 0;
    });
}
exports.applicationExist = applicationExist;
