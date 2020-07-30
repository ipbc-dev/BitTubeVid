"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const servers_1 = require("../../../shared/extra-utils/server/servers");
const extra_utils_1 = require("../../../shared/extra-utils");
const chai_1 = require("chai");
describe('Test plugin helpers', function () {
    let server;
    const basePaths = [
        '/plugins/test-five/router/',
        '/plugins/test-five/0.0.1/router/'
    ];
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                path: extra_utils_1.getPluginTestPath('-five')
            });
        });
    });
    it('Should answer "pong"', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const path of basePaths) {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + 'ping',
                    statusCodeExpected: 200
                });
                chai_1.expect(res.body.message).to.equal('pong');
            }
        });
    });
    it('Should mirror post body', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const body = {
                hello: 'world',
                riri: 'fifi',
                loulou: 'picsou'
            };
            for (const path of basePaths) {
                const res = yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: path + 'form/post/mirror',
                    fields: body,
                    statusCodeExpected: 200
                });
                chai_1.expect(res.body).to.deep.equal(body);
            }
        });
    });
    it('Should remove the plugin and remove the routes', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-test-five'
            });
            for (const path of basePaths) {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + 'ping',
                    statusCodeExpected: 404
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: path + 'ping',
                    fields: {},
                    statusCodeExpected: 404
                });
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
