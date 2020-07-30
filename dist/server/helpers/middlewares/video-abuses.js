"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesVideoAbuseExist = void 0;
const tslib_1 = require("tslib");
const video_abuse_1 = require("../../models/video/video-abuse");
const video_1 = require("../video");
function doesVideoAbuseExist(abuseIdArg, videoUUID, res) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuseId = parseInt(abuseIdArg + '', 10);
        let videoAbuse = yield video_abuse_1.VideoAbuseModel.loadByIdAndVideoId(abuseId, null, videoUUID);
        if (!videoAbuse) {
            const userId = (_a = res.locals.oauth) === null || _a === void 0 ? void 0 : _a.token.User.id;
            const video = yield video_1.fetchVideo(videoUUID, 'all', userId);
            if (video)
                videoAbuse = yield video_abuse_1.VideoAbuseModel.loadByIdAndVideoId(abuseId, video.id);
        }
        if (videoAbuse === null) {
            res.status(404)
                .json({ error: 'Video abuse not found' })
                .end();
            return false;
        }
        res.locals.videoAbuse = videoAbuse;
        return true;
    });
}
exports.doesVideoAbuseExist = doesVideoAbuseExist;
