"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuseChangeOwnership = exports.acceptChangeOwnership = exports.getVideoChangeOwnershipList = exports.changeVideoOwnership = void 0;
const request = require("supertest");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function changeVideoOwnership(url, token, videoId, username, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
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
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getVideoChangeOwnershipList = getVideoChangeOwnershipList;
function acceptChangeOwnership(url, token, ownershipId, channelId, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/ownership/' + ownershipId + '/accept';
    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send({ channelId })
        .expect(expectedStatus);
}
exports.acceptChangeOwnership = acceptChangeOwnership;
function refuseChangeOwnership(url, token, ownershipId, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/ownership/' + ownershipId + '/refuse';
    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedStatus);
}
exports.refuseChangeOwnership = refuseChangeOwnership;
