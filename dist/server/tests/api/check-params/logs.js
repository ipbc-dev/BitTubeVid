"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const requests_1 = require("../../../../shared/extra-utils/requests/requests");
describe('Test logs API validators', function () {
    const path = '/api/v1/server/logs';
    let server;
    let userAccessToken = '';
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const user = {
                username: 'user1',
                password: 'my super password'
            };
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(server, user);
        });
    });
    describe('When getting logs', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makeGetRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail with a missing startDate query', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with a bad startDate query', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query: { startDate: 'toto' },
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with a bad endDate query', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query: { startDate: new Date().toISOString(), endDate: 'toto' },
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with a bad level parameter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query: { startDate: new Date().toISOString(), level: 'toto' },
                    statusCodeExpected: 400
                });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield requests_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query: { startDate: new Date().toISOString() },
                    statusCodeExpected: 200
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
