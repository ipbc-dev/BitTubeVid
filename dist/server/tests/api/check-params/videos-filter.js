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
const extra_utils_1 = require("../../../../shared/extra-utils");
const users_1 = require("../../../../shared/models/users");
function testEndpoints(server, token, filter, statusCodeExpected) {
    return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
            return __awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, server.accessToken, 'bad-filter', 400);
            });
        });
        it('Should succeed with a good filter', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, server.accessToken, 'local', 200);
            });
        });
        it('Should fail to list all-local with a simple user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, userAccessToken, 'all-local', 401);
            });
        });
        it('Should succeed to list all-local with a moderator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, moderatorAccessToken, 'all-local', 200);
            });
        });
        it('Should succeed to list all-local with an admin', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield testEndpoints(server, server.accessToken, 'all-local', 200);
            });
        });
        it('Should fail on the feeds endpoint with the all-local filter', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/feeds/videos.json',
                    statusCodeExpected: 401,
                    query: {
                        filter: 'all-local'
                    }
                });
            });
        });
        it('Should succeed on the feeds endpoint with the local filter', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/feeds/videos.json',
                    statusCodeExpected: 200,
                    query: {
                        filter: 'local'
                    }
                });
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
