"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const requests_1 = require("../../../../shared/extra-utils/requests/requests");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test bulk API validators', function () {
    let server;
    let userAccessToken;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const user = { username: 'user1', password: 'password' };
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(server, user);
        });
    });
    describe('When removing comments of', function () {
        const path = '/api/v1/bulk/remove-comments-of';
        it('Should fail with an unauthenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    fields: { accountName: 'user1', scope: 'my-videos' },
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401
                });
            });
        });
        it('Should fail with an unknown account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makePostBodyRequest({
                    url: server.url,
                    token: server.accessToken,
                    path,
                    fields: { accountName: 'user2', scope: 'my-videos' },
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail with an invalid scope', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makePostBodyRequest({
                    url: server.url,
                    token: server.accessToken,
                    path,
                    fields: { accountName: 'user1', scope: 'my-videoss' },
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
                });
            });
        });
        it('Should fail to delete comments of the instance without the appropriate rights', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makePostBodyRequest({
                    url: server.url,
                    token: userAccessToken,
                    path,
                    fields: { accountName: 'user1', scope: 'instance' },
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makePostBodyRequest({
                    url: server.url,
                    token: server.accessToken,
                    path,
                    fields: { accountName: 'user1', scope: 'instance' },
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
