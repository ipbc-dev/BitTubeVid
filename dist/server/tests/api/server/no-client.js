"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const request = require("supertest");
const servers_1 = require("../../../../shared/extra-utils/server/servers");
describe('Start and stop server without web client routes', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1, {}, ['--no-client']);
        });
    });
    it('Should fail getting the client', function () {
        const req = request(server.url)
            .get('/');
        return req.expect(404);
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
