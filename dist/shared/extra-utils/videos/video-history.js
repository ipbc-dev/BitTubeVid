"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_1 = require("../requests/requests");
function userWatchVideo(url, token, videoId, currentTime, statusCodeExpected = 204) {
    const path = '/api/v1/videos/' + videoId + '/watching';
    const fields = { currentTime };
    return requests_1.makePutBodyRequest({ url, path, token, fields, statusCodeExpected });
}
exports.userWatchVideo = userWatchVideo;
function listMyVideosHistory(url, token) {
    const path = '/api/v1/users/me/history/videos';
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        statusCodeExpected: 200
    });
}
exports.listMyVideosHistory = listMyVideosHistory;
function removeMyVideosHistory(url, token, beforeDate) {
    const path = '/api/v1/users/me/history/videos/remove';
    return requests_1.makePostBodyRequest({
        url,
        path,
        token,
        fields: beforeDate ? { beforeDate } : {},
        statusCodeExpected: 204
    });
}
exports.removeMyVideosHistory = removeMyVideosHistory;
