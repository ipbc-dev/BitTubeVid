"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideoComment = exports.findCommentId = exports.addVideoCommentReply = exports.addVideoCommentThread = exports.getVideoThreadComments = exports.getAdminVideoComments = exports.getVideoCommentThreads = void 0;
const tslib_1 = require("tslib");
const request = require("supertest");
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getAdminVideoComments(options) {
    const { url, token, start, count, sort, isLocal, search, searchAccount, searchVideo } = options;
    const path = '/api/v1/videos/comments';
    const query = {
        start,
        count,
        sort: sort || '-createdAt'
    };
    if (isLocal !== undefined)
        Object.assign(query, { isLocal });
    if (search !== undefined)
        Object.assign(query, { search });
    if (searchAccount !== undefined)
        Object.assign(query, { searchAccount });
    if (searchVideo !== undefined)
        Object.assign(query, { searchVideo });
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getAdminVideoComments = getAdminVideoComments;
function getVideoCommentThreads(url, videoId, start, count, sort, token) {
    const path = '/api/v1/videos/' + videoId + '/comment-threads';
    const req = request(url)
        .get(path)
        .query({ start: start })
        .query({ count: count });
    if (sort)
        req.query({ sort });
    if (token)
        req.set('Authorization', 'Bearer ' + token);
    return req.set('Accept', 'application/json')
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getVideoCommentThreads = getVideoCommentThreads;
function getVideoThreadComments(url, videoId, threadId, token) {
    const path = '/api/v1/videos/' + videoId + '/comment-threads/' + threadId;
    const req = request(url)
        .get(path)
        .set('Accept', 'application/json');
    if (token)
        req.set('Authorization', 'Bearer ' + token);
    return req.expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getVideoThreadComments = getVideoThreadComments;
function addVideoCommentThread(url, token, videoId, text, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/videos/' + videoId + '/comment-threads';
    return request(url)
        .post(path)
        .send({ text })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedStatus);
}
exports.addVideoCommentThread = addVideoCommentThread;
function addVideoCommentReply(url, token, videoId, inReplyToCommentId, text, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/videos/' + videoId + '/comments/' + inReplyToCommentId;
    return request(url)
        .post(path)
        .send({ text })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedStatus);
}
exports.addVideoCommentReply = addVideoCommentReply;
function findCommentId(url, videoId, text) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield getVideoCommentThreads(url, videoId, 0, 25, '-createdAt');
        return res.body.data.find(c => c.text === text).id;
    });
}
exports.findCommentId = findCommentId;
function deleteVideoComment(url, token, videoId, commentId, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/videos/' + videoId + '/comments/' + commentId;
    return requests_1.makeDeleteRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.deleteVideoComment = deleteVideoComment;
