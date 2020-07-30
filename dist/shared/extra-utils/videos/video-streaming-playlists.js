"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSegmentHash = exports.getSegmentSha256 = exports.getSegment = exports.getPlaylist = void 0;
const tslib_1 = require("tslib");
const requests_1 = require("../requests/requests");
const core_utils_1 = require("../../../server/helpers/core-utils");
const chai_1 = require("chai");
function getPlaylist(url, statusCodeExpected = 200) {
    return requests_1.makeRawRequest(url, statusCodeExpected);
}
exports.getPlaylist = getPlaylist;
function getSegment(url, statusCodeExpected = 200, range) {
    return requests_1.makeRawRequest(url, statusCodeExpected, range);
}
exports.getSegment = getSegment;
function getSegmentSha256(url, statusCodeExpected = 200) {
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
        const res2 = yield getSegment(`${baseUrlSegment}/${videoUUID}/${videoName}`, 206, `bytes=${range}`);
        const resSha = yield getSegmentSha256(hlsPlaylist.segmentsSha256Url);
        const sha256Server = resSha.body[videoName][range];
        chai_1.expect(core_utils_1.sha256(res2.body)).to.equal(sha256Server);
    });
}
exports.checkSegmentHash = checkSegmentHash;
