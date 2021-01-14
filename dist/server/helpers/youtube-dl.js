"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOriginallyPublishedAt = exports.safeGetYoutubeDL = exports.getYoutubeDLInfo = exports.getYoutubeDLSubs = exports.downloadYoutubeDLVideo = exports.updateYoutubeDLBinary = void 0;
const tslib_1 = require("tslib");
const constants_1 = require("../initializers/constants");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
const path_1 = require("path");
const core_utils_1 = require("./core-utils");
const fs_extra_1 = require("fs-extra");
const request = require("request");
const fs_1 = require("fs");
const config_1 = require("@server/initializers/config");
const http_error_codes_1 = require("../../shared/core-utils/miscs/http-error-codes");
const processOptions = {
    maxBuffer: 1024 * 1024 * 10
};
function getYoutubeDLInfo(url, opts) {
    return new Promise((res, rej) => {
        let args = opts || ['-j', '--flat-playlist'];
        if (config_1.CONFIG.IMPORT.VIDEOS.HTTP.FORCE_IPV4) {
            args.push('--force-ipv4');
        }
        args = wrapWithProxyOptions(args);
        safeGetYoutubeDL()
            .then(youtubeDL => {
            youtubeDL.getInfo(url, args, processOptions, (err, info) => {
                if (err)
                    return rej(err);
                if (info.is_live === true)
                    return rej(new Error('Cannot download a live streaming.'));
                const obj = buildVideoInfo(normalizeObject(info));
                if (obj.name && obj.name.length < constants_1.CONSTRAINTS_FIELDS.VIDEOS.NAME.min)
                    obj.name += ' video';
                return res(obj);
            });
        })
            .catch(err => rej(err));
    });
}
exports.getYoutubeDLInfo = getYoutubeDLInfo;
function getYoutubeDLSubs(url, opts) {
    return new Promise((res, rej) => {
        const cwd = config_1.CONFIG.STORAGE.TMP_DIR;
        const options = opts || { all: true, format: 'vtt', cwd };
        safeGetYoutubeDL()
            .then(youtubeDL => {
            youtubeDL.getSubs(url, options, (err, files) => {
                if (err)
                    return rej(err);
                if (!files)
                    return [];
                logger_1.logger.debug('Get subtitles from youtube dl.', { url, files });
                const subtitles = files.reduce((acc, filename) => {
                    const matched = filename.match(/\.([a-z]{2})\.(vtt|ttml)/i);
                    if (!matched || !matched[1])
                        return acc;
                    return [
                        ...acc,
                        {
                            language: matched[1],
                            path: path_1.join(cwd, filename),
                            filename
                        }
                    ];
                }, []);
                return res(subtitles);
            });
        })
            .catch(err => rej(err));
    });
}
exports.getYoutubeDLSubs = getYoutubeDLSubs;
function downloadYoutubeDLVideo(url, extension, timeout) {
    const path = utils_1.generateVideoImportTmpPath(url, extension);
    let timer;
    logger_1.logger.info('Importing youtubeDL video %s to %s', url, path);
    let options = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best', '-o', path];
    options = wrapWithProxyOptions(options);
    if (process.env.FFMPEG_PATH) {
        options = options.concat(['--ffmpeg-location', process.env.FFMPEG_PATH]);
    }
    return new Promise((res, rej) => {
        safeGetYoutubeDL()
            .then(youtubeDL => {
            youtubeDL.exec(url, options, processOptions, err => {
                clearTimeout(timer);
                if (err) {
                    fs_extra_1.remove(path)
                        .catch(err => logger_1.logger.error('Cannot delete path on YoutubeDL error.', { err }));
                    return rej(err);
                }
                return res(path);
            });
            timer = setTimeout(() => {
                const err = new Error('YoutubeDL download timeout.');
                fs_extra_1.remove(path)
                    .finally(() => rej(err))
                    .catch(err => {
                    logger_1.logger.error('Cannot remove %s in youtubeDL timeout.', path, { err });
                    return rej(err);
                });
            }, timeout);
        })
            .catch(err => rej(err));
    });
}
exports.downloadYoutubeDLVideo = downloadYoutubeDLVideo;
function updateYoutubeDLBinary() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Updating youtubeDL binary.');
        const binDirectory = path_1.join(core_utils_1.root(), 'node_modules', 'youtube-dl', 'bin');
        const bin = path_1.join(binDirectory, 'youtube-dl');
        const detailsPath = path_1.join(binDirectory, 'details');
        const url = process.env.YOUTUBE_DL_DOWNLOAD_HOST || 'https://yt-dl.org/downloads/latest/youtube-dl';
        yield fs_extra_1.ensureDir(binDirectory);
        return new Promise(res => {
            request.get(url, { followRedirect: false }, (err, result) => {
                if (err) {
                    logger_1.logger.error('Cannot update youtube-dl.', { err });
                    return res();
                }
                if (result.statusCode !== http_error_codes_1.HttpStatusCode.FOUND_302) {
                    logger_1.logger.error('youtube-dl update error: did not get redirect for the latest version link. Status %d', result.statusCode);
                    return res();
                }
                const url = result.headers.location;
                const downloadFile = request.get(url);
                const newVersion = /yt-dl\.org\/downloads\/(\d{4}\.\d\d\.\d\d(\.\d)?)\/youtube-dl/.exec(url)[1];
                downloadFile.on('response', result => {
                    if (result.statusCode !== http_error_codes_1.HttpStatusCode.OK_200) {
                        logger_1.logger.error('Cannot update youtube-dl: new version response is not 200, it\'s %d.', result.statusCode);
                        return res();
                    }
                    const writeStream = fs_1.createWriteStream(bin, { mode: 493 }).on('error', err => {
                        logger_1.logger.error('youtube-dl update error in write stream', { err });
                        return res();
                    });
                    downloadFile.pipe(writeStream);
                });
                downloadFile.on('error', err => {
                    logger_1.logger.error('youtube-dl update error.', { err });
                    return res();
                });
                downloadFile.on('end', () => {
                    const details = JSON.stringify({ version: newVersion, path: bin, exec: 'youtube-dl' });
                    fs_extra_1.writeFile(detailsPath, details, { encoding: 'utf8' }, err => {
                        if (err) {
                            logger_1.logger.error('youtube-dl update error: cannot write details.', { err });
                            return res();
                        }
                        logger_1.logger.info('youtube-dl updated to version %s.', newVersion);
                        return res();
                    });
                });
            });
        });
    });
}
exports.updateYoutubeDLBinary = updateYoutubeDLBinary;
function safeGetYoutubeDL() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let youtubeDL;
        try {
            youtubeDL = require('youtube-dl');
        }
        catch (e) {
            yield updateYoutubeDLBinary();
            youtubeDL = require('youtube-dl');
        }
        return youtubeDL;
    });
}
exports.safeGetYoutubeDL = safeGetYoutubeDL;
function buildOriginallyPublishedAt(obj) {
    let originallyPublishedAt = null;
    const uploadDateMatcher = /^(\d{4})(\d{2})(\d{2})$/.exec(obj.upload_date);
    if (uploadDateMatcher) {
        originallyPublishedAt = new Date();
        originallyPublishedAt.setHours(0, 0, 0, 0);
        const year = parseInt(uploadDateMatcher[1], 10);
        const month = parseInt(uploadDateMatcher[2], 10) - 1;
        const day = parseInt(uploadDateMatcher[3], 10);
        originallyPublishedAt.setFullYear(year, month, day);
    }
    return originallyPublishedAt;
}
exports.buildOriginallyPublishedAt = buildOriginallyPublishedAt;
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
function buildVideoInfo(obj) {
    return {
        name: titleTruncation(obj.title),
        description: descriptionTruncation(obj.description),
        category: getCategory(obj.categories),
        licence: getLicence(obj.license),
        language: getLanguage(obj.language),
        nsfw: isNSFW(obj),
        tags: getTags(obj.tags),
        thumbnailUrl: obj.thumbnail || undefined,
        originallyPublishedAt: buildOriginallyPublishedAt(obj),
        fileExt: obj.ext
    };
}
function titleTruncation(title) {
    return core_utils_1.peertubeTruncate(title, {
        length: constants_1.CONSTRAINTS_FIELDS.VIDEOS.NAME.max,
        separator: /,? +/,
        omission: ' […]'
    });
}
function descriptionTruncation(description) {
    if (!description || description.length < constants_1.CONSTRAINTS_FIELDS.VIDEOS.DESCRIPTION.min)
        return undefined;
    return core_utils_1.peertubeTruncate(description, {
        length: constants_1.CONSTRAINTS_FIELDS.VIDEOS.DESCRIPTION.max,
        separator: /,? +/,
        omission: ' […]'
    });
}
function isNSFW(info) {
    return info.age_limit && info.age_limit >= 16;
}
function getTags(tags) {
    if (Array.isArray(tags) === false)
        return [];
    return tags
        .filter(t => t.length < constants_1.CONSTRAINTS_FIELDS.VIDEOS.TAG.max && t.length > constants_1.CONSTRAINTS_FIELDS.VIDEOS.TAG.min)
        .map(t => t.normalize())
        .slice(0, 5);
}
function getLicence(licence) {
    if (!licence)
        return undefined;
    if (licence.includes('Creative Commons Attribution'))
        return 1;
    for (const key of Object.keys(constants_1.VIDEO_LICENCES)) {
        const peertubeLicence = constants_1.VIDEO_LICENCES[key];
        if (peertubeLicence.toLowerCase() === licence.toLowerCase())
            return parseInt(key, 10);
    }
    return undefined;
}
function getCategory(categories) {
    if (!categories)
        return undefined;
    const categoryString = categories[0];
    if (!categoryString || typeof categoryString !== 'string')
        return undefined;
    if (categoryString === 'News & Politics')
        return 11;
    for (const key of Object.keys(constants_1.VIDEO_CATEGORIES)) {
        const category = constants_1.VIDEO_CATEGORIES[key];
        if (categoryString.toLowerCase() === category.toLowerCase())
            return parseInt(key, 10);
    }
    return undefined;
}
function getLanguage(language) {
    return constants_1.VIDEO_LANGUAGES[language] ? language : undefined;
}
function wrapWithProxyOptions(options) {
    if (config_1.CONFIG.IMPORT.VIDEOS.HTTP.PROXY.ENABLED) {
        logger_1.logger.debug('Using proxy for YoutubeDL');
        return ['--proxy', config_1.CONFIG.IMPORT.VIDEOS.HTTP.PROXY.URL].concat(options);
    }
    return options;
}
