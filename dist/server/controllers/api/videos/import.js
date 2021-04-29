"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoImportsRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const fs_extra_1 = require("fs-extra");
const magnetUtil = require("magnet-uri");
const parseTorrent = require("parse-torrent");
const path_1 = require("path");
const video_1 = require("@server/lib/video");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const audit_logger_1 = require("../../../helpers/audit-logger");
const captions_utils_1 = require("../../../helpers/captions-utils");
const misc_1 = require("../../../helpers/custom-validators/misc");
const express_utils_1 = require("../../../helpers/express-utils");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const youtube_dl_1 = require("../../../helpers/youtube-dl");
const config_1 = require("../../../initializers/config");
const constants_1 = require("../../../initializers/constants");
const database_1 = require("../../../initializers/database");
const url_1 = require("../../../lib/activitypub/url");
const job_queue_1 = require("../../../lib/job-queue/job-queue");
const thumbnail_1 = require("../../../lib/thumbnail");
const video_blacklist_1 = require("../../../lib/video-blacklist");
const middlewares_1 = require("../../../middlewares");
const video_2 = require("../../../models/video/video");
const video_caption_1 = require("../../../models/video/video-caption");
const video_import_1 = require("../../../models/video/video-import");
const auditLogger = audit_logger_1.auditLoggerFactory('video-imports');
const videoImportsRouter = express.Router();
exports.videoImportsRouter = videoImportsRouter;
const reqVideoFileImport = express_utils_1.createReqFiles(['thumbnailfile', 'previewfile', 'torrentfile'], Object.assign({}, constants_1.MIMETYPES.TORRENT.MIMETYPE_EXT, constants_1.MIMETYPES.IMAGE.MIMETYPE_EXT), {
    thumbnailfile: config_1.CONFIG.STORAGE.TMP_DIR,
    previewfile: config_1.CONFIG.STORAGE.TMP_DIR,
    torrentfile: config_1.CONFIG.STORAGE.TMP_DIR
});
videoImportsRouter.post('/imports', middlewares_1.authenticate, reqVideoFileImport, middlewares_1.asyncMiddleware(middlewares_1.videoImportAddValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoImport));
function addVideoImport(req, res) {
    var _a, _b;
    if (req.body.targetUrl)
        return addYoutubeDLImport(req, res);
    const file = (_b = (_a = req.files) === null || _a === void 0 ? void 0 : _a['torrentfile']) === null || _b === void 0 ? void 0 : _b[0];
    if (req.body.magnetUri || file)
        return addTorrentImport(req, res, file);
}
function addTorrentImport(req, res, torrentfile) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const user = res.locals.oauth.token.User;
        let videoName;
        let torrentName;
        let magnetUri;
        if (torrentfile) {
            torrentName = torrentfile.originalname;
            const newTorrentPath = path_1.join(config_1.CONFIG.STORAGE.TORRENTS_DIR, utils_1.getSecureTorrentName(torrentName));
            yield fs_extra_1.move(torrentfile.path, newTorrentPath);
            torrentfile.path = newTorrentPath;
            const buf = yield fs_extra_1.readFile(torrentfile.path);
            const parsedTorrent = parseTorrent(buf);
            videoName = misc_1.isArray(parsedTorrent.name) ? parsedTorrent.name[0] : parsedTorrent.name;
        }
        else {
            magnetUri = body.magnetUri;
            const parsed = magnetUtil.decode(magnetUri);
            videoName = misc_1.isArray(parsed.name) ? parsed.name[0] : parsed.name;
        }
        const video = buildVideo(res.locals.videoChannel.id, body, { name: videoName });
        const thumbnailModel = yield processThumbnail(req, video);
        const previewModel = yield processPreview(req, video);
        const tags = body.tags || undefined;
        const videoImportAttributes = {
            magnetUri,
            torrentName,
            state: 1,
            userId: user.id
        };
        const videoImport = yield insertIntoDB({
            video,
            thumbnailModel,
            previewModel,
            videoChannel: res.locals.videoChannel,
            tags,
            videoImportAttributes,
            user
        });
        const payload = {
            type: torrentfile ? 'torrent-file' : 'magnet-uri',
            videoImportId: videoImport.id,
            magnetUri
        };
        yield job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'video-import', payload });
        auditLogger.create(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoImportAuditView(videoImport.toFormattedJSON()));
        return res.json(videoImport.toFormattedJSON()).end();
    });
}
function addYoutubeDLImport(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const targetUrl = body.targetUrl;
        const user = res.locals.oauth.token.User;
        let youtubeDLInfo;
        try {
            youtubeDLInfo = yield youtube_dl_1.getYoutubeDLInfo(targetUrl);
        }
        catch (err) {
            logger_1.logger.info('Cannot fetch information from import for URL %s.', targetUrl, { err });
            return res.status(http_error_codes_1.HttpStatusCode.BAD_REQUEST_400)
                .json({
                error: 'Cannot fetch remote information of this URL.'
            });
        }
        const video = buildVideo(res.locals.videoChannel.id, body, youtubeDLInfo);
        let thumbnailModel = yield processThumbnail(req, video);
        if (!thumbnailModel && youtubeDLInfo.thumbnailUrl) {
            thumbnailModel = yield processThumbnailFromUrl(youtubeDLInfo.thumbnailUrl, video);
        }
        let previewModel = yield processPreview(req, video);
        if (!previewModel && youtubeDLInfo.thumbnailUrl) {
            previewModel = yield processPreviewFromUrl(youtubeDLInfo.thumbnailUrl, video);
        }
        const tags = body.tags || youtubeDLInfo.tags;
        const videoImportAttributes = {
            targetUrl,
            state: 1,
            userId: user.id
        };
        const videoImport = yield insertIntoDB({
            video,
            thumbnailModel,
            previewModel,
            videoChannel: res.locals.videoChannel,
            tags,
            videoImportAttributes,
            user
        });
        try {
            const subtitles = yield youtube_dl_1.getYoutubeDLSubs(targetUrl);
            logger_1.logger.info('Will create %s subtitles from youtube import %s.', subtitles.length, targetUrl);
            for (const subtitle of subtitles) {
                const videoCaption = new video_caption_1.VideoCaptionModel({
                    videoId: video.id,
                    language: subtitle.language,
                    filename: video_caption_1.VideoCaptionModel.generateCaptionName(subtitle.language)
                });
                yield captions_utils_1.moveAndProcessCaptionFile(subtitle, videoCaption);
                yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield video_caption_1.VideoCaptionModel.insertOrReplaceLanguage(videoCaption, t);
                }));
            }
        }
        catch (err) {
            logger_1.logger.warn('Cannot get video subtitles.', { err });
        }
        const payload = {
            type: 'youtube-dl',
            videoImportId: videoImport.id,
            fileExt: `.${youtubeDLInfo.ext || 'mp4'}`
        };
        yield job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'video-import', payload });
        auditLogger.create(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.VideoImportAuditView(videoImport.toFormattedJSON()));
        return res.json(videoImport.toFormattedJSON()).end();
    });
}
function buildVideo(channelId, body, importData) {
    const videoData = {
        name: body.name || importData.name || 'Unknown name',
        remote: false,
        category: body.category || importData.category,
        licence: body.licence || importData.licence,
        language: body.language || importData.language,
        commentsEnabled: body.commentsEnabled !== false,
        downloadEnabled: body.downloadEnabled !== false,
        waitTranscoding: body.waitTranscoding || false,
        state: 3,
        nsfw: body.nsfw || importData.nsfw || false,
        description: body.description || importData.description,
        support: body.support || null,
        privacy: body.privacy || 3,
        duration: 0,
        channelId: channelId,
        originallyPublishedAt: body.originallyPublishedAt || importData.originallyPublishedAt
    };
    const video = new video_2.VideoModel(videoData);
    video.url = url_1.getLocalVideoActivityPubUrl(video);
    return video;
}
function processThumbnail(req, video) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const thumbnailField = req.files ? req.files['thumbnailfile'] : undefined;
        if (thumbnailField) {
            const thumbnailPhysicalFile = thumbnailField[0];
            return thumbnail_1.createVideoMiniatureFromExisting({
                inputPath: thumbnailPhysicalFile.path,
                video,
                type: 1,
                automaticallyGenerated: false
            });
        }
        return undefined;
    });
}
function processPreview(req, video) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const previewField = req.files ? req.files['previewfile'] : undefined;
        if (previewField) {
            const previewPhysicalFile = previewField[0];
            return thumbnail_1.createVideoMiniatureFromExisting({
                inputPath: previewPhysicalFile.path,
                video,
                type: 2,
                automaticallyGenerated: false
            });
        }
        return undefined;
    });
}
function processThumbnailFromUrl(url, video) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            return thumbnail_1.createVideoMiniatureFromUrl({ downloadUrl: url, video, type: 1 });
        }
        catch (err) {
            logger_1.logger.warn('Cannot generate video thumbnail %s for %s.', url, video.url, { err });
            return undefined;
        }
    });
}
function processPreviewFromUrl(url, video) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            return thumbnail_1.createVideoMiniatureFromUrl({ downloadUrl: url, video, type: 2 });
        }
        catch (err) {
            logger_1.logger.warn('Cannot generate video preview %s for %s.', url, video.url, { err });
            return undefined;
        }
    });
}
function insertIntoDB(parameters) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { video, thumbnailModel, previewModel, videoChannel, tags, videoImportAttributes, user } = parameters;
        const videoImport = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sequelizeOptions = { transaction: t };
            const videoCreated = yield video.save(sequelizeOptions);
            videoCreated.VideoChannel = videoChannel;
            if (thumbnailModel)
                yield videoCreated.addAndSaveThumbnail(thumbnailModel, t);
            if (previewModel)
                yield videoCreated.addAndSaveThumbnail(previewModel, t);
            yield video_blacklist_1.autoBlacklistVideoIfNeeded({
                video: videoCreated,
                user,
                notify: false,
                isRemote: false,
                isNew: true,
                transaction: t
            });
            yield video_1.setVideoTags({ video: videoCreated, tags, transaction: t });
            const videoImport = yield video_import_1.VideoImportModel.create(Object.assign({ videoId: videoCreated.id }, videoImportAttributes), sequelizeOptions);
            videoImport.Video = videoCreated;
            return videoImport;
        }));
        return videoImport;
    });
}
