"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
const miscs_1 = require("../miscs/miscs");
function searchVideo(url, search) {
    const path = '/api/v1/search/videos';
    const query = { sort: '-publishedAt', search: search };
    const req = request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json');
    return req.expect(200)
        .expect('Content-Type', /json/);
}
exports.searchVideo = searchVideo;
function searchVideoWithToken(url, search, token, query = {}) {
    const path = '/api/v1/search/videos';
    const req = request(url)
        .get(path)
        .set('Authorization', 'Bearer ' + token)
        .query(miscs_1.immutableAssign(query, { sort: '-publishedAt', search }))
        .set('Accept', 'application/json');
    return req.expect(200)
        .expect('Content-Type', /json/);
}
exports.searchVideoWithToken = searchVideoWithToken;
function searchVideoWithSort(url, search, sort) {
    const path = '/api/v1/search/videos';
    const query = { search, sort };
    return request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);
}
exports.searchVideoWithSort = searchVideoWithSort;
function advancedVideosSearch(url, options) {
    const path = '/api/v1/search/videos';
    return request(url)
        .get(path)
        .query(options)
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/);
}
exports.advancedVideosSearch = advancedVideosSearch;
