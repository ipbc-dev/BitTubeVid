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
const express = require("express");
const utils_1 = require("../../helpers/utils");
const middlewares_1 = require("../../middlewares");
const validators_1 = require("../../middlewares/validators");
const express_utils_1 = require("../../helpers/express-utils");
const constants_1 = require("../../initializers/constants");
const logger_1 = require("../../helpers/logger");
const database_utils_1 = require("../../helpers/database-utils");
const video_playlist_1 = require("../../models/video/video-playlist");
const video_playlists_1 = require("../../middlewares/validators/videos/video-playlists");
const video_playlist_privacy_model_1 = require("../../../shared/models/videos/playlist/video-playlist-privacy.model");
const path_1 = require("path");
const send_1 = require("../../lib/activitypub/send");
const url_1 = require("../../lib/activitypub/url");
const video_playlist_element_1 = require("../../models/video/video-playlist-element");
const account_1 = require("../../models/account/account");
const job_queue_1 = require("../../lib/job-queue");
const config_1 = require("../../initializers/config");
const database_1 = require("../../initializers/database");
const thumbnail_1 = require("../../lib/thumbnail");
const reqThumbnailFile = express_utils_1.createReqFiles(['thumbnailfile'], constants_1.MIMETYPES.IMAGE.MIMETYPE_EXT, { thumbnailfile: config_1.CONFIG.STORAGE.TMP_DIR });
const videoPlaylistRouter = express.Router();
exports.videoPlaylistRouter = videoPlaylistRouter;
videoPlaylistRouter.get('/privacies', listVideoPlaylistPrivacies);
videoPlaylistRouter.get('/', middlewares_1.paginationValidator, validators_1.videoPlaylistsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, video_playlists_1.commonVideoPlaylistFiltersValidator, middlewares_1.asyncMiddleware(listVideoPlaylists));
videoPlaylistRouter.get('/:playlistId', middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsGetValidator('summary')), getVideoPlaylist);
videoPlaylistRouter.post('/', middlewares_1.authenticate, reqThumbnailFile, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsAddValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoPlaylist));
videoPlaylistRouter.put('/:playlistId', middlewares_1.authenticate, reqThumbnailFile, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsUpdateValidator), middlewares_1.asyncRetryTransactionMiddleware(updateVideoPlaylist));
videoPlaylistRouter.delete('/:playlistId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsDeleteValidator), middlewares_1.asyncRetryTransactionMiddleware(removeVideoPlaylist));
videoPlaylistRouter.get('/:playlistId/videos', middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsGetValidator('summary')), middlewares_1.paginationValidator, middlewares_1.setDefaultPagination, middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(getVideoPlaylistVideos));
videoPlaylistRouter.post('/:playlistId/videos', middlewares_1.authenticate, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsAddVideoValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoInPlaylist));
videoPlaylistRouter.post('/:playlistId/videos/reorder', middlewares_1.authenticate, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsReorderVideosValidator), middlewares_1.asyncRetryTransactionMiddleware(reorderVideosPlaylist));
videoPlaylistRouter.put('/:playlistId/videos/:playlistElementId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsUpdateOrRemoveVideoValidator), middlewares_1.asyncRetryTransactionMiddleware(updateVideoPlaylistElement));
videoPlaylistRouter.delete('/:playlistId/videos/:playlistElementId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(video_playlists_1.videoPlaylistsUpdateOrRemoveVideoValidator), middlewares_1.asyncRetryTransactionMiddleware(removeVideoFromPlaylist));
function listVideoPlaylistPrivacies(req, res) {
    res.json(constants_1.VIDEO_PLAYLIST_PRIVACIES);
}
function listVideoPlaylists(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverActor = yield utils_1.getServerActor();
        const resultList = yield video_playlist_1.VideoPlaylistModel.listForApi({
            followerActorId: serverActor.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            type: req.query.type
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function getVideoPlaylist(req, res) {
    const videoPlaylist = res.locals.videoPlaylistSummary;
    if (videoPlaylist.isOutdated()) {
        job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-refresher', payload: { type: 'video-playlist', url: videoPlaylist.url } })
            .catch(err => logger_1.logger.error('Cannot create AP refresher job for playlist %s.', videoPlaylist.url, { err }));
    }
    return res.json(videoPlaylist.toFormattedJSON());
}
function addVideoPlaylist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylistInfo = req.body;
        const user = res.locals.oauth.token.User;
        const videoPlaylist = new video_playlist_1.VideoPlaylistModel({
            name: videoPlaylistInfo.displayName,
            description: videoPlaylistInfo.description,
            privacy: videoPlaylistInfo.privacy || video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE,
            ownerAccountId: user.Account.id
        });
        videoPlaylist.url = url_1.getVideoPlaylistActivityPubUrl(videoPlaylist);
        if (videoPlaylistInfo.videoChannelId) {
            const videoChannel = res.locals.videoChannel;
            videoPlaylist.videoChannelId = videoChannel.id;
            videoPlaylist.VideoChannel = videoChannel;
        }
        const thumbnailField = req.files['thumbnailfile'];
        const thumbnailModel = thumbnailField
            ? yield thumbnail_1.createPlaylistMiniatureFromExisting(thumbnailField[0].path, videoPlaylist, false)
            : undefined;
        const videoPlaylistCreated = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const videoPlaylistCreated = yield videoPlaylist.save({ transaction: t });
            if (thumbnailModel) {
                thumbnailModel.automaticallyGenerated = false;
                yield videoPlaylistCreated.setAndSaveThumbnail(thumbnailModel, t);
            }
            videoPlaylistCreated.OwnerAccount = yield account_1.AccountModel.load(user.Account.id, t);
            yield send_1.sendCreateVideoPlaylist(videoPlaylistCreated, t);
            return videoPlaylistCreated;
        }));
        logger_1.logger.info('Video playlist with uuid %s created.', videoPlaylist.uuid);
        return res.json({
            videoPlaylist: {
                id: videoPlaylistCreated.id,
                uuid: videoPlaylistCreated.uuid
            }
        }).end();
    });
}
function updateVideoPlaylist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylistInstance = res.locals.videoPlaylistFull;
        const videoPlaylistFieldsSave = videoPlaylistInstance.toJSON();
        const videoPlaylistInfoToUpdate = req.body;
        const wasPrivatePlaylist = videoPlaylistInstance.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE;
        const wasNotPrivatePlaylist = videoPlaylistInstance.privacy !== video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE;
        const thumbnailField = req.files['thumbnailfile'];
        const thumbnailModel = thumbnailField
            ? yield thumbnail_1.createPlaylistMiniatureFromExisting(thumbnailField[0].path, videoPlaylistInstance, false)
            : undefined;
        try {
            yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                const sequelizeOptions = {
                    transaction: t
                };
                if (videoPlaylistInfoToUpdate.videoChannelId !== undefined) {
                    if (videoPlaylistInfoToUpdate.videoChannelId === null) {
                        videoPlaylistInstance.videoChannelId = null;
                    }
                    else {
                        const videoChannel = res.locals.videoChannel;
                        videoPlaylistInstance.videoChannelId = videoChannel.id;
                        videoPlaylistInstance.VideoChannel = videoChannel;
                    }
                }
                if (videoPlaylistInfoToUpdate.displayName !== undefined)
                    videoPlaylistInstance.name = videoPlaylistInfoToUpdate.displayName;
                if (videoPlaylistInfoToUpdate.description !== undefined)
                    videoPlaylistInstance.description = videoPlaylistInfoToUpdate.description;
                if (videoPlaylistInfoToUpdate.privacy !== undefined) {
                    videoPlaylistInstance.privacy = parseInt(videoPlaylistInfoToUpdate.privacy.toString(), 10);
                    if (wasNotPrivatePlaylist === true && videoPlaylistInstance.privacy === video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE) {
                        yield send_1.sendDeleteVideoPlaylist(videoPlaylistInstance, t);
                    }
                }
                const playlistUpdated = yield videoPlaylistInstance.save(sequelizeOptions);
                if (thumbnailModel) {
                    thumbnailModel.automaticallyGenerated = false;
                    yield playlistUpdated.setAndSaveThumbnail(thumbnailModel, t);
                }
                const isNewPlaylist = wasPrivatePlaylist && playlistUpdated.privacy !== video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE;
                if (isNewPlaylist) {
                    yield send_1.sendCreateVideoPlaylist(playlistUpdated, t);
                }
                else {
                    yield send_1.sendUpdateVideoPlaylist(playlistUpdated, t);
                }
                logger_1.logger.info('Video playlist %s updated.', videoPlaylistInstance.uuid);
                return playlistUpdated;
            }));
        }
        catch (err) {
            logger_1.logger.debug('Cannot update the video playlist.', { err });
            database_utils_1.resetSequelizeInstance(videoPlaylistInstance, videoPlaylistFieldsSave);
            throw err;
        }
        return res.type('json').status(204).end();
    });
}
function removeVideoPlaylist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylistInstance = res.locals.videoPlaylistSummary;
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            yield videoPlaylistInstance.destroy({ transaction: t });
            yield send_1.sendDeleteVideoPlaylist(videoPlaylistInstance, t);
            logger_1.logger.info('Video playlist %s deleted.', videoPlaylistInstance.uuid);
        }));
        return res.type('json').status(204).end();
    });
}
function addVideoInPlaylist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const videoPlaylist = res.locals.videoPlaylistFull;
        const video = res.locals.onlyVideo;
        const playlistElement = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const position = yield video_playlist_element_1.VideoPlaylistElementModel.getNextPositionOf(videoPlaylist.id, t);
            const playlistElement = yield video_playlist_element_1.VideoPlaylistElementModel.create({
                url: url_1.getVideoPlaylistElementActivityPubUrl(videoPlaylist, video),
                position,
                startTimestamp: body.startTimestamp || null,
                stopTimestamp: body.stopTimestamp || null,
                videoPlaylistId: videoPlaylist.id,
                videoId: video.id
            }, { transaction: t });
            videoPlaylist.changed('updatedAt', true);
            yield videoPlaylist.save({ transaction: t });
            return playlistElement;
        }));
        if (videoPlaylist.hasThumbnail() === false || (videoPlaylist.hasGeneratedThumbnail() && playlistElement.position === 1)) {
            yield generateThumbnailForPlaylist(videoPlaylist, video);
        }
        send_1.sendUpdateVideoPlaylist(videoPlaylist, undefined)
            .catch(err => logger_1.logger.error('Cannot send video playlist update.', { err }));
        logger_1.logger.info('Video added in playlist %s at position %d.', videoPlaylist.uuid, playlistElement.position);
        return res.json({
            videoPlaylistElement: {
                id: playlistElement.id
            }
        }).end();
    });
}
function updateVideoPlaylistElement(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const videoPlaylist = res.locals.videoPlaylistFull;
        const videoPlaylistElement = res.locals.videoPlaylistElement;
        const playlistElement = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            if (body.startTimestamp !== undefined)
                videoPlaylistElement.startTimestamp = body.startTimestamp;
            if (body.stopTimestamp !== undefined)
                videoPlaylistElement.stopTimestamp = body.stopTimestamp;
            const element = yield videoPlaylistElement.save({ transaction: t });
            videoPlaylist.changed('updatedAt', true);
            yield videoPlaylist.save({ transaction: t });
            yield send_1.sendUpdateVideoPlaylist(videoPlaylist, t);
            return element;
        }));
        logger_1.logger.info('Element of position %d of playlist %s updated.', playlistElement.position, videoPlaylist.uuid);
        return res.type('json').status(204).end();
    });
}
function removeVideoFromPlaylist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylistElement = res.locals.videoPlaylistElement;
        const videoPlaylist = res.locals.videoPlaylistFull;
        const positionToDelete = videoPlaylistElement.position;
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            yield videoPlaylistElement.destroy({ transaction: t });
            yield video_playlist_element_1.VideoPlaylistElementModel.increasePositionOf(videoPlaylist.id, positionToDelete, null, -1, t);
            videoPlaylist.changed('updatedAt', true);
            yield videoPlaylist.save({ transaction: t });
            logger_1.logger.info('Video playlist element %d of playlist %s deleted.', videoPlaylistElement.position, videoPlaylist.uuid);
        }));
        if (positionToDelete === 1 && videoPlaylist.hasGeneratedThumbnail()) {
            yield regeneratePlaylistThumbnail(videoPlaylist);
        }
        send_1.sendUpdateVideoPlaylist(videoPlaylist, undefined)
            .catch(err => logger_1.logger.error('Cannot send video playlist update.', { err }));
        return res.type('json').status(204).end();
    });
}
function reorderVideosPlaylist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylist = res.locals.videoPlaylistFull;
        const body = req.body;
        const start = body.startPosition;
        const insertAfter = body.insertAfterPosition;
        const reorderLength = body.reorderLength || 1;
        if (start === insertAfter) {
            return res.status(204).end();
        }
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const newPosition = insertAfter + 1;
            yield video_playlist_element_1.VideoPlaylistElementModel.increasePositionOf(videoPlaylist.id, newPosition, null, reorderLength, t);
            let oldPosition = start;
            if (start >= newPosition)
                oldPosition += reorderLength;
            const endOldPosition = oldPosition + reorderLength - 1;
            yield video_playlist_element_1.VideoPlaylistElementModel.reassignPositionOf(videoPlaylist.id, oldPosition, endOldPosition, newPosition, t);
            yield video_playlist_element_1.VideoPlaylistElementModel.increasePositionOf(videoPlaylist.id, oldPosition, null, -reorderLength, t);
            videoPlaylist.changed('updatedAt', true);
            yield videoPlaylist.save({ transaction: t });
            yield send_1.sendUpdateVideoPlaylist(videoPlaylist, t);
        }));
        if ((start === 1 || insertAfter === 0) && videoPlaylist.hasGeneratedThumbnail()) {
            yield regeneratePlaylistThumbnail(videoPlaylist);
        }
        logger_1.logger.info('Reordered playlist %s (inserted after position %d elements %d - %d).', videoPlaylist.uuid, insertAfter, start, start + reorderLength - 1);
        return res.type('json').status(204).end();
    });
}
function getVideoPlaylistVideos(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylistInstance = res.locals.videoPlaylistSummary;
        const user = res.locals.oauth ? res.locals.oauth.token.User : undefined;
        const server = yield utils_1.getServerActor();
        const resultList = yield video_playlist_element_1.VideoPlaylistElementModel.listForApi({
            start: req.query.start,
            count: req.query.count,
            videoPlaylistId: videoPlaylistInstance.id,
            serverAccount: server.Account,
            user
        });
        const options = {
            displayNSFW: express_utils_1.buildNSFWFilter(res, req.query.nsfw),
            accountId: user ? user.Account.id : undefined
        };
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total, options));
    });
}
function regeneratePlaylistThumbnail(videoPlaylist) {
    return __awaiter(this, void 0, void 0, function* () {
        yield videoPlaylist.Thumbnail.destroy();
        videoPlaylist.Thumbnail = null;
        const firstElement = yield video_playlist_element_1.VideoPlaylistElementModel.loadFirstElementWithVideoThumbnail(videoPlaylist.id);
        if (firstElement)
            yield generateThumbnailForPlaylist(videoPlaylist, firstElement.Video);
    });
}
function generateThumbnailForPlaylist(videoPlaylist, video) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Generating default thumbnail to playlist %s.', videoPlaylist.url);
        const inputPath = path_1.join(config_1.CONFIG.STORAGE.THUMBNAILS_DIR, video.getMiniature().filename);
        const thumbnailModel = yield thumbnail_1.createPlaylistMiniatureFromExisting(inputPath, videoPlaylist, true, true);
        thumbnailModel.videoPlaylistId = videoPlaylist.id;
        videoPlaylist.Thumbnail = yield thumbnailModel.save();
    });
}
