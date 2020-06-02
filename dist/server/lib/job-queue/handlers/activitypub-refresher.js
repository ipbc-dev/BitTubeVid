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
const logger_1 = require("../../../helpers/logger");
const video_1 = require("../../../helpers/video");
const actor_1 = require("../../activitypub/actor");
const videos_1 = require("../../activitypub/videos");
const actor_2 = require("../../../models/activitypub/actor");
const video_playlist_1 = require("../../../models/video/video-playlist");
const playlist_1 = require("@server/lib/activitypub/playlist");
function refreshAPObject(job) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        logger_1.logger.info('Processing AP refresher in job %d for %s.', job.id, payload.url);
        if (payload.type === 'video')
            return refreshVideo(payload.url);
        if (payload.type === 'video-playlist')
            return refreshVideoPlaylist(payload.url);
        if (payload.type === 'actor')
            return refreshActor(payload.url);
    });
}
exports.refreshAPObject = refreshAPObject;
function refreshVideo(videoUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchType = 'all';
        const syncParam = { likes: true, dislikes: true, shares: true, comments: true, thumbnail: true };
        const videoFromDatabase = yield video_1.fetchVideoByUrl(videoUrl, fetchType);
        if (videoFromDatabase) {
            const refreshOptions = {
                video: videoFromDatabase,
                fetchedType: fetchType,
                syncParam
            };
            yield videos_1.refreshVideoIfNeeded(refreshOptions);
        }
    });
}
function refreshActor(actorUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchType = 'all';
        const actor = yield actor_2.ActorModel.loadByUrlAndPopulateAccountAndChannel(actorUrl);
        if (actor) {
            yield actor_1.refreshActorIfNeeded(actor, fetchType);
        }
    });
}
function refreshVideoPlaylist(playlistUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const playlist = yield video_playlist_1.VideoPlaylistModel.loadByUrlAndPopulateAccount(playlistUrl);
        if (playlist) {
            yield playlist_1.refreshVideoPlaylistIfNeeded(playlist);
        }
    });
}
