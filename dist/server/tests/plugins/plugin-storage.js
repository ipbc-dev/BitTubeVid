"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
describe('Test plugin storage', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                path: extra_utils_1.getPluginTestPath('-six')
            });
        });
    });
    it('Should correctly store a subkey', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.waitUntilLog(server, 'superkey stored value is toto');
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
