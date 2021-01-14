"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectFollower = exports.acceptFollower = exports.doubleFollow = exports.follow = exports.removeFollower = exports.unfollow = exports.getFollowingListPaginationAndSort = exports.getFollowersListPaginationAndSort = void 0;
const tslib_1 = require("tslib");
const request = require("supertest");
const jobs_1 = require("./jobs");
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getFollowersListPaginationAndSort(options) {
    const { url, start, count, sort, search, state, actorType } = options;
    const path = '/api/v1/server/followers';
    const query = {
        start,
        count,
        sort,
        search,
        state,
        actorType
    };
    return request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json')
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getFollowersListPaginationAndSort = getFollowersListPaginationAndSort;
function acceptFollower(url, token, follower, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/server/followers/' + follower + '/accept';
    return requests_1.makePostBodyRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.acceptFollower = acceptFollower;
function rejectFollower(url, token, follower, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/server/followers/' + follower + '/reject';
    return requests_1.makePostBodyRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.rejectFollower = rejectFollower;
function getFollowingListPaginationAndSort(options) {
    const { url, start, count, sort, search, state, actorType } = options;
    const path = '/api/v1/server/following';
    const query = {
        start,
        count,
        sort,
        search,
        state,
        actorType
    };
    return request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json')
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getFollowingListPaginationAndSort = getFollowingListPaginationAndSort;
function follow(follower, following, accessToken, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/server/following';
    const followingHosts = following.map(f => f.replace(/^http:\/\//, ''));
    return request(follower)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({ hosts: followingHosts })
        .expect(expectedStatus);
}
exports.follow = follow;
function unfollow(url, accessToken, target, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const path = '/api/v1/server/following/' + target.host;
        return request(url)
            .delete(path)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + accessToken)
            .expect(expectedStatus);
    });
}
exports.unfollow = unfollow;
function removeFollower(url, accessToken, follower, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/server/followers/peertube@' + follower.host;
    return request(url)
        .delete(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(expectedStatus);
}
exports.removeFollower = removeFollower;
function doubleFollow(server1, server2) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            follow(server1.url, [server2.url], server1.accessToken),
            follow(server2.url, [server1.url], server2.accessToken)
        ]);
        yield jobs_1.waitJobs([server1, server2]);
        return true;
    });
}
exports.doubleFollow = doubleFollow;
