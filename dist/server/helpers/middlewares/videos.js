"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserCanManageVideo = exports.doesVideoFileOfVideoExist = exports.doesVideoExist = exports.doesVideoChannelOfAccountExist = void 0;
const tslib_1 = require("tslib");
const video_1 = require("../video");
const users_1 = require("../../../shared/models/users");
const video_channel_1 = require("../../models/video/video-channel");
const video_file_1 = require("@server/models/video/video-file");
function doesVideoExist(id, res, fetchType = 'all') {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
            case 'only-immutable-attributes':
                res.locals.onlyImmutableVideo = video;
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
function doesVideoFileOfVideoExist(id, videoIdOrUUID, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!(yield video_file_1.VideoFileModel.doesVideoExistForVideoFile(id, videoIdOrUUID))) {
            res.status(404)
                .json({ error: 'VideoFile matching Video not found' })
                .end();
            return false;
        }
        return true;
    });
}
exports.doesVideoFileOfVideoExist = doesVideoFileOfVideoExist;
function doesVideoChannelOfAccountExist(channelId, user, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
