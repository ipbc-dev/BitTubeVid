"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const users_1 = require("../../../../shared/models/users");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
function testEndpoints(server, token, filter, statusCodeExpected) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const paths = [
            '/api/v1/video-channels/root_channel/videos',
            '/api/v1/accounts/root/videos',
            '/api/v1/videos',
            '/api/v1/search/videos'
        ];
        for (const path of paths) {
            yield extra_utils_1.makeGetRequest({
                url: server.url,
                path,
                token,
                query: {
                    filter
                },
                statusCodeExpected
            });
        }
    });
}
describe('Test videos filters', function () {
    let server;
    let userAccessToken;
    let moderatorAccessToken;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.setDefaultVideoChannel([server]);
            const user = { username: 'user1', password: 'my super password' };
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(server, user);
            const moderator = { username: 'moderator', password: 'my super password' };
            yield extra_utils_1.createUser({
                url: server.url,
                accessToken: server.accessToken,
                username: moderator.username,
                password: moderator.password,
                videoQuota: undefined,
                videoQuotaDaily: undefined,
                role: users_1.UserRole.MODERATOR
            });
            moderatorAccessToken = yield extra_utils_1.userLogin(server, moderator);
        });
    });
    describe('When setting a video filter', function () {
        it('Should fail with a bad filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, server.accessToken, 'bad-filter', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            });
        });
        it('Should succeed with a good filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, server.accessToken, 'local', http_error_codes_1.HttpStatusCode.OK_200);
            });
        });
        it('Should fail to list all-local/all with a simple user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, userAccessToken, 'all-local', http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
                yield testEndpoints(server, userAccessToken, 'all', http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
            });
        });
        it('Should succeed to list all-local/all with a moderator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, moderatorAccessToken, 'all-local', http_error_codes_1.HttpStatusCode.OK_200);
                yield testEndpoints(server, moderatorAccessToken, 'all', http_error_codes_1.HttpStatusCode.OK_200);
            });
        });
        it('Should succeed to list all-local/all with an admin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, server.accessToken, 'all-local', http_error_codes_1.HttpStatusCode.OK_200);
                yield testEndpoints(server, server.accessToken, 'all', http_error_codes_1.HttpStatusCode.OK_200);
            });
        });
        it('Should fail on the feeds endpoint with the all-local/all filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const filter of ['all', 'all-local']) {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path: '/feeds/videos.json',
                        statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401,
                        query: {
                            filter
                        }
                    });
                }
            });
        });
        it('Should succeed on the feeds endpoint with the local filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/feeds/videos.json',
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200,
                    query: {
                        filter: 'local'
                    }
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
