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
const register_ts_paths_1 = require("../helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const path_1 = require("path");
const requests_1 = require("../helpers/requests");
const constants_1 = require("../initializers/constants");
const index_1 = require("../../shared/extra-utils/index");
const lodash_1 = require("lodash");
const prompt = require("prompt");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const core_utils_1 = require("../helpers/core-utils");
const youtube_dl_1 = require("../helpers/youtube-dl");
const cli_1 = require("./cli");
const processOptions = {
    maxBuffer: Infinity
};
let command = program
    .name('import-videos');
command = cli_1.buildCommonVideoOptions(command);
command
    .option('-u, --url <url>', 'Server url')
    .option('-U, --username <username>', 'Username')
    .option('-p, --password <token>', 'Password')
    .option('--target-url <targetUrl>', 'Video target URL')
    .option('--since <since>', 'Publication date (inclusive) since which the videos can be imported (YYYY-MM-DD)', parseDate)
    .option('--until <until>', 'Publication date (inclusive) until which the videos can be imported (YYYY-MM-DD)', parseDate)
    .option('--first <first>', 'Process first n elements of returned playlist')
    .option('--last <last>', 'Process last n elements of returned playlist')
    .option('-T, --tmpdir <tmpdir>', 'Working directory', __dirname)
    .usage("[global options] [ -- youtube-dl options]")
    .parse(process.argv);
const log = cli_1.getLogger(program['verbose']);
cli_1.getServerCredentials(command)
    .then(({ url, username, password }) => {
    if (!program['targetUrl']) {
        exitError('--target-url field is required.');
    }
    try {
        fs_1.accessSync(program['tmpdir'], fs_1.constants.R_OK | fs_1.constants.W_OK);
    }
    catch (e) {
        exitError('--tmpdir %s: directory does not exist or is not accessible', program['tmpdir']);
    }
    url = normalizeTargetUrl(url);
    program['targetUrl'] = normalizeTargetUrl(program['targetUrl']);
    const user = { username, password };
    run(url, user)
        .catch(err => exitError(err));
})
    .catch(err => console.error(err));
function run(url, user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!user.password) {
            user.password = yield promptPassword();
        }
        const youtubeDL = yield youtube_dl_1.safeGetYoutubeDL();
        const options = ['-j', '--flat-playlist', '--playlist-reverse', ...command.args];
        youtubeDL.getInfo(program['targetUrl'], options, processOptions, (err, info) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                exitError(err.stderr + ' ' + err.message);
            }
            let infoArray;
            infoArray = [].concat(info);
            if (program['first']) {
                infoArray = infoArray.slice(0, program['first']);
            }
            else if (program['last']) {
                infoArray = infoArray.slice(-program['last']);
            }
            infoArray = infoArray.map(i => normalizeObject(i));
            log.info('Will download and upload %d videos.\n', infoArray.length);
            for (const info of infoArray) {
                try {
                    yield processVideo({
                        cwd: program['tmpdir'],
                        url,
                        user,
                        youtubeInfo: info
                    });
                }
                catch (err) {
                    console.error('Cannot process video.', { info, url });
                }
            }
            log.info('Video/s for user %s imported: %s', user.username, program['targetUrl']);
            process.exit(0);
        }));
    });
}
function processVideo(parameters) {
    const { youtubeInfo, cwd, url, user } = parameters;
    return new Promise((res) => __awaiter(this, void 0, void 0, function* () {
        log.debug('Fetching object.', youtubeInfo);
        const videoInfo = yield fetchObject(youtubeInfo);
        log.debug('Fetched object.', videoInfo);
        if (program['since']) {
            if (youtube_dl_1.buildOriginallyPublishedAt(videoInfo).getTime() < program['since'].getTime()) {
                log.info('Video "%s" has been published before "%s", don\'t upload it.\n', videoInfo.title, formatDate(program['since']));
                return res();
            }
        }
        if (program['until']) {
            if (youtube_dl_1.buildOriginallyPublishedAt(videoInfo).getTime() > program['until'].getTime()) {
                log.info('Video "%s" has been published after "%s", don\'t upload it.\n', videoInfo.title, formatDate(program['until']));
                return res();
            }
        }
        const result = yield index_1.searchVideoWithSort(url, videoInfo.title, '-match');
        log.info('############################################################\n');
        if (result.body.data.find(v => v.name === videoInfo.title)) {
            log.info('Video "%s" already exists, don\'t reupload it.\n', videoInfo.title);
            return res();
        }
        const path = path_1.join(cwd, core_utils_1.sha256(videoInfo.url) + '.mp4');
        log.info('Downloading video "%s"...', videoInfo.title);
        const options = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best', ...command.args, '-o', path];
        try {
            const youtubeDL = yield youtube_dl_1.safeGetYoutubeDL();
            youtubeDL.exec(videoInfo.url, options, processOptions, (err, output) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    log.error(err);
                    return res();
                }
                log.info(output.join('\n'));
                yield uploadVideoOnPeerTube({
                    cwd,
                    url,
                    user,
                    videoInfo: normalizeObject(videoInfo),
                    videoPath: path
                });
                return res();
            }));
        }
        catch (err) {
            log.error(err.message);
            return res();
        }
    }));
}
function uploadVideoOnPeerTube(parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        const { videoInfo, videoPath, cwd, url, user } = parameters;
        const category = yield getCategory(videoInfo.categories, url);
        const licence = getLicence(videoInfo.license);
        let tags = [];
        if (Array.isArray(videoInfo.tags)) {
            tags = videoInfo.tags
                .filter(t => t.length < constants_1.CONSTRAINTS_FIELDS.VIDEOS.TAG.max && t.length > constants_1.CONSTRAINTS_FIELDS.VIDEOS.TAG.min)
                .map(t => t.normalize())
                .slice(0, 5);
        }
        let thumbnailfile;
        if (videoInfo.thumbnail) {
            thumbnailfile = path_1.join(cwd, core_utils_1.sha256(videoInfo.thumbnail) + '.jpg');
            yield requests_1.doRequestAndSaveToFile({
                method: 'GET',
                uri: videoInfo.thumbnail
            }, thumbnailfile);
        }
        const originallyPublishedAt = youtube_dl_1.buildOriginallyPublishedAt(videoInfo);
        const defaultAttributes = {
            name: lodash_1.truncate(videoInfo.title, {
                length: constants_1.CONSTRAINTS_FIELDS.VIDEOS.NAME.max,
                separator: /,? +/,
                omission: ' […]'
            }),
            category,
            licence,
            nsfw: isNSFW(videoInfo),
            description: videoInfo.description,
            tags
        };
        const videoAttributes = yield cli_1.buildVideoAttributesFromCommander(url, program, defaultAttributes);
        Object.assign(videoAttributes, {
            originallyPublishedAt: originallyPublishedAt ? originallyPublishedAt.toISOString() : null,
            thumbnailfile,
            previewfile: thumbnailfile,
            fixture: videoPath
        });
        log.info('\nUploading on BitTube video "%s".', videoAttributes.name);
        let accessToken = yield getAccessTokenOrDie(url, user);
        try {
            yield index_1.uploadVideo(url, accessToken, videoAttributes);
        }
        catch (err) {
            if (err.message.indexOf('401') !== -1) {
                log.info('Got 401 Unauthorized, token may have expired, renewing token and retry.');
                accessToken = yield getAccessTokenOrDie(url, user);
                yield index_1.uploadVideo(url, accessToken, videoAttributes);
            }
            else {
                exitError(err.message);
            }
        }
        yield fs_extra_1.remove(videoPath);
        if (thumbnailfile)
            yield fs_extra_1.remove(thumbnailfile);
        log.warn('Uploaded video "%s"!\n', videoAttributes.name);
    });
}
function getCategory(categories, url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!categories)
            return undefined;
        const categoryString = categories[0];
        if (categoryString === 'News & Politics')
            return 11;
        const res = yield index_1.getVideoCategories(url);
        const categoriesServer = res.body;
        for (const key of Object.keys(categoriesServer)) {
            const categoryServer = categoriesServer[key];
            if (categoryString.toLowerCase() === categoryServer.toLowerCase())
                return parseInt(key, 10);
        }
        return undefined;
    });
}
function getLicence(licence) {
    if (!licence)
        return undefined;
    if (licence.includes('Creative Commons Attribution licence'))
        return 1;
    return undefined;
}
function normalizeObject(obj) {
    const newObj = {};
    for (const key of Object.keys(obj)) {
        if (key === 'resolution')
            continue;
        const value = obj[key];
        if (typeof value === 'string') {
            newObj[key] = value.normalize();
        }
        else {
            newObj[key] = value;
        }
    }
    return newObj;
}
function fetchObject(info) {
    const url = buildUrl(info);
    return new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
        const youtubeDL = yield youtube_dl_1.safeGetYoutubeDL();
        youtubeDL.getInfo(url, undefined, processOptions, (err, videoInfo) => {
            if (err)
                return rej(err);
            const videoInfoWithUrl = Object.assign(videoInfo, { url });
            return res(normalizeObject(videoInfoWithUrl));
        });
    }));
}
function buildUrl(info) {
    const webpageUrl = info.webpage_url;
    if (webpageUrl === null || webpageUrl === void 0 ? void 0 : webpageUrl.match(/^https?:\/\//))
        return webpageUrl;
    const url = info.url;
    if (url === null || url === void 0 ? void 0 : url.match(/^https?:\/\//))
        return url;
    return 'https://www.youtube.com/watch?v=' + info.id;
}
function isNSFW(info) {
    return info.age_limit && info.age_limit >= 16;
}
function normalizeTargetUrl(url) {
    let normalizedUrl = url.replace(/\/+$/, '');
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }
    return normalizedUrl;
}
function promptPassword() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res, rej) => {
            prompt.start();
            const schema = {
                properties: {
                    password: {
                        hidden: true,
                        required: true
                    }
                }
            };
            prompt.get(schema, function (err, result) {
                if (err) {
                    return rej(err);
                }
                return res(result.password);
            });
        });
    });
}
function getAccessTokenOrDie(url, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const resClient = yield index_1.getClient(url);
        const client = {
            id: resClient.body.client_id,
            secret: resClient.body.client_secret
        };
        try {
            const res = yield index_1.login(url, client, user);
            return res.body.access_token;
        }
        catch (err) {
            exitError('Cannot authenticate. Please check your username/password.');
        }
    });
}
function parseDate(dateAsStr) {
    if (!/\d{4}-\d{2}-\d{2}/.test(dateAsStr)) {
        exitError(`Invalid date passed: ${dateAsStr}. Expected format: YYYY-MM-DD. See help for usage.`);
    }
    const date = new Date(dateAsStr);
    date.setHours(0, 0, 0);
    if (isNaN(date.getTime())) {
        exitError(`Invalid date passed: ${dateAsStr}. See help for usage.`);
    }
    return date;
}
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
function exitError(message, ...meta) {
    console.error(message, ...meta);
    process.exit(-1);
}
