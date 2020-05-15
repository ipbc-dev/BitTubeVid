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
const video_caption_1 = require("../../models/video/video-caption");
function doesVideoCaptionExist(video, language, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
