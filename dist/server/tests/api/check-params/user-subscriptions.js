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
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
describe('Test user subscriptions API validators', function () {
    const path = '/api/v1/users/me/subscriptions';
    let server;
    let userAccessToken = '';
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
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
    describe('When listing my subscriptions', function () {
        it('Should fail with a bad start pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When listing my subscriptions videos', function () {
        const path = '/api/v1/users/me/subscriptions/videos';
        it('Should fail with a bad start pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When adding a subscription', function () {
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    fields: { uri: 'user1_channel@localhost:' + server.port },
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with bad URIs', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: { uri: 'root' },
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: { uri: 'root@' },
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: { uri: 'root@hello@' },
                    statusCodeExpected: 400
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: { uri: 'user1_channel@localhost:' + server.port },
                    statusCodeExpected: 204
                });
                yield jobs_1.waitJobs([server]);
            });
        });
    });
    describe('When getting a subscription', function () {
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + '/user1_channel@localhost:' + server.port,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with bad URIs', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + '/root',
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + '/root@',
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + '/root@hello@',
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with an unknown subscription', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + '/root1@localhost:' + server.port,
                    token: server.accessToken,
                    statusCodeExpected: 404
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path + '/user1_channel@localhost:' + server.port,
                    token: server.accessToken,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When checking if subscriptions exist', function () {
        const existPath = path + '/exist';
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: existPath,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with bad URIs', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: existPath,
                    query: { uris: 'toto' },
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: existPath,
                    query: { 'uris[]': 1 },
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: existPath,
                    query: { 'uris[]': 'coucou@localhost:' + server.port },
                    token: server.accessToken,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When removing a subscription', function () {
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '/user1_channel@localhost:' + server.port,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with bad URIs', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '/root',
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '/root@',
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '/root@hello@',
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with an unknown subscription', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '/root1@localhost:' + server.port,
                    token: server.accessToken,
                    statusCodeExpected: 404
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path: path + '/user1_channel@localhost:' + server.port,
                    token: server.accessToken,
                    statusCodeExpected: 204
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
