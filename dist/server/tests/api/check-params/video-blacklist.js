"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const chai_1 = require("chai");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test video blacklist API validators', function () {
    let servers;
    let notBlacklistedVideoId;
    let remoteVideoUUID;
    let userAccessToken1 = '';
    let userAccessToken2 = '';
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            {
                const username = 'user1';
                const password = 'my super password';
                yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: username, password: password });
                userAccessToken1 = yield extra_utils_1.userLogin(servers[0], { username, password });
            }
            {
                const username = 'user2';
                const password = 'my super password';
                yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: username, password: password });
                userAccessToken2 = yield extra_utils_1.userLogin(servers[0], { username, password });
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, userAccessToken1, {});
                servers[0].video = res.body.video;
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, {});
                notBlacklistedVideoId = res.body.video.uuid;
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, {});
                remoteVideoUUID = res.body.video.uuid;
            }
            yield extra_utils_1.waitJobs(servers);
        });
    });
    describe('When adding a video in blacklist', function () {
        const basePath = '/api/v1/videos/';
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail with a wrong video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const wrongPath = '/api/v1/videos/blabla/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path: wrongPath, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: 'hello', fields, statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({
                    url: servers[0].url,
                    path,
                    token: userAccessToken2,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should fail with an invalid reason', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = { reason: 'a'.repeat(305) };
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail to unfederate a remote video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + remoteVideoUUID + '/blacklist';
                const fields = { unfederate: true };
                yield extra_utils_1.makePostBodyRequest({
                    url: servers[0].url,
                    path,
                    token: servers[0].accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.CONFLICT_409
                });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({
                    url: servers[0].url,
                    path,
                    token: servers[0].accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
                });
            });
        });
    });
    describe('When updating a video in blacklist', function () {
        const basePath = '/api/v1/videos/';
        it('Should fail with a wrong video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const wrongPath = '/api/v1/videos/blabla/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path: wrongPath, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail with a video not blacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/' + notBlacklistedVideoId + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path,
                    token: servers[0].accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path, token: 'hello', fields, statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path,
                    token: userAccessToken2,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should fail with an invalid reason', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = { reason: 'a'.repeat(305) };
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = { reason: 'hello' };
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path,
                    token: servers[0].accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
                });
            });
        });
    });
    describe('When getting blacklisted video', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideo(servers[0].url, servers[0].video.uuid, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
            });
        });
        it('Should fail with another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken2, servers[0].video.uuid, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should succeed with the owner authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken1, servers[0].video.uuid, http_error_codes_1.HttpStatusCode.OK_200);
                const video = res.body;
                chai_1.expect(video.blacklisted).to.be.true;
            });
        });
        it('Should succeed with an admin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideoWithToken(servers[0].url, servers[0].accessToken, servers[0].video.uuid, http_error_codes_1.HttpStatusCode.OK_200);
                const video = res.body;
                chai_1.expect(video.blacklisted).to.be.true;
            });
        });
    });
    describe('When removing a video in blacklist', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, 'fake token', servers[0].video.uuid, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, userAccessToken2, servers[0].video.uuid, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should fail with an incorrect id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, 'hello', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            });
        });
        it('Should fail with a not blacklisted video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, notBlacklistedVideoId, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, servers[0].video.uuid, http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
            });
        });
    });
    describe('When listing videos in blacklist', function () {
        const basePath = '/api/v1/videos/blacklist/';
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: servers[0].url, token: 'fake token', specialStatus: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: servers[0].url, token: userAccessToken2, specialStatus: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
            });
        });
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(servers[0].url, basePath, servers[0].accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(servers[0].url, basePath, servers[0].accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(servers[0].url, basePath, servers[0].accessToken);
            });
        });
        it('Should fail with an invalid type', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    type: 0,
                    specialStatus: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, type: 1 });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
