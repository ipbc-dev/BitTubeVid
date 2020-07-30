"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesVideoCaptionExist = void 0;
const tslib_1 = require("tslib");
const video_caption_1 = require("../../models/video/video-caption");
function doesVideoCaptionExist(video, language, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoCaption = yield video_caption_1.VideoCaptionModel.loadByVideoIdAndLanguage(video.id, language);
        if (!videoCaption) {
            res.status(404)
                .json({ error: 'Video caption not found' })
                .end();
            return false;
        }
        res.locals.videoCaption = videoCaption;
        return true;
    });
}
exports.doesVideoCaptionExist = doesVideoCaptionExist;
