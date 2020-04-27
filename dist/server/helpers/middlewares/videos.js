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
const video_1 = require("../video");
const users_1 = require("../../../shared/models/users");
const video_channel_1 = require("../../models/video/video-channel");
function doesVideoExist(id, res, fetchType = 'all') {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = res.locals.oauth ? res.locals.oauth.token.User.id : undefined;
        const video = yield video_1.fetchVideo(id, fetchType, userId);
        if (video === null) {
            res.status(404)
                .json({ error: 'Video not found' })
                .end();
            return false;
        }
        switch (fetchType) {
            case 'all':
                res.locals.videoAll = video;
                break;
            case 'id':
                res.locals.videoId = video;
                break;
            case 'only-video':
                res.locals.onlyVideo = video;
                break;
            case 'only-video-with-rights':
                res.locals.onlyVideoWithRights = video;
                break;
        }
        return true;
    });
}
exports.doesVideoExist = doesVideoExist;
function doesVideoChannelOfAccountExist(channelId, user, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (user.hasRight(users_1.UserRight.UPDATE_ANY_VIDEO) === true) {
            const videoChannel = yield video_channel_1.VideoChannelModel.loadAndPopulateAccount(channelId);
            if (videoChannel === null) {
                res.status(400)
                    .json({ error: 'Unknown video `video channel` on this instance.' })
                    .end();
                return false;
            }
            res.locals.videoChannel = videoChannel;
            return true;
        }
        const videoChannel = yield video_channel_1.VideoChannelModel.loadByIdAndAccount(channelId, user.Account.id);
        if (videoChannel === null) {
            res.status(400)
                .json({ error: 'Unknown video `video channel` for this account.' })
                .end();
            return false;
        }
        res.locals.videoChannel = videoChannel;
        return true;
    });
}
exports.doesVideoChannelOfAccountExist = doesVideoChannelOfAccountExist;
function checkUserCanManageVideo(user, video, right, res) {
    if (video.isOwned() === false) {
        res.status(403)
            .json({ error: 'Cannot manage a video of another server.' })
            .end();
        return false;
    }
    const account = video.VideoChannel.Account;
    if (user.hasRight(right) === false && account.userId !== user.id) {
        res.status(403)
            .json({ error: 'Cannot manage a video of another user.' })
            .end();
        return false;
    }
    return true;
}
exports.checkUserCanManageVideo = checkUserCanManageVideo;
