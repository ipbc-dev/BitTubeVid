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
const extra_utils_1 = require("../../../shared/extra-utils");
describe('Test reset password scripts', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: 'user_1', password: 'super password' });
        });
    });
    it('Should change the user password from CLI', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const env = extra_utils_1.getEnvCli(server);
            yield extra_utils_1.execCLI(`echo coucou | ${env} npm run reset-password -- -u user_1`);
            yield extra_utils_1.login(server.url, server.client, { username: 'user_1', password: 'coucou' }, 200);
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
