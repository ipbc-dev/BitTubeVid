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
const crawl_1 = require("./crawl");
const constants_1 = require("../../initializers/constants");
const misc_1 = require("../../helpers/custom-validators/misc");
const actor_1 = require("./actor");
const logger_1 = require("../../helpers/logger");
const video_playlist_1 = require("../../models/video/video-playlist");
const requests_1 = require("../../helpers/requests");
const activitypub_1 = require("../../helpers/activitypub");
const Bluebird = require("bluebird");
const videos_1 = require("./videos");
const playlist_1 = require("../../helpers/custom-validators/activitypub/playlist");
const video_playlist_element_1 = require("../../models/video/video-playlist-element");
const video_playlist_privacy_model_1 = require("../../../shared/models/videos/playlist/video-playlist-privacy.model");
const database_1 = require("../../initializers/database");
const thumbnail_1 = require("../thumbnail");
function playlistObjectToDBAttributes(playlistObject, byAccount, to) {
    const privacy = to.includes(constants_1.ACTIVITY_PUB.PUBLIC)
        ? video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC
        : video_playlist_privacy_model_1.VideoPlaylistPrivacy.UNLISTED;
    return {
        name: playlistObject.name,
        description: playlistObject.content,
        privacy,
        url: playlistObject.id,
        uuid: playlistObject.uuid,
        ownerAccountId: byAccount.id,
        videoChannelId: null,
        createdAt: new Date(playlistObject.published),
        updatedAt: new Date(playlistObject.updated)
    };
}
exports.playlistObjectToDBAttributes = playlistObjectToDBAttributes;
function playlistElementObjectToDBAttributes(elementObject, videoPlaylist, video) {
    return {
        position: elementObject.position,
        url: elementObject.id,
        startTimestamp: elementObject.startTimestamp || null,
        stopTimestamp: elementObject.stopTimestamp || null,
        videoPlaylistId: videoPlaylist.id,
        videoId: video.id
    };
}
exports.playlistElementObjectToDBAttributes = playlistElementObjectToDBAttributes;
function createAccountPlaylists(playlistUrls, account) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Bluebird.map(playlistUrls, (playlistUrl) => __awaiter(this, void 0, void 0, function* () {
            try {
                const exists = yield video_playlist_1.VideoPlaylistModel.doesPlaylistExist(playlistUrl);
                if (exists === true)
                    return;
                const { body } = yield requests_1.doRequest({
                    uri: playlistUrl,
                    json: true,
                    activityPub: true
                });
                if (!playlist_1.isPlaylistObjectValid(body)) {
                    throw new Error(`Invalid playlist object when fetch account playlists: ${JSON.stringify(body)}`);
                }
                if (!misc_1.isArray(body.to)) {
                    throw new Error('Playlist does not have an audience.');
                }
                return createOrUpdateVideoPlaylist(body, account, body.to);
            }
            catch (err) {
                logger_1.logger.warn('Cannot add playlist element %s.', playlistUrl, { err });
            }
        }), { concurrency: constants_1.CRAWL_REQUEST_CONCURRENCY });
    });
}
exports.createAccountPlaylists = createAccountPlaylists;
function createOrUpdateVideoPlaylist(playlistObject, byAccount, to) {
    return __awaiter(this, void 0, void 0, function* () {
        const playlistAttributes = playlistObjectToDBAttributes(playlistObject, byAccount, to);
        if (misc_1.isArray(playlistObject.attributedTo) && playlistObject.attributedTo.length === 1) {
            const actor = yield actor_1.getOrCreateActorAndServerAndModel(playlistObject.attributedTo[0]);
            if (actor.VideoChannel) {
                playlistAttributes.videoChannelId = actor.VideoChannel.id;
            }
            else {
                logger_1.logger.warn('Attributed to of video playlist %s is not a video channel.', playlistObject.id, { playlistObject });
            }
        }
        const [playlist] = yield video_playlist_1.VideoPlaylistModel.upsert(playlistAttributes, { returning: true });
        let accItems = [];
        yield crawl_1.crawlCollectionPage(playlistObject.id, items => {
            accItems = accItems.concat(items);
            return Promise.resolve();
        });
        const refreshedPlaylist = yield video_playlist_1.VideoPlaylistModel.loadWithAccountAndChannel(playlist.id, null);
        if (playlistObject.icon) {
            try {
                const thumbnailModel = yield thumbnail_1.createPlaylistMiniatureFromUrl(playlistObject.icon.url, refreshedPlaylist);
                yield refreshedPlaylist.setAndSaveThumbnail(thumbnailModel, undefined);
            }
            catch (err) {
                logger_1.logger.warn('Cannot generate thumbnail of %s.', playlistObject.id, { err });
            }
        }
        else if (refreshedPlaylist.hasThumbnail()) {
            yield refreshedPlaylist.Thumbnail.destroy();
            refreshedPlaylist.Thumbnail = null;
        }
        return resetVideoPlaylistElements(accItems, refreshedPlaylist);
    });
}
exports.createOrUpdateVideoPlaylist = createOrUpdateVideoPlaylist;
function refreshVideoPlaylistIfNeeded(videoPlaylist) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!videoPlaylist.isOutdated())
            return videoPlaylist;
        try {
            const { statusCode, playlistObject } = yield fetchRemoteVideoPlaylist(videoPlaylist.url);
            if (statusCode === 404) {
                logger_1.logger.info('Cannot refresh remote video playlist %s: it does not exist anymore. Deleting it.', videoPlaylist.url);
                yield videoPlaylist.destroy();
                return undefined;
            }
            if (playlistObject === undefined) {
                logger_1.logger.warn('Cannot refresh remote playlist %s: invalid body.', videoPlaylist.url);
                yield videoPlaylist.setAsRefreshed();
                return videoPlaylist;
            }
            const byAccount = videoPlaylist.OwnerAccount;
            yield createOrUpdateVideoPlaylist(playlistObject, byAccount, playlistObject.to);
            return videoPlaylist;
        }
        catch (err) {
            logger_1.logger.warn('Cannot refresh video playlist %s.', videoPlaylist.url, { err });
            yield videoPlaylist.setAsRefreshed();
            return videoPlaylist;
        }
    });
}
exports.refreshVideoPlaylistIfNeeded = refreshVideoPlaylistIfNeeded;
function resetVideoPlaylistElements(elementUrls, playlist) {
    return __awaiter(this, void 0, void 0, function* () {
        const elementsToCreate = [];
        yield Bluebird.map(elementUrls, (elementUrl) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { body } = yield requests_1.doRequest({
                    uri: elementUrl,
                    json: true,
                    activityPub: true
                });
                if (!playlist_1.isPlaylistElementObjectValid(body))
                    throw new Error(`Invalid body in video get playlist element ${elementUrl}`);
                if (activitypub_1.checkUrlsSameHost(body.id, elementUrl) !== true) {
                    throw new Error(`Playlist element url ${elementUrl} host is different from the AP object id ${body.id}`);
                }
                const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: { id: body.url }, fetchType: 'only-video' });
                elementsToCreate.push(playlistElementObjectToDBAttributes(body, playlist, video));
            }
            catch (err) {
                logger_1.logger.warn('Cannot add playlist element %s.', elementUrl, { err });
            }
        }), { concurrency: constants_1.CRAWL_REQUEST_CONCURRENCY });
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            yield video_playlist_element_1.VideoPlaylistElementModel.deleteAllOf(playlist.id, t);
            for (const element of elementsToCreate) {
                yield video_playlist_element_1.VideoPlaylistElementModel.create(element, { transaction: t });
            }
        }));
        logger_1.logger.info('Reset playlist %s with %s elements.', playlist.url, elementsToCreate.length);
        return undefined;
    });
}
function fetchRemoteVideoPlaylist(playlistUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            uri: playlistUrl,
            method: 'GET',
            json: true,
            activityPub: true
        };
        logger_1.logger.info('Fetching remote playlist %s.', playlistUrl);
        const { response, body } = yield requests_1.doRequest(options);
        if (playlist_1.isPlaylistObjectValid(body) === false || activitypub_1.checkUrlsSameHost(body.id, playlistUrl) !== true) {
            logger_1.logger.debug('Remote video playlist JSON is not valid.', { body });
            return { statusCode: response.statusCode, playlistObject: undefined };
        }
        return { statusCode: response.statusCode, playlistObject: body };
    });
}
