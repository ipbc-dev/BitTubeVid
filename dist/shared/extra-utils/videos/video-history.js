"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMyVideosHistory = exports.listMyVideosHistory = exports.userWatchVideo = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function userWatchVideo(url, token, videoId, currentTime, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/' + videoId + '/watching';
    const fields = { currentTime };
    return requests_1.makePutBodyRequest({ url, path, token, fields, statusCodeExpected });
}
exports.userWatchVideo = userWatchVideo;
function listMyVideosHistory(url, token, search) {
    const path = '/api/v1/users/me/history/videos';
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query: {
            search
        },
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
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
        statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.removeMyVideosHistory = removeMyVideosHistory;