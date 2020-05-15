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
const core_utils_1 = require("../helpers/core-utils");
const path_1 = require("path");
const miscs_1 = require("../../shared/extra-utils/miscs/miscs");
const video_channels_1 = require("../../shared/extra-utils/videos/video-channels");
const videos_1 = require("../../shared/models/videos");
const winston_1 = require("winston");
const extra_utils_1 = require("@shared/extra-utils");
const models_1 = require("@shared/models");
let configName = 'PeerTube/CLI';
if (core_utils_1.isTestInstance())
    configName += `-${core_utils_1.getAppNumber()}`;
const config = require('application-config')(configName);
exports.config = config;
const version = require('../../../package.json').version;
exports.version = version;
function getAdminTokenOrDie(url, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = yield extra_utils_1.getAccessToken(url, username, password);
        const resMe = yield extra_utils_1.getMyUserInformation(url, accessToken);
        const me = resMe.body;
        if (me.role !== models_1.UserRole.ADMINISTRATOR) {
            console.error('You must be an administrator.');
            process.exit(-1);
        }
        return accessToken;
    });
}
exports.getAdminTokenOrDie = getAdminTokenOrDie;
function getSettings() {
    return new Promise((res, rej) => {
        const defaultSettings = {
            remotes: [],
            default: -1
        };
        config.read((err, data) => {
            if (err)
                return rej(err);
            return res(Object.keys(data).length === 0 ? defaultSettings : data);
        });
    });
}
exports.getSettings = getSettings;
function getNetrc() {
    return __awaiter(this, void 0, void 0, function* () {
        const Netrc = require('netrc-parser').Netrc;
        const netrc = core_utils_1.isTestInstance()
            ? new Netrc(path_1.join(miscs_1.root(), 'test' + core_utils_1.getAppNumber(), 'netrc'))
            : new Netrc();
        yield netrc.load();
        return netrc;
    });
}
exports.getNetrc = getNetrc;
function writeSettings(settings) {
    return new Promise((res, rej) => {
        config.write(settings, err => {
            if (err)
                return rej(err);
            return res();
        });
    });
}
exports.writeSettings = writeSettings;
function deleteSettings() {
    return new Promise((res, rej) => {
        config.trash((err) => {
            if (err)
                return rej(err);
            return res();
        });
    });
}
exports.deleteSettings = deleteSettings;
function getRemoteObjectOrDie(program, settings, netrc) {
    if (!program['url'] || !program['username'] || !program['password']) {
        if (settings.remotes.length === 0 || Object.keys(netrc.machines).length === 0) {
            if (!program['url'])
                console.error('--url field is required.');
            if (!program['username'])
                console.error('--username field is required.');
            if (!program['password'])
                console.error('--password field is required.');
            return process.exit(-1);
        }
        let url = program['url'];
        let username = program['username'];
        let password = program['password'];
        if (!url && settings.default !== -1)
            url = settings.remotes[settings.default];
        const machine = netrc.machines[url];
        if (!username && machine)
            username = machine.login;
        if (!password && machine)
            password = machine.password;
        return { url, username, password };
    }
    return {
        url: program['url'],
        username: program['username'],
        password: program['password']
    };
}
exports.getRemoteObjectOrDie = getRemoteObjectOrDie;
function buildCommonVideoOptions(command) {
    function list(val) {
        return val.split(',');
    }
    return command
        .option('-n, --video-name <name>', 'Video name')
        .option('-c, --category <category_number>', 'Category number')
        .option('-l, --licence <licence_number>', 'Licence number')
        .option('-L, --language <language_code>', 'Language ISO 639 code (fr or en...)')
        .option('-t, --tags <tags>', 'Video tags', list)
        .option('-N, --nsfw', 'Video is Not Safe For Work')
        .option('-d, --video-description <description>', 'Video description')
        .option('-P, --privacy <privacy_number>', 'Privacy')
        .option('-C, --channel-name <channel_name>', 'Channel name')
        .option('-m, --comments-enabled', 'Enable comments')
        .option('-s, --support <support>', 'Video support text')
        .option('-w, --wait-transcoding', 'Wait transcoding before publishing the video')
        .option('-v, --verbose <verbose>', 'Verbosity, from 0/\'error\' to 4/\'debug\'', 'info');
}
exports.buildCommonVideoOptions = buildCommonVideoOptions;
function buildVideoAttributesFromCommander(url, command, defaultAttributes = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultBooleanAttributes = {
            nsfw: false,
            commentsEnabled: true,
            downloadEnabled: true,
            waitTranscoding: true
        };
        const booleanAttributes = {};
        for (const key of Object.keys(defaultBooleanAttributes)) {
            if (command[key] !== undefined) {
                booleanAttributes[key] = command[key];
            }
            else if (defaultAttributes[key] !== undefined) {
                booleanAttributes[key] = defaultAttributes[key];
            }
            else {
                booleanAttributes[key] = defaultBooleanAttributes[key];
            }
        }
        const videoAttributes = {
            name: command['videoName'] || defaultAttributes.name,
            category: command['category'] || defaultAttributes.category || undefined,
            licence: command['licence'] || defaultAttributes.licence || undefined,
            language: command['language'] || defaultAttributes.language || undefined,
            privacy: command['privacy'] || defaultAttributes.privacy || videos_1.VideoPrivacy.PUBLIC,
            support: command['support'] || defaultAttributes.support || undefined,
            description: command['videoDescription'] || defaultAttributes.description || undefined,
            tags: command['tags'] || defaultAttributes.tags || undefined
        };
        Object.assign(videoAttributes, booleanAttributes);
        if (command['channelName']) {
            const res = yield video_channels_1.getVideoChannel(url, command['channelName']);
            const videoChannel = res.body;
            Object.assign(videoAttributes, { channelId: videoChannel.id });
            if (!videoAttributes.support && videoChannel.support) {
                Object.assign(videoAttributes, { support: videoChannel.support });
            }
        }
        return videoAttributes;
    });
}
exports.buildVideoAttributesFromCommander = buildVideoAttributesFromCommander;
function getServerCredentials(program) {
    return Promise.all([getSettings(), getNetrc()])
        .then(([settings, netrc]) => {
        return getRemoteObjectOrDie(program, settings, netrc);
    });
}
exports.getServerCredentials = getServerCredentials;
function getLogger(logLevel = 'info') {
    const logLevels = {
        0: 0,
        error: 0,
        1: 1,
        warn: 1,
        2: 2,
        info: 2,
        3: 3,
        verbose: 3,
        4: 4,
        debug: 4
    };
    const logger = winston_1.createLogger({
        levels: logLevels,
        format: winston_1.format.combine(winston_1.format.splat(), winston_1.format.simple()),
        transports: [
            new (winston_1.transports.Console)({
                level: logLevel
            })
        ]
    });
    return logger;
}
exports.getLogger = getLogger;
