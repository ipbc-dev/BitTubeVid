"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoCaption = exports.getPreview = exports.lazyStaticRouter = void 0;
const tslib_1 = require("tslib");
const cors = require("cors");
const express = require("express");
const constants_1 = require("../initializers/constants");
const files_cache_1 = require("../lib/files-cache");
const middlewares_1 = require("../middlewares");
const avatar_1 = require("../models/avatar/avatar");
const logger_1 = require("../helpers/logger");
const avatar_2 = require("../lib/avatar");
const lazyStaticRouter = express.Router();
exports.lazyStaticRouter = lazyStaticRouter;
lazyStaticRouter.use(cors());
lazyStaticRouter.use(constants_1.LAZY_STATIC_PATHS.AVATARS + ':filename', middlewares_1.asyncMiddleware(getAvatar));
lazyStaticRouter.use(constants_1.LAZY_STATIC_PATHS.PREVIEWS + ':uuid.jpg', middlewares_1.asyncMiddleware(getPreview));
lazyStaticRouter.use(constants_1.LAZY_STATIC_PATHS.VIDEO_CAPTIONS + ':videoId-:captionLanguage([a-z]+).vtt', middlewares_1.asyncMiddleware(getVideoCaption));
function getAvatar(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const filename = req.params.filename;
        if (avatar_2.avatarPathUnsafeCache.has(filename)) {
            return res.sendFile(avatar_2.avatarPathUnsafeCache.get(filename), { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
        }
        const avatar = yield avatar_1.AvatarModel.loadByName(filename);
        if (!avatar)
            return res.sendStatus(404);
        if (avatar.onDisk === false) {
            if (!avatar.fileUrl)
                return res.sendStatus(404);
            logger_1.logger.info('Lazy serve remote avatar image %s.', avatar.fileUrl);
            try {
                yield avatar_2.pushAvatarProcessInQueue({ filename: avatar.filename, fileUrl: avatar.fileUrl });
            }
            catch (err) {
                logger_1.logger.warn('Cannot process remote avatar %s.', avatar.fileUrl, { err });
                return res.sendStatus(404);
            }
            avatar.onDisk = true;
            avatar.save()
                .catch(err => logger_1.logger.error('Cannot save new avatar disk state.', { err }));
        }
        const path = avatar.getPath();
        avatar_2.avatarPathUnsafeCache.set(filename, path);
        return res.sendFile(path, { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
    });
}
function getPreview(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield files_cache_1.VideosPreviewCache.Instance.getFilePath(req.params.uuid);
        if (!result)
            return res.sendStatus(404);
        return res.sendFile(result.path, { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
    });
}
exports.getPreview = getPreview;
function getVideoCaption(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield files_cache_1.VideosCaptionCache.Instance.getFilePath({
            videoId: req.params.videoId,
            language: req.params.captionLanguage
        });
        if (!result)
            return res.sendStatus(404);
        return res.sendFile(result.path, { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
    });
}
exports.getVideoCaption = getVideoCaption;
