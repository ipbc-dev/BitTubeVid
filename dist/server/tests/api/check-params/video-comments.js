"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
describe('Test video comments API validator', function () {
    let pathThread;
    let pathComment;
    let server;
    let videoUUID;
    let userAccessToken;
    let userAccessToken2;
    let commentId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, {});
                videoUUID = res.body.video.uuid;
                pathThread = '/api/v1/videos/' + videoUUID + '/comment-threads';
            }
            {
                const res = yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, videoUUID, 'coucou');
                commentId = res.body.comment.id;
                pathComment = '/api/v1/videos/' + videoUUID + '/comments/' + commentId;
            }
            {
                const user = { username: 'user1', password: 'my super password' };
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                userAccessToken = yield extra_utils_1.userLogin(server, user);
            }
            {
                const user = { username: 'user2', password: 'my super password' };
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                userAccessToken2 = yield extra_utils_1.userLogin(server, user);
            }
        });
    });
    describe('When listing video comment threads', function () {
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, pathThread, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, pathThread, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, pathThread, server.accessToken);
            });
        });
        it('Should fail with an incorrect video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/api/v1/videos/ba708d62-e3d7-45d9-9d73-41b9097cc02d/comment-threads',
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
    });
    describe('When listing comments of a thread', function () {
        it('Should fail with an incorrect video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/api/v1/videos/ba708d62-e3d7-45d9-9d73-41b9097cc02d/comment-threads/' + commentId,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail with an incorrect thread id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/api/v1/videos/' + videoUUID + '/comment-threads/156',
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should success with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/api/v1/videos/' + videoUUID + '/comment-threads/' + commentId,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
            });
        });
    });
    describe('When adding a video thread', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: 'text'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: pathThread,
                    token: 'none',
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: pathThread, token: server.accessToken, fields });
            });
        });
        it('Should fail with a short comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: ''
                };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: pathThread, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: 'h'.repeat(10001)
                };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: pathThread, token: server.accessToken, fields });
            });
        });
        it('Should fail with an incorrect video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/ba708d62-e3d7-45d9-9d73-41b9097cc02d/comment-threads';
                const fields = {
                    text: 'super comment'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: 'super comment'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: pathThread,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
            });
        });
    });
    describe('When adding a comment to a thread', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: 'text'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: pathComment,
                    token: 'none',
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: pathComment, token: server.accessToken, fields });
            });
        });
        it('Should fail with a short comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: ''
                };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: pathComment, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: 'h'.repeat(10001)
                };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: pathComment, token: server.accessToken, fields });
            });
        });
        it('Should fail with an incorrect video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/ba708d62-e3d7-45d9-9d73-41b9097cc02d/comments/' + commentId;
                const fields = {
                    text: 'super comment'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail with an incorrect comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/' + videoUUID + '/comments/124';
                const fields = {
                    text: 'super comment'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: 'super comment'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: pathComment,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
            });
        });
    });
    describe('When removing video comments', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path: pathComment, token: 'none', statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail with another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: pathComment,
                    token: userAccessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should fail with an incorrect video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/ba708d62-e3d7-45d9-9d73-41b9097cc02d/comments/' + commentId;
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path, token: server.accessToken, statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
            });
        });
        it('Should fail with an incorrect comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/' + videoUUID + '/comments/124';
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path, token: server.accessToken, statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
            });
        });
        it('Should succeed with the same user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                let commentToDelete;
                {
                    const res = yield video_comments_1.addVideoCommentThread(server.url, userAccessToken, videoUUID, 'hello');
                    commentToDelete = res.body.comment.id;
                }
                const path = '/api/v1/videos/' + videoUUID + '/comments/' + commentToDelete;
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path, token: userAccessToken2, statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path, token: userAccessToken, statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204 });
            });
        });
        it('Should succeed with the owner of the video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                let commentToDelete;
                let anotherVideoUUID;
                {
                    const res = yield extra_utils_1.uploadVideo(server.url, userAccessToken, { name: 'video' });
                    anotherVideoUUID = res.body.video.uuid;
                }
                {
                    const res = yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, anotherVideoUUID, 'hello');
                    commentToDelete = res.body.comment.id;
                }
                const path = '/api/v1/videos/' + anotherVideoUUID + '/comments/' + commentToDelete;
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path, token: userAccessToken2, statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path, token: userAccessToken, statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204 });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: pathComment,
                    token: server.accessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
                });
            });
        });
    });
    describe('When a video has comments disabled', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, { commentsEnabled: false });
                videoUUID = res.body.video.uuid;
                pathThread = '/api/v1/videos/' + videoUUID + '/comment-threads';
            });
        });
        it('Should return an empty thread list', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: pathThread,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.have.lengthOf(0);
            });
        });
        it('Should return an thread comments list');
        it('Should return conflict on thread add', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    text: 'super comment'
                };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: pathThread,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.CONFLICT_409
                });
            });
        });
        it('Should return conflict on comment thread add');
    });
    describe('When listing admin comments threads', function () {
        const path = '/api/v1/videos/comments';
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query: {
                        isLocal: false,
                        search: 'toto',
                        searchAccount: 'toto',
                        searchVideo: 'toto'
                    },
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
