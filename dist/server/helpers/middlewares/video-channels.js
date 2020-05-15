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
const video_channel_1 = require("../../models/video/video-channel");
function doesLocalVideoChannelNameExist(name, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoChannel = yield video_channel_1.VideoChannelModel.loadLocalByNameAndPopulateAccount(name);
        return processVideoChannelExist(videoChannel, res);
    });
}
exports.doesLocalVideoChannelNameExist = doesLocalVideoChannelNameExist;
function doesVideoChannelIdExist(id, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoChannel = yield video_channel_1.VideoChannelModel.loadAndPopulateAccount(+id);
        return processVideoChannelExist(videoChannel, res);
    });
}
exports.doesVideoChannelIdExist = doesVideoChannelIdExist;
function doesVideoChannelNameWithHostExist(nameWithDomain, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoChannel = yield video_channel_1.VideoChannelModel.loadByNameWithHostAndPopulateAccount(nameWithDomain);
        return processVideoChannelExist(videoChannel, res);
    });
}
exports.doesVideoChannelNameWithHostExist = doesVideoChannelNameWithHostExist;
function processVideoChannelExist(videoChannel, res) {
    if (!videoChannel) {
        res.status(404)
            .json({ error: 'Video channel not found' })
            .end();
        return false;
    }
    res.locals.videoChannel = videoChannel;
    return true;
}
