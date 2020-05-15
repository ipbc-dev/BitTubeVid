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
describe('Test server redundancy API validators', function () {
    let servers;
    let userAccessToken = null;
    let videoIdLocal;
    let videoIdRemote;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            const user = {
                username: 'user1',
                password: 'password'
            };
            yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(servers[0], user);
            videoIdLocal = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video' })).id;
            videoIdRemote = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video' })).id;
            yield extra_utils_1.waitJobs(servers);
        });
    });
    describe('When listing redundancies', function () {
        const path = '/api/v1/server/redundancy/videos';
        let url;
        let token;
        before(function () {
            url = servers[0].url;
            token = servers[0].accessToken;
        });
        it('Should fail with an invalid token', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token: 'fake_token', statusCodeExpected: 401 });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token: userAccessToken, statusCodeExpected: 403 });
            });
        });
        it('Should fail with a bad start pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadStartPagination(url, path, servers[0].accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadCountPagination(url, path, servers[0].accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadSortPagination(url, path, servers[0].accessToken);
            });
        });
        it('Should fail with a bad target', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token, query: { target: 'bad target' } });
            });
        });
        it('Should fail without target', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token });
            });
        });
        it('Should succeed with the correct params', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url, path, token, query: { target: 'my-videos' }, statusCodeExpected: 200 });
            });
        });
    });
    describe('When manually adding a redundancy', function () {
        const path = '/api/v1/server/redundancy/videos';
        let url;
        let token;
        before(function () {
            url = servers[0].url;
            token = servers[0].accessToken;
        });
        it('Should fail with an invalid token', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token: 'fake_token', statusCodeExpected: 401 });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token: userAccessToken, statusCodeExpected: 403 });
            });
        });
        it('Should fail without a video id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token });
            });
        });
        it('Should fail with an incorrect video id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: 'peertube' } });
            });
        });
        it('Should fail with a not found video id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: 6565 }, statusCodeExpected: 404 });
            });
        });
        it('Should fail with a local a video id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: videoIdLocal } });
            });
        });
        it('Should succeed with the correct params', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: videoIdRemote }, statusCodeExpected: 204 });
            });
        });
        it('Should fail if the video is already duplicated', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.makePostBodyRequest({ url, path, token, fields: { videoId: videoIdRemote }, statusCodeExpected: 409 });
            });
        });
    });
    describe('When manually removing a redundancy', function () {
        const path = '/api/v1/server/redundancy/videos/';
        let url;
        let token;
        before(function () {
            url = servers[0].url;
            token = servers[0].accessToken;
        });
        it('Should fail with an invalid token', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + '1', token: 'fake_token', statusCodeExpected: 401 });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + '1', token: userAccessToken, statusCodeExpected: 403 });
            });
        });
        it('Should fail with an incorrect video id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + 'toto', token });
            });
        });
        it('Should fail with a not found video redundancy', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({ url, path: path + '454545', token, statusCodeExpected: 404 });
            });
        });
    });
    describe('When updating server redundancy', function () {
        const path = '/api/v1/server/redundancy';
        it('Should fail with an invalid token', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { redundancyAllowed: true },
                    token: 'fake_token',
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { redundancyAllowed: true },
                    token: userAccessToken,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail if we do not follow this server', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/example.com',
                    fields: { redundancyAllowed: true },
                    token: servers[0].accessToken,
                    statusCodeExpected: 404
                });
            });
        });
        it('Should fail without de redundancyAllowed param', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { blabla: true },
                    token: servers[0].accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: servers[0].url,
                    path: path + '/localhost:' + servers[1].port,
                    fields: { redundancyAllowed: true },
                    token: servers[0].accessToken,
                    statusCodeExpected: 204
                });
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
