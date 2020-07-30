"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuseChangeOwnership = exports.acceptChangeOwnership = exports.getVideoChangeOwnershipList = exports.changeVideoOwnership = void 0;
const request = require("supertest");
function changeVideoOwnership(url, token, videoId, username, expectedStatus = 204) {
    const path = '/api/v1/videos/' + videoId + '/give-ownership';
    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send({ username })
        .expect(expectedStatus);
}
exports.changeVideoOwnership = changeVideoOwnership;
function getVideoChangeOwnershipList(url, token) {
    const path = '/api/v1/videos/ownership';
    return request(url)
        .get(path)
        .query({ sort: '-createdAt' })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
        .expect('Content-Type', /json/);
}
exports.getVideoChangeOwnershipList = getVideoChangeOwnershipList;
function acceptChangeOwnership(url, token, ownershipId, channelId, expectedStatus = 204) {
    const path = '/api/v1/videos/ownership/' + ownershipId + '/accept';
    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send({ channelId })
        .expect(expectedStatus);
}
exports.acceptChangeOwnership = acceptChangeOwnership;
function refuseChangeOwnership(url, token, ownershipId, expectedStatus = 204) {
    const path = '/api/v1/videos/ownership/' + ownershipId + '/refuse';
    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedStatus);
}
exports.refuseChangeOwnership = refuseChangeOwnership;
