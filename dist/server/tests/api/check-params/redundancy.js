"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test server redundancy API validators', function () {
    let servers;
    let userAccessToken = null;
    let videoIdLocal;
    let videoIdRemote;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(80000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            const user = {
                username: 'user1',
                password: 'password'
            };
            yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(servers[0], user);
            videoIdLocal = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video' })).id;
            const remoteUUID = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video' })).uuid;
            yield extra_utils_1.waitJobs(servers);
            videoIdRemote = yield extra_utils_1.getVideoIdFromUUID(servers[0].url, remoteUUID);
        });
    });
    describe('When listing redundancies', function () {
        const path = '/api/v1/server/redundancy/videos';
        let url;
        let token;
        before(function () {
            url = servers[0].url;
            token = servers[0].accessToken;
        });
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token: 'fake_token', statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token: userAccessToken, statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
            });
        });
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadStartPagination(url, path, servers[0].accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadCountPagination(url, path, servers[0].accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadSortPagination(url, path, servers[0].accessToken);
            });
        });
        it('Should fail with a bad target', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token, query: { target: 'bad target' } });
            });
        });
        it('Should fail without target', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token, query: { target: 'my-videos' }, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200 });
            });
        });
    });
    describe('When manually adding a redundancy', function () {
        const path = '/api/v1/server/redundancy/videos';
        let url;
        let token;
        before(function () {
            url = servers[0].url;
            token = servers[0].accessToken;
        });
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token: 'fake_token', statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token: userAccessToken, statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
            });
        });
        it('Should fail without a video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token });
            });
        });
        it('Should fail with an incorrect video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: 'peertube' } });
            });
        });
        it('Should fail with a not found video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: 6565 }, statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
            });
        });
        it('Should fail with a local a video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: videoIdLocal } });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: videoIdRemote }, statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204 });
            });
        });
        it('Should fail if the video is already duplicated', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: videoIdRemote }, statusCodeExpected: http_error_codes_1.HttpStatusCode.CONFLICT_409 });
            });
        });
    });
    describe('When manually removing a redundancy', function () {
        const path = '/api/v1/server/redundancy/videos/';
        let url;
        let token;
        before(function () {
            url = servers[0].url;
            token = servers[0].accessToken;
        });
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + '1', token: 'fake_token', statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401 });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + '1', token: userAccessToken, statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403 });
            });
        });
        it('Should fail with an incorrect video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + 'toto', token });
            });
        });
        it('Should fail with a not found video redundancy', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + '454545', token, statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404 });
            });
        });
    });
    describe('When updating server redundancy', function () {
        const path = '/api/v1/server/redundancy';
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { redundancyAllowed: true },
                    token: 'fake_token',
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { redundancyAllowed: true },
                    token: userAccessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should fail if we do not follow this server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/example.com',
                    fields: { redundancyAllowed: true },
                    token: servers[0].accessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail without de redundancyAllowed param', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { blabla: true },
                    token: servers[0].accessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { redundancyAllowed: true },
                    token: servers[0].accessToken,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
                });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
