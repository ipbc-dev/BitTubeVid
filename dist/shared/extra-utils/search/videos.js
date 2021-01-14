"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVideoWithSort = exports.searchVideoWithToken = exports.advancedVideosSearch = exports.searchVideo = void 0;
const request = require("supertest");
const miscs_1 = require("../miscs/miscs");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function searchVideo(url, search, sort = '-publishedAt') {
    const path = '/api/v1/search/videos';
    const query = { sort, search: search };
    const req = request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json');
    return req.expect(http_error_codes_1.HttpStatusCode.OK_200)
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
    return req.expect(http_error_codes_1.HttpStatusCode.OK_200)
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
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.searchVideoWithSort = searchVideoWithSort;
function advancedVideosSearch(url, options) {
    const path = '/api/v1/search/videos';
    return request(url)
        .get(path)
        .query(options)
        .set('Accept', 'application/json')
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.advancedVideosSearch = advancedVideosSearch;
