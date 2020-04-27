"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const request = require("supertest");
const servers_1 = require("../../../../shared/extra-utils/server/servers");
describe('Start and stop server without web client routes', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
