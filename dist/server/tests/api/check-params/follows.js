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
describe('Test server follows API validators', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    describe('When managing following', function () {
        let userAccessToken = null;
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                const user = {
                    username: 'user1',
                    password: 'password'
                };
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                userAccessToken = yield extra_utils_1.userLogin(server, user);
            });
        });
        describe('When adding follows', function () {
            const path = '/api/v1/server/following';
            it('Should fail without hosts', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path,
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail if hosts is not an array', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path,
                        token: server.accessToken,
                        fields: { hosts: 'localhost:9002' },
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail if the array is not composed by hosts', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path,
                        fields: { hosts: ['localhost:9002', 'localhost:coucou'] },
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail if the array is composed with http schemes', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path,
                        fields: { hosts: ['localhost:9002', 'http://localhost:9003'] },
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail if hosts are not unique', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path,
                        fields: { urls: ['localhost:9002', 'localhost:9002'] },
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail with an invalid token', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path,
                        fields: { hosts: ['localhost:9002'] },
                        token: 'fake_token',
                        statusCodeExpected: 401
                    });
                });
            });
            it('Should fail if the user is not an administrator', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path,
                        fields: { hosts: ['localhost:9002'] },
                        token: userAccessToken,
                        statusCodeExpected: 403
                    });
                });
            });
        });
        describe('When listing followings', function () {
            const path = '/api/v1/server/following';
            it('Should fail with a bad start pagination', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield check_api_params_1.checkBadStartPagination(server.url, path);
                });
            });
            it('Should fail with a bad count pagination', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield check_api_params_1.checkBadCountPagination(server.url, path);
                });
            });
            it('Should fail with an incorrect sort', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield check_api_params_1.checkBadSortPagination(server.url, path);
                });
            });
            it('Should fail with an incorrect state', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path,
                        query: {
                            state: 'blabla'
                        }
                    });
                });
            });
            it('Should fail with an incorrect actor type', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path,
                        query: {
                            actorType: 'blabla'
                        }
                    });
                });
            });
            it('Should fail succeed with the correct params', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path,
                        statusCodeExpected: 200,
                        query: {
                            state: 'accepted',
                            actorType: 'Application'
                        }
                    });
                });
            });
        });
        describe('When listing followers', function () {
            const path = '/api/v1/server/followers';
            it('Should fail with a bad start pagination', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield check_api_params_1.checkBadStartPagination(server.url, path);
                });
            });
            it('Should fail with a bad count pagination', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield check_api_params_1.checkBadCountPagination(server.url, path);
                });
            });
            it('Should fail with an incorrect sort', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield check_api_params_1.checkBadSortPagination(server.url, path);
                });
            });
            it('Should fail with an incorrect actor type', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path,
                        query: {
                            actorType: 'blabla'
                        }
                    });
                });
            });
            it('Should fail with an incorrect state', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path,
                        query: {
                            state: 'blabla',
                            actorType: 'Application'
                        }
                    });
                });
            });
            it('Should fail succeed with the correct params', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path,
                        statusCodeExpected: 200,
                        query: {
                            state: 'accepted'
                        }
                    });
                });
            });
        });
        describe('When removing a follower', function () {
            const path = '/api/v1/server/followers';
            it('Should fail with an invalid token', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeDeleteRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9002',
                        token: 'fake_token',
                        statusCodeExpected: 401
                    });
                });
            });
            it('Should fail if the user is not an administrator', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeDeleteRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9002',
                        token: userAccessToken,
                        statusCodeExpected: 403
                    });
                });
            });
            it('Should fail with an invalid follower', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeDeleteRequest({
                        url: server.url,
                        path: path + '/toto',
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail with an unknown follower', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeDeleteRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9003',
                        token: server.accessToken,
                        statusCodeExpected: 404
                    });
                });
            });
        });
        describe('When accepting a follower', function () {
            const path = '/api/v1/server/followers';
            it('Should fail with an invalid token', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9002/accept',
                        token: 'fake_token',
                        statusCodeExpected: 401
                    });
                });
            });
            it('Should fail if the user is not an administrator', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9002/accept',
                        token: userAccessToken,
                        statusCodeExpected: 403
                    });
                });
            });
            it('Should fail with an invalid follower', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto/accept',
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail with an unknown follower', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9003/accept',
                        token: server.accessToken,
                        statusCodeExpected: 404
                    });
                });
            });
        });
        describe('When rejecting a follower', function () {
            const path = '/api/v1/server/followers';
            it('Should fail with an invalid token', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9002/reject',
                        token: 'fake_token',
                        statusCodeExpected: 401
                    });
                });
            });
            it('Should fail if the user is not an administrator', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9002/reject',
                        token: userAccessToken,
                        statusCodeExpected: 403
                    });
                });
            });
            it('Should fail with an invalid follower', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto/reject',
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                });
            });
            it('Should fail with an unknown follower', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + '/toto@localhost:9003/reject',
                        token: server.accessToken,
                        statusCodeExpected: 404
                    });
                });
            });
        });
        describe('When removing following', function () {
            const path = '/api/v1/server/following';
            it('Should fail with an invalid token', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeDeleteRequest({
                        url: server.url,
                        path: path + '/localhost:9002',
                        token: 'fake_token',
                        statusCodeExpected: 401
                    });
                });
            });
            it('Should fail if the user is not an administrator', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeDeleteRequest({
                        url: server.url,
                        path: path + '/localhost:9002',
                        token: userAccessToken,
                        statusCodeExpected: 403
                    });
                });
            });
            it('Should fail if we do not follow this server', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.makeDeleteRequest({
                        url: server.url,
                        path: path + '/example.com',
                        token: server.accessToken,
                        statusCodeExpected: 404
                    });
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
