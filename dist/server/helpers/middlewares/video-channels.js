"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesVideoChannelNameWithHostExist = exports.doesVideoChannelIdExist = exports.doesLocalVideoChannelNameExist = void 0;
const tslib_1 = require("tslib");
const video_channel_1 = require("../../models/video/video-channel");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function doesLocalVideoChannelNameExist(name, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannel = yield video_channel_1.VideoChannelModel.loadLocalByNameAndPopulateAccount(name);
        return processVideoChannelExist(videoChannel, res);
    });
}
exports.doesLocalVideoChannelNameExist = doesLocalVideoChannelNameExist;
function doesVideoChannelIdExist(id, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannel = yield video_channel_1.VideoChannelModel.loadAndPopulateAccount(+id);
        return processVideoChannelExist(videoChannel, res);
    });
}
exports.doesVideoChannelIdExist = doesVideoChannelIdExist;
function doesVideoChannelNameWithHostExist(nameWithDomain, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoChannel = yield video_channel_1.VideoChannelModel.loadByNameWithHostAndPopulateAccount(nameWithDomain);
        return processVideoChannelExist(videoChannel, res);
    });
}
exports.doesVideoChannelNameWithHostExist = doesVideoChannelNameWithHostExist;
function processVideoChannelExist(videoChannel, res) {
    if (!videoChannel) {
        res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404)
            .json({ error: 'Video channel not found' })
            .end();
        return false;
    }
    res.locals.videoChannel = videoChannel;
    return true;
}
