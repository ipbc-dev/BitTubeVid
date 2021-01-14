"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesVideoBlacklistExist = void 0;
const tslib_1 = require("tslib");
const video_blacklist_1 = require("../../models/video/video-blacklist");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function doesVideoBlacklistExist(videoId, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoBlacklist = yield video_blacklist_1.VideoBlacklistModel.loadByVideoId(videoId);
        if (videoBlacklist === null) {
            res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404)
                .json({ error: 'Blacklisted video not found' })
                .end();
            return false;
        }
        res.locals.videoBlacklist = videoBlacklist;
        return true;
    });
}
exports.doesVideoBlacklistExist = doesVideoBlacklistExist;
