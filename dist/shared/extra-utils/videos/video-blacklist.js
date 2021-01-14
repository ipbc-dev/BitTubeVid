"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVideoBlacklist = exports.getBlacklistedVideosList = exports.removeVideoFromBlacklist = exports.addVideoToBlacklist = void 0;
const request = require("supertest");
const __1 = require("..");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function addVideoToBlacklist(url, token, videoId, reason, unfederate, specialStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/' + videoId + '/blacklist';
    return request(url)
        .post(path)
        .send({ reason, unfederate })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(specialStatus);
}
exports.addVideoToBlacklist = addVideoToBlacklist;
function updateVideoBlacklist(url, token, videoId, reason, specialStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/' + videoId + '/blacklist';
    return request(url)
        .put(path)
        .send({ reason })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(specialStatus);
}
exports.updateVideoBlacklist = updateVideoBlacklist;
function removeVideoFromBlacklist(url, token, videoId, specialStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/' + videoId + '/blacklist';
    return request(url)
        .delete(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(specialStatus);
}
exports.removeVideoFromBlacklist = removeVideoFromBlacklist;
function getBlacklistedVideosList(parameters) {
    const { url, token, sort, type, specialStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
    const path = '/api/v1/videos/blacklist/';
    const query = { sort, type };
    return __1.makeGetRequest({
        url,
        path,
        query,
        token,
        statusCodeExpected: specialStatus
    });
}
exports.getBlacklistedVideosList = getBlacklistedVideosList;
