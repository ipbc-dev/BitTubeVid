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
const config = require("config");
const core_utils_1 = require("../helpers/core-utils");
const logger_1 = require("../helpers/logger");
function checkMissedConfig() {
    const required = ['listen.port', 'listen.hostname',
        'webserver.https', 'webserver.hostname', 'webserver.port',
        'trust_proxy',
        'database.hostname', 'database.port', 'database.suffix', 'database.username', 'database.password', 'database.pool.max',
        'smtp.hostname', 'smtp.port', 'smtp.username', 'smtp.password', 'smtp.tls', 'smtp.from_address',
        'email.body.signature', 'email.subject.prefix',
        'storage.avatars', 'storage.videos', 'storage.logs', 'storage.previews', 'storage.thumbnails', 'storage.torrents', 'storage.cache',
        'storage.redundancy', 'storage.tmp', 'storage.streaming_playlists', 'storage.plugins',
        'log.level',
        'user.video_quota', 'user.video_quota_daily',
        'csp.enabled', 'csp.report_only', 'csp.report_uri',
        'cache.previews.size', 'admin.email', 'contact_form.enabled',
        'signup.enabled', 'signup.limit', 'signup.requires_email_verification',
        'signup.filters.cidr.whitelist', 'signup.filters.cidr.blacklist',
        'redundancy.videos.strategies', 'redundancy.videos.check_interval',
        'transcoding.enabled', 'transcoding.threads', 'transcoding.allow_additional_extensions', 'transcoding.hls.enabled',
        'import.videos.http.enabled', 'import.videos.torrent.enabled', 'auto_blacklist.videos.of_users.enabled',
        'trending.videos.interval_days',
        'instance.name', 'instance.short_description', 'instance.description', 'instance.terms', 'instance.default_client_route',
        'instance.is_nsfw', 'instance.default_nsfw_policy', 'instance.robots', 'instance.securitytxt',
        'services.twitter.username', 'services.twitter.whitelisted',
        'followers.instance.enabled', 'followers.instance.manual_approval',
        'tracker.enabled', 'tracker.private', 'tracker.reject_too_many_announces',
        'history.videos.max_age', 'views.videos.remote.max_age',
        'rates_limit.login.window', 'rates_limit.login.max', 'rates_limit.ask_send_email.window', 'rates_limit.ask_send_email.max',
        'theme.default'
    ];
    const requiredAlternatives = [
        [
            ['redis.hostname', 'redis.port'],
            ['redis.socket']
        ]
    ];
    const miss = [];
    for (const key of required) {
        if (!config.has(key)) {
            miss.push(key);
        }
    }
    const redundancyVideos = config.get('redundancy.videos.strategies');
    if (Array.isArray(redundancyVideos)) {
        for (const r of redundancyVideos) {
            if (!r.size)
                miss.push('redundancy.videos.strategies.size');
            if (!r.min_lifetime)
                miss.push('redundancy.videos.strategies.min_lifetime');
        }
    }
    const missingAlternatives = requiredAlternatives.filter(set => !set.find(alternative => !alternative.find(key => !config.has(key))));
    missingAlternatives
        .forEach(set => set[0].forEach(key => miss.push(key)));
    return miss;
}
exports.checkMissedConfig = checkMissedConfig;
function checkFFmpeg(CONFIG) {
    return __awaiter(this, void 0, void 0, function* () {
        if (CONFIG.TRANSCODING.ENABLED === false)
            return undefined;
        const Ffmpeg = require('fluent-ffmpeg');
        const getAvailableCodecsPromise = core_utils_1.promisify0(Ffmpeg.getAvailableCodecs);
        const codecs = yield getAvailableCodecsPromise();
        const canEncode = ['libx264'];
        for (const codec of canEncode) {
            if (codecs[codec] === undefined) {
                throw new Error('Unknown codec ' + codec + ' in FFmpeg.');
            }
            if (codecs[codec].canEncode !== true) {
                throw new Error('Unavailable encode codec ' + codec + ' in FFmpeg');
            }
        }
        return checkFFmpegEncoders();
    });
}
exports.checkFFmpeg = checkFFmpeg;
let supportedOptionalEncoders;
function checkFFmpegEncoders() {
    return __awaiter(this, void 0, void 0, function* () {
        if (supportedOptionalEncoders !== undefined) {
            return supportedOptionalEncoders;
        }
        const Ffmpeg = require('fluent-ffmpeg');
        const getAvailableEncodersPromise = core_utils_1.promisify0(Ffmpeg.getAvailableEncoders);
        const encoders = yield getAvailableEncodersPromise();
        const optionalEncoders = ['libfdk_aac'];
        supportedOptionalEncoders = new Map();
        for (const encoder of optionalEncoders) {
            supportedOptionalEncoders.set(encoder, encoders[encoder] !== undefined);
        }
        return supportedOptionalEncoders;
    });
}
exports.checkFFmpegEncoders = checkFFmpegEncoders;
function checkNodeVersion() {
    const v = process.version;
    const majorString = v.split('.')[0].replace('v', '');
    const major = parseInt(majorString, 10);
    logger_1.logger.debug('Checking NodeJS version %s.', v);
    if (major < 10) {
        logger_1.logger.warn('Your NodeJS version %s is deprecated. Please use Node 10.', v);
    }
}
exports.checkNodeVersion = checkNodeVersion;
