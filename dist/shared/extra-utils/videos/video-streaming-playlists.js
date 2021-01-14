"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSegmentHash = exports.checkLiveSegmentHash = exports.getSegmentSha256 = exports.checkResolutionsInMasterPlaylist = exports.getSegment = exports.getPlaylist = void 0;
const tslib_1 = require("tslib");
const requests_1 = require("../requests/requests");
const core_utils_1 = require("../../../server/helpers/core-utils");
const chai_1 = require("chai");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getPlaylist(url, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    return requests_1.makeRawRequest(url, statusCodeExpected);
}
exports.getPlaylist = getPlaylist;
function getSegment(url, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200, range) {
    return requests_1.makeRawRequest(url, statusCodeExpected, range);
}
exports.getSegment = getSegment;
function getSegmentSha256(url, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    return requests_1.makeRawRequest(url, statusCodeExpected);
}
exports.getSegmentSha256 = getSegmentSha256;
function checkSegmentHash(baseUrlPlaylist, baseUrlSegment, videoUUID, resolution, hlsPlaylist) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield getPlaylist(`${baseUrlPlaylist}/${videoUUID}/${resolution}.m3u8`);
        const playlist = res.text;
        const videoName = `${videoUUID}-${resolution}-fragmented.mp4`;
        const matches = /#EXT-X-BYTERANGE:(\d+)@(\d+)/.exec(playlist);
        const length = parseInt(matches[1], 10);
        const offset = parseInt(matches[2], 10);
        const range = `${offset}-${offset + length - 1}`;
        const res2 = yield getSegment(`${baseUrlSegment}/${videoUUID}/${videoName}`, http_error_codes_1.HttpStatusCode.PARTIAL_CONTENT_206, `bytes=${range}`);
        const resSha = yield getSegmentSha256(hlsPlaylist.segmentsSha256Url);
        const sha256Server = resSha.body[videoName][range];
        chai_1.expect(core_utils_1.sha256(res2.body)).to.equal(sha256Server);
    });
}
exports.checkSegmentHash = checkSegmentHash;
function checkLiveSegmentHash(baseUrlSegment, videoUUID, segmentName, hlsPlaylist) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res2 = yield getSegment(`${baseUrlSegment}/${videoUUID}/${segmentName}`);
        const resSha = yield getSegmentSha256(hlsPlaylist.segmentsSha256Url);
        const sha256Server = resSha.body[segmentName];
        chai_1.expect(core_utils_1.sha256(res2.body)).to.equal(sha256Server);
    });
}
exports.checkLiveSegmentHash = checkLiveSegmentHash;
function checkResolutionsInMasterPlaylist(playlistUrl, resolutions) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield getPlaylist(playlistUrl);
        const masterPlaylist = res.text;
        for (const resolution of resolutions) {
            const reg = new RegExp('#EXT-X-STREAM-INF:BANDWIDTH=\\d+,RESOLUTION=\\d+x' + resolution + ',(FRAME-RATE=\\d+,)?CODECS="avc1.64001f,mp4a.40.2"');
            chai_1.expect(masterPlaylist).to.match(reg);
        }
    });
}
exports.checkResolutionsInMasterPlaylist = checkResolutionsInMasterPlaylist;
