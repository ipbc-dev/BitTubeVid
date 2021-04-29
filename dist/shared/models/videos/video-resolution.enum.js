"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaxBitrate = exports.getTargetBitrate = void 0;
function getBaseBitrate(resolution) {
    if (resolution === 0) {
        return 64 * 1000;
    }
    if (resolution <= 240) {
        return 320 * 1000;
    }
    if (resolution <= 360) {
        return 780 * 1000;
    }
    if (resolution <= 480) {
        return 1500 * 1000;
    }
    if (resolution <= 720) {
        return 2800 * 1000;
    }
    if (resolution <= 1080) {
        return 5200 * 1000;
    }
    if (resolution <= 1440) {
        return 10000 * 1000;
    }
    return 22000 * 1000;
}
function getTargetBitrate(resolution, fps, fpsTranscodingConstants) {
    const baseBitrate = getBaseBitrate(resolution);
    const maxBitrate = baseBitrate * 1.4;
    const maxBitrateDifference = maxBitrate - baseBitrate;
    const maxFpsDifference = fpsTranscodingConstants.MAX - fpsTranscodingConstants.AVERAGE;
    return Math.floor(baseBitrate + (fps - fpsTranscodingConstants.AVERAGE) * (maxBitrateDifference / maxFpsDifference));
}
exports.getTargetBitrate = getTargetBitrate;
function getMaxBitrate(resolution, fps, fpsTranscodingConstants) {
    return getTargetBitrate(resolution, fps, fpsTranscodingConstants) * 2;
}
exports.getMaxBitrate = getMaxBitrate;
