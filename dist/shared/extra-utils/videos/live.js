"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testFfmpegStreamError = exports.sendRTMPStream = exports.waitFfmpegUntilError = exports.waitUntilLiveEnded = exports.sendRTMPStreamInVideo = exports.waitUntilLiveWaiting = exports.stopFfmpeg = exports.waitUntilLiveSegmentGeneration = exports.checkLiveCleanup = exports.runAndTestFfmpegStreamError = exports.createLive = exports.updateLive = exports.waitUntilLivePublished = exports.getPlaylistsCount = exports.getLive = void 0;
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const ffmpeg = require("fluent-ffmpeg");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const path_1 = require("path");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
const miscs_1 = require("../miscs/miscs");
const requests_1 = require("../requests/requests");
const servers_1 = require("../server/servers");
const videos_1 = require("./videos");
function getLive(url, token, videoId, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/videos/live';
    return requests_1.makeGetRequest({
        url,
        token,
        path: path + '/' + videoId,
        statusCodeExpected
    });
}
exports.getLive = getLive;
function updateLive(url, token, videoId, fields, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/live';
    return requests_1.makePutBodyRequest({
        url,
        token,
        path: path + '/' + videoId,
        fields,
        statusCodeExpected
    });
}
exports.updateLive = updateLive;
function createLive(url, token, fields, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/videos/live';
    const attaches = {};
    if (fields.thumbnailfile)
        attaches.thumbnailfile = fields.thumbnailfile;
    if (fields.previewfile)
        attaches.previewfile = fields.previewfile;
    const updatedFields = lodash_1.omit(fields, 'thumbnailfile', 'previewfile');
    return requests_1.makeUploadRequest({
        url,
        path,
        token,
        attaches,
        fields: updatedFields,
        statusCodeExpected
    });
}
exports.createLive = createLive;
function sendRTMPStreamInVideo(url, token, videoId, fixtureName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield getLive(url, token, videoId);
        const videoLive = res.body;
        return sendRTMPStream(videoLive.rtmpUrl, videoLive.streamKey, fixtureName);
    });
}
exports.sendRTMPStreamInVideo = sendRTMPStreamInVideo;
function sendRTMPStream(rtmpBaseUrl, streamKey, fixtureName = 'video_short.mp4') {
    const fixture = miscs_1.buildAbsoluteFixturePath(fixtureName);
    const command = ffmpeg(fixture);
    command.inputOption('-stream_loop -1');
    command.inputOption('-re');
    command.outputOption('-c:v libx264');
    command.outputOption('-g 50');
    command.outputOption('-keyint_min 2');
    command.outputOption('-r 60');
    command.outputOption('-f flv');
    const rtmpUrl = rtmpBaseUrl + '/' + streamKey;
    command.output(rtmpUrl);
    command.on('error', err => {
        var _a;
        if ((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes('Exiting normally'))
            return;
        if (process.env.DEBUG)
            console.error(err);
    });
    if (process.env.DEBUG) {
        command.on('stderr', data => console.log(data));
    }
    command.run();
    return command;
}
exports.sendRTMPStream = sendRTMPStream;
function waitFfmpegUntilError(command, successAfterMS = 10000) {
    return new Promise((res, rej) => {
        command.on('error', err => {
            return rej(err);
        });
        setTimeout(() => {
            res();
        }, successAfterMS);
    });
}
exports.waitFfmpegUntilError = waitFfmpegUntilError;
function runAndTestFfmpegStreamError(url, token, videoId, shouldHaveError) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const command = yield sendRTMPStreamInVideo(url, token, videoId);
        return testFfmpegStreamError(command, shouldHaveError);
    });
}
exports.runAndTestFfmpegStreamError = runAndTestFfmpegStreamError;
function testFfmpegStreamError(command, shouldHaveError) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let error;
        try {
            yield waitFfmpegUntilError(command, 25000);
        }
        catch (err) {
            error = err;
        }
        yield stopFfmpeg(command);
        if (shouldHaveError && !error)
            throw new Error('Ffmpeg did not have an error');
        if (!shouldHaveError && error)
            throw error;
    });
}
exports.testFfmpegStreamError = testFfmpegStreamError;
function stopFfmpeg(command) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        command.kill('SIGINT');
        yield miscs_1.wait(500);
    });
}
exports.stopFfmpeg = stopFfmpeg;
function waitUntilLivePublished(url, token, videoId) {
    return waitUntilLiveState(url, token, videoId, 1);
}
exports.waitUntilLivePublished = waitUntilLivePublished;
function waitUntilLiveWaiting(url, token, videoId) {
    return waitUntilLiveState(url, token, videoId, 4);
}
exports.waitUntilLiveWaiting = waitUntilLiveWaiting;
function waitUntilLiveEnded(url, token, videoId) {
    return waitUntilLiveState(url, token, videoId, 5);
}
exports.waitUntilLiveEnded = waitUntilLiveEnded;
function waitUntilLiveSegmentGeneration(server, videoUUID, resolutionNum, segmentNum) {
    const segmentName = `${resolutionNum}-00000${segmentNum}.ts`;
    return servers_1.waitUntilLog(server, `${videoUUID}/${segmentName}`, 2, false);
}
exports.waitUntilLiveSegmentGeneration = waitUntilLiveSegmentGeneration;
function waitUntilLiveState(url, token, videoId, state) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let video;
        do {
            const res = yield videos_1.getVideoWithToken(url, token, videoId);
            video = res.body;
            yield miscs_1.wait(500);
        } while (video.state.id !== state);
    });
}
function checkLiveCleanup(server, videoUUID, resolutions = []) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const basePath = miscs_1.buildServerDirectory(server, 'streaming-playlists');
        const hlsPath = path_1.join(basePath, 'hls', videoUUID);
        if (resolutions.length === 0) {
            const result = yield fs_extra_1.pathExists(hlsPath);
            chai_1.expect(result).to.be.false;
            return;
        }
        const files = yield fs_extra_1.readdir(hlsPath);
        chai_1.expect(files).to.have.lengthOf(resolutions.length * 2 + 2);
        for (const resolution of resolutions) {
            chai_1.expect(files).to.contain(`${videoUUID}-${resolution}-fragmented.mp4`);
            chai_1.expect(files).to.contain(`${resolution}.m3u8`);
        }
        chai_1.expect(files).to.contain('master.m3u8');
        chai_1.expect(files).to.contain('segments-sha256.json');
    });
}
exports.checkLiveCleanup = checkLiveCleanup;
function getPlaylistsCount(server, videoUUID) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const basePath = miscs_1.buildServerDirectory(server, 'streaming-playlists');
        const hlsPath = path_1.join(basePath, 'hls', videoUUID);
        const files = yield fs_extra_1.readdir(hlsPath);
        return files.filter(f => f.endsWith('.m3u8')).length;
    });
}
exports.getPlaylistsCount = getPlaylistsCount;
