"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaxBitrate = exports.getTargetBitrate = exports.VideoResolution = void 0;
var VideoResolution;
(function (VideoResolution) {
    VideoResolution[VideoResolution["H_NOVIDEO"] = 0] = "H_NOVIDEO";
    VideoResolution[VideoResolution["H_240P"] = 240] = "H_240P";
    VideoResolution[VideoResolution["H_360P"] = 360] = "H_360P";
    VideoResolution[VideoResolution["H_480P"] = 480] = "H_480P";
    VideoResolution[VideoResolution["H_720P"] = 720] = "H_720P";
    VideoResolution[VideoResolution["H_1080P"] = 1080] = "H_1080P";
    VideoResolution[VideoResolution["H_4K"] = 2160] = "H_4K";
})(VideoResolution = exports.VideoResolution || (exports.VideoResolution = {}));
function getBaseBitrate(resolution) {
    if (resolution === VideoResolution.H_NOVIDEO) {
        return 64 * 1000;
    }
    if (resolution <= VideoResolution.H_240P) {
        return 320 * 1000;
    }
    if (resolution <= VideoResolution.H_360P) {
        return 780 * 1000;
    }
    if (resolution <= VideoResolution.H_480P) {
        return 1500 * 1000;
    }
    if (resolution <= VideoResolution.H_720P) {
        return 2800 * 1000;
    }
    if (resolution <= VideoResolution.H_1080P) {
        return 5200 * 1000;
    }
    return 22000 * 1000;
}
function getTargetBitrate(resolution, fps, fpsTranscodingConstants) {
    const baseBitrate = getBaseBitrate(resolution);
    const maxBitrate = baseBitrate * 1.4;
    const maxBitrateDifference = maxBitrate - baseBitrate;
    const maxFpsDifference = fpsTranscodingConstants.MAX - fpsTranscodingConstants.AVERAGE;
    return baseBitrate + (fps - fpsTranscodingConstants.AVERAGE) * (maxBitrateDifference / maxFpsDifference);
}
exports.getTargetBitrate = getTargetBitrate;
function getMaxBitrate(resolution, fps, fpsTranscodingConstants) {
    return getTargetBitrate(resolution, fps, fpsTranscodingConstants) * 2;
}
exports.getMaxBitrate = getMaxBitrate;
