"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
const __1 = require("..");
function addVideoToBlacklist(url, token, videoId, reason, unfederate, specialStatus = 204) {
    const path = '/api/v1/videos/' + videoId + '/blacklist';
    return request(url)
        .post(path)
        .send({ reason, unfederate })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(specialStatus);
}
exports.addVideoToBlacklist = addVideoToBlacklist;
function updateVideoBlacklist(url, token, videoId, reason, specialStatus = 204) {
    const path = '/api/v1/videos/' + videoId + '/blacklist';
    return request(url)
        .put(path)
        .send({ reason })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(specialStatus);
}
exports.updateVideoBlacklist = updateVideoBlacklist;
function removeVideoFromBlacklist(url, token, videoId, specialStatus = 204) {
    const path = '/api/v1/videos/' + videoId + '/blacklist';
    return request(url)
        .delete(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(specialStatus);
}
exports.removeVideoFromBlacklist = removeVideoFromBlacklist;
function getBlacklistedVideosList(parameters) {
    let { url, token, sort, type, specialStatus = 200 } = parameters;
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
