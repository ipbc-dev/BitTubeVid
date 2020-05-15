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
function doesVideoAbuseExist(abuseIdArg, videoId, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const abuseId = parseInt(abuseIdArg + '', 10);
        const videoAbuse = yield video_abuse_1.VideoAbuseModel.loadByIdAndVideoId(abuseId, videoId);
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
