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
const video_playlist_1 = require("../models/video/video-playlist");
const video_playlist_privacy_model_1 = require("../../shared/models/videos/playlist/video-playlist-privacy.model");
const activitypub_1 = require("./activitypub");
const video_playlist_type_model_1 = require("../../shared/models/videos/playlist/video-playlist-type.model");
function createWatchLaterPlaylist(account, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoPlaylist = new video_playlist_1.VideoPlaylistModel({
            name: 'Watch later',
            privacy: video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE,
            type: video_playlist_type_model_1.VideoPlaylistType.WATCH_LATER,
            ownerAccountId: account.id
        });
        videoPlaylist.url = activitypub_1.getVideoPlaylistActivityPubUrl(videoPlaylist);
        yield videoPlaylist.save({ transaction: t });
        videoPlaylist.OwnerAccount = account;
        return videoPlaylist;
    });
}
exports.createWatchLaterPlaylist = createWatchLaterPlaylist;
