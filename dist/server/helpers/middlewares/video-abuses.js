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
const video_abuse_1 = require("../../models/video/video-abuse");
const video_1 = require("../video");
function doesVideoAbuseExist(abuseIdArg, videoUUID, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
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
