"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideoComment = exports.findCommentId = exports.addVideoCommentReply = exports.addVideoCommentThread = exports.getVideoThreadComments = exports.getVideoCommentThreads = void 0;
const tslib_1 = require("tslib");
const request = require("supertest");
const requests_1 = require("../requests/requests");
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
        .expect(200)
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
    return req.expect(200)
        .expect('Content-Type', /json/);
}
exports.getVideoThreadComments = getVideoThreadComments;
function addVideoCommentThread(url, token, videoId, text, expectedStatus = 200) {
    const path = '/api/v1/videos/' + videoId + '/comment-threads';
    return request(url)
        .post(path)
        .send({ text })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedStatus);
}
exports.addVideoCommentThread = addVideoCommentThread;
function addVideoCommentReply(url, token, videoId, inReplyToCommentId, text, expectedStatus = 200) {
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
function deleteVideoComment(url, token, videoId, commentId, statusCodeExpected = 204) {
    const path = '/api/v1/videos/' + videoId + '/comments/' + commentId;
    return requests_1.makeDeleteRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.deleteVideoComment = deleteVideoComment;
