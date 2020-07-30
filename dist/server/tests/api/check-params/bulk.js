"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const requests_1 = require("../../../../shared/extra-utils/requests/requests");
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
                    statusCodeExpected: 401
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
                    statusCodeExpected: 404
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
                    statusCodeExpected: 400
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
                    statusCodeExpected: 403
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
                    statusCodeExpected: 204
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
