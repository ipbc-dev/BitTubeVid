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
const chai = require("chai");
const lodash_1 = require("lodash");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const path_1 = require("path");
const expect = chai.expect;
describe('Test video channels API validator', function () {
    const videoChannelPath = '/api/v1/video-channels';
    let server;
    let accessTokenUser;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const user = {
                username: 'fake',
                password: 'fake_password'
            };
            {
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                accessTokenUser = yield extra_utils_1.userLogin(server, user);
            }
        });
    });
    describe('When listing a video channels', function () {
        it('Should fail with a bad start pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, videoChannelPath, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, videoChannelPath, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, videoChannelPath, server.accessToken);
            });
        });
    });
    describe('When listing account video channels', function () {
        const accountChannelPath = '/api/v1/accounts/fake/video-channels';
        it('Should fail with a bad start pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, accountChannelPath, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, accountChannelPath, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, accountChannelPath, server.accessToken);
            });
        });
        it('Should fail with a unknown account', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getAccountVideoChannelsList({ url: server.url, accountName: 'unknown', specialStatus: 404 });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: accountChannelPath,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When adding a video channel', function () {
        const baseCorrectParams = {
            name: 'super_channel',
            displayName: 'hello',
            description: 'super description',
            support: 'super support text'
        };
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: videoChannelPath,
                    token: 'none',
                    fields: baseCorrectParams,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with nothing', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: videoChannelPath, token: server.accessToken, fields });
            });
        });
        it('Should fail without a name', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = lodash_1.omit(baseCorrectParams, 'name');
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: videoChannelPath, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad name', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { name: 'super name' });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: videoChannelPath, token: server.accessToken, fields });
            });
        });
        it('Should fail without a name', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = lodash_1.omit(baseCorrectParams, 'displayName');
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: videoChannelPath, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long name', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { displayName: 'super'.repeat(25) });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: videoChannelPath, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long description', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { description: 'super'.repeat(201) });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: videoChannelPath, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long support text', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { support: 'super'.repeat(201) });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: videoChannelPath, token: server.accessToken, fields });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: videoChannelPath,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: 200
                });
            });
        });
        it('Should fail when adding a channel with the same username', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path: videoChannelPath,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: 409
                });
            });
        });
    });
    describe('When updating a video channel', function () {
        const baseCorrectParams = {
            displayName: 'hello',
            description: 'super description',
            support: 'toto',
            bulkVideosSupportUpdate: false
        };
        let path;
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                path = videoChannelPath + '/super_channel';
            });
        });
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    token: 'hi',
                    fields: baseCorrectParams,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with another authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    token: accessTokenUser,
                    fields: baseCorrectParams,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail with a long name', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { displayName: 'super'.repeat(25) });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long description', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { description: 'super'.repeat(201) });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long support text', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { support: 'super'.repeat(201) });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad bulkVideosSupportUpdate field', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { bulkVideosSupportUpdate: 'super' });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: 204
                });
            });
        });
    });
    describe('When updating video channel avatar', function () {
        let path;
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                path = videoChannelPath + '/super_channel';
            });
        });
        it('Should fail with an incorrect input file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = {};
                const attaches = {
                    'avatarfile': path_1.join(__dirname, '..', '..', 'fixtures', 'video_short.mp4')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/avatar/pick', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a big file', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = {};
                const attaches = {
                    'avatarfile': path_1.join(__dirname, '..', '..', 'fixtures', 'avatar-big.png')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/avatar/pick', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with an unauthenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = {};
                const attaches = {
                    'avatarfile': path_1.join(__dirname, '..', '..', 'fixtures', 'avatar.png')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    path: path + '/avatar/pick',
                    fields,
                    attaches,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should succeed with the correct params', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = {};
                const attaches = {
                    'avatarfile': path_1.join(__dirname, '..', '..', 'fixtures', 'avatar.png')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    path: path + '/avatar/pick',
                    token: server.accessToken,
                    fields,
                    attaches,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When getting a video channel', function () {
        it('Should return the list of the video channels with nothing', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: videoChannelPath,
                    statusCodeExpected: 200
                });
                expect(res.body.data).to.be.an('array');
            });
        });
        it('Should return 404 with an incorrect video channel', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: videoChannelPath + '/super_channel2',
                    statusCodeExpected: 404
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: videoChannelPath + '/super_channel',
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When deleting a video channel', function () {
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoChannel(server.url, 'coucou', 'super_channel', 401);
            });
        });
        it('Should fail with another authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoChannel(server.url, accessTokenUser, 'super_channel', 403);
            });
        });
        it('Should fail with an unknown video channel id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoChannel(server.url, server.accessToken, 'super_channel2', 404);
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoChannel(server.url, server.accessToken, 'super_channel');
            });
        });
        it('Should fail to delete the last user video channel', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoChannel(server.url, server.accessToken, 'root_channel', 409);
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
