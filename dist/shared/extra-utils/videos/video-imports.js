"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoodVideoUrl = exports.getMyVideoImports = exports.getMagnetURI = exports.importVideo = exports.getYoutubeHDRVideoUrl = exports.getYoutubeVideoUrl = exports.getBadVideoUrl = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getYoutubeVideoUrl() {
    return 'https://www.youtube.com/watch?v=msX3jv1XdvM';
}
exports.getYoutubeVideoUrl = getYoutubeVideoUrl;
function getYoutubeHDRVideoUrl() {
    return 'https://www.youtube.com/watch?v=qR5vOXbZsI4';
}
exports.getYoutubeHDRVideoUrl = getYoutubeHDRVideoUrl;
function getMagnetURI() {
    return 'magnet:?xs=https%3A%2F%2Fpeertube2.cpy.re%2Fstatic%2Ftorrents%2Fb209ca00-c8bb-4b2b-b421-1ede169f3dbc-720.torrent&xt=urn:btih:0f498834733e8057ed5c6f2ee2b4efd8d84a76ee&dn=super+peertube2+video&tr=wss%3A%2F%2Fpeertube2.cpy.re%3A443%2Ftracker%2Fsocket&tr=https%3A%2F%2Fpeertube2.cpy.re%2Ftracker%2Fannounce&ws=https%3A%2F%2Fpeertube2.cpy.re%2Fstatic%2Fwebseed%2Fb209ca00-c8bb-4b2b-b421-1ede169f3dbc-720.mp4';
}
exports.getMagnetURI = getMagnetURI;
function getBadVideoUrl() {
    return 'https://download.cpy.re/peertube/bad_video.mp4';
}
exports.getBadVideoUrl = getBadVideoUrl;
function getGoodVideoUrl() {
    return 'https://download.cpy.re/peertube/good_video.mp4';
}
exports.getGoodVideoUrl = getGoodVideoUrl;
function importVideo(url, token, attributes, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/videos/imports';
    let attaches = {};
    if (attributes.torrentfile)
        attaches = { torrentfile: attributes.torrentfile };
    return requests_1.makeUploadRequest({
        url,
        path,
        token,
        attaches,
        fields: attributes,
        statusCodeExpected
    });
}
exports.importVideo = importVideo;
function getMyVideoImports(url, token, sort) {
    const path = '/api/v1/users/me/videos/imports';
    const query = {};
    if (sort)
        query['sort'] = sort;
    return requests_1.makeGetRequest({
        url,
        query,
        path,
        token,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getMyVideoImports = getMyVideoImports;
