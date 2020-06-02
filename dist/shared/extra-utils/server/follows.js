"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
const jobs_1 = require("./jobs");
const requests_1 = require("../requests/requests");
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
        .expect(200)
        .expect('Content-Type', /json/);
}
exports.getFollowersListPaginationAndSort = getFollowersListPaginationAndSort;
function acceptFollower(url, token, follower, statusCodeExpected = 204) {
    const path = '/api/v1/server/followers/' + follower + '/accept';
    return requests_1.makePostBodyRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.acceptFollower = acceptFollower;
function rejectFollower(url, token, follower, statusCodeExpected = 204) {
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
        .expect(200)
        .expect('Content-Type', /json/);
}
exports.getFollowingListPaginationAndSort = getFollowingListPaginationAndSort;
function follow(follower, following, accessToken, expectedStatus = 204) {
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
function unfollow(url, accessToken, target, expectedStatus = 204) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = '/api/v1/server/following/' + target.host;
        return request(url)
            .delete(path)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + accessToken)
            .expect(expectedStatus);
    });
}
exports.unfollow = unfollow;
function removeFollower(url, accessToken, follower, expectedStatus = 204) {
    const path = '/api/v1/server/followers/peertube@' + follower.host;
    return request(url)
        .delete(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(expectedStatus);
}
exports.removeFollower = removeFollower;
function doubleFollow(server1, server2) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            follow(server1.url, [server2.url], server1.accessToken),
            follow(server2.url, [server1.url], server2.accessToken)
        ]);
        yield jobs_1.waitJobs([server1, server2]);
        return true;
    });
}
exports.doubleFollow = doubleFollow;
