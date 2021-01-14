"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../shared/extra-utils");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
describe('Test reset password scripts', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: 'user_1', password: 'super password' });
        });
    });
    it('Should change the user password from CLI', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const env = extra_utils_1.getEnvCli(server);
            yield extra_utils_1.execCLI(`echo coucou | ${env} npm run reset-password -- -u user_1`);
            yield extra_utils_1.login(server.url, server.client, { username: 'user_1', password: 'coucou' }, http_error_codes_1.HttpStatusCode.OK_200);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
