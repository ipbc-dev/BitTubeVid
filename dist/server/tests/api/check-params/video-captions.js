"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const path_1 = require("path");
const video_captions_1 = require("../../../../shared/extra-utils/videos/video-captions");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test video captions API validator', function () {
    const path = '/api/v1/videos/';
    let server;
    let userAccessToken;
    let videoUUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, {});
                videoUUID = res.body.video.uuid;
            }
            {
                const user = {
                    username: 'user1',
                    password: 'my super password'
                };
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                userAccessToken = yield extra_utils_1.userLogin(server, user);
            }
        });
    });
    describe('When adding video caption', function () {
        const fields = {};
        const attaches = {
            captionfile: path_1.join(__dirname, '..', '..', 'fixtures', 'subtitle-good1.vtt')
        };
        it('Should fail without a valid uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeUploadRequest({
                    method: 'PUT',
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df563d0b06/captions/fr',
                    token: server.accessToken,
                    fields,
                    attaches
                });
            });
        });
        it('Should fail with an unknown id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeUploadRequest({
                    method: 'PUT',
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df5630b06/captions/fr',
                    token: server.accessToken,
                    fields,
                    attaches,
                    statusCodeExpected: 404
                });
            });
        });
        it('Should fail with a missing language in path', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions';
                yield extra_utils_1.makeUploadRequest({
                    method: 'PUT',
                    url: server.url,
                    path: captionPath,
                    token: server.accessToken,
                    fields,
                    attaches
                });
            });
        });
        it('Should fail with an unknown language', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/15';
                yield extra_utils_1.makeUploadRequest({
                    method: 'PUT',
                    url: server.url,
                    path: captionPath,
                    token: server.accessToken,
                    fields,
                    attaches
                });
            });
        });
        it('Should fail without access token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/fr';
                yield extra_utils_1.makeUploadRequest({
                    method: 'PUT',
                    url: server.url,
                    path: captionPath,
                    fields,
                    attaches,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should fail with a bad access token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/fr';
                yield extra_utils_1.makeUploadRequest({
                    method: 'PUT',
                    url: server.url,
                    path: captionPath,
                    token: 'blabla',
                    fields,
                    attaches,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should succeed with a valid captionfile extension and octet-stream mime type', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield video_captions_1.createVideoCaption({
                    url: server.url,
                    accessToken: server.accessToken,
                    language: 'zh',
                    videoId: videoUUID,
                    fixture: 'subtitle-good.srt',
                    mimeType: 'application/octet-stream'
                });
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/fr';
                yield extra_utils_1.makeUploadRequest({
                    method: 'PUT',
                    url: server.url,
                    path: captionPath,
                    token: server.accessToken,
                    fields,
                    attaches,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
                });
            });
        });
    });
    describe('When listing video captions', function () {
        it('Should fail without a valid uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path: path + '4da6fde3-88f7-4d16-b119-108df563d0b06/captions' });
            });
        });
        it('Should fail with an unknown id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df5630b06/captions',
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path: path + videoUUID + '/captions', statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200 });
            });
        });
    });
    describe('When deleting video caption', function () {
        it('Should fail without a valid uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df563d0b06/captions/fr',
                    token: server.accessToken
                });
            });
        });
        it('Should fail with an unknown id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df5630b06/captions/fr',
                    token: server.accessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail with an invalid language', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df5630b06/captions/16',
                    token: server.accessToken
                });
            });
        });
        it('Should fail with a missing language', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions';
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path: captionPath, token: server.accessToken });
            });
        });
        it('Should fail with an unknown language', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/15';
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path: captionPath, token: server.accessToken });
            });
        });
        it('Should fail without access token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/fr';
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path: captionPath, statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail with a bad access token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/fr';
                yield extra_utils_1.makeDeleteRequest({ url: server.url, path: captionPath, token: 'coucou', statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail with another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/fr';
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: captionPath,
                    token: userAccessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const captionPath = path + videoUUID + '/captions/fr';
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: captionPath,
                    token: server.accessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
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
