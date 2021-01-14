"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const lodash_1 = require("lodash");
const path_1 = require("path");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const video_imports_1 = require("../../../../shared/extra-utils/videos/video-imports");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test video imports API validator', function () {
    const path = '/api/v1/videos/imports';
    let server;
    let userAccessToken = '';
    let channelId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const username = 'user1';
            const password = 'my super password';
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: username, password: password });
            userAccessToken = yield extra_utils_1.userLogin(server, { username, password });
            {
                const res = yield extra_utils_1.getMyUserInformation(server.url, server.accessToken);
                channelId = res.body.videoChannels[0].id;
            }
        });
    });
    describe('When listing my video imports', function () {
        const myPath = '/api/v1/users/me/videos/imports';
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, myPath, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, myPath, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, myPath, server.accessToken);
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path: myPath, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200, token: server.accessToken });
            });
        });
    });
    describe('When adding a video import', function () {
        let baseCorrectParams;
        before(function () {
            baseCorrectParams = {
                targetUrl: video_imports_1.getGoodVideoUrl(),
                name: 'my super name',
                category: 5,
                licence: 1,
                language: 'pt',
                nsfw: false,
                commentsEnabled: true,
                downloadEnabled: true,
                waitTranscoding: true,
                description: 'my super description',
                support: 'my super support text',
                tags: ['tag1', 'tag2'],
                privacy: 1,
                channelId
            };
        });
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail without a target url', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = lodash_1.omit(baseCorrectParams, 'targetUrl');
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
                });
            });
        });
        it('Should fail with a bad target url', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { targetUrl: 'htt://hello' });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { name: 'super'.repeat(65) });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad category', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { category: 125 });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad licence', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { licence: 125 });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad language', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { language: 'a'.repeat(15) });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long description', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { description: 'super'.repeat(2500) });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long support text', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { support: 'super'.repeat(201) });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail without a channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = lodash_1.omit(baseCorrectParams, 'channelId');
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { channelId: 545454 });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with another user channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const user = {
                    username: 'fake',
                    password: 'fake_password'
                };
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                const accessTokenUser = yield extra_utils_1.userLogin(server, user);
                const res = yield extra_utils_1.getMyUserInformation(server.url, accessTokenUser);
                const customChannelId = res.body.videoChannels[0].id;
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { channelId: customChannelId });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields });
            });
        });
        it('Should fail with too many tags', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a tag length too low', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 't'] });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a tag length too big', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 'my_super_tag_too_long_long_long_long_long_long'] });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with an incorrect thumbnail file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    thumbnailfile: path_1.join(__dirname, '..', '..', 'fixtures', 'avatar.png')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path, token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a big thumbnail file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    thumbnailfile: path_1.join(__dirname, '..', '..', 'fixtures', 'avatar-big.png')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path, token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with an incorrect preview file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    previewfile: path_1.join(__dirname, '..', '..', 'fixtures', 'avatar.png')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path, token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a big preview file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    previewfile: path_1.join(__dirname, '..', '..', 'fixtures', 'avatar-big.png')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path, token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with an invalid torrent file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = lodash_1.omit(baseCorrectParams, 'targetUrl');
                const attaches = {
                    torrentfile: path_1.join(__dirname, '..', '..', 'fixtures', 'avatar-big.png')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path, token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with an invalid magnet URI', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                let fields = lodash_1.omit(baseCorrectParams, 'targetUrl');
                fields = extra_utils_1.immutableAssign(fields, { magnetUri: 'blabla' });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
            });
        });
        it('Should forbid to import http videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    import: {
                        videos: {
                            http: {
                                enabled: false
                            },
                            torrent: {
                                enabled: true
                            }
                        }
                    }
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.CONFLICT_409
                });
            });
        });
        it('Should forbid to import torrent videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    import: {
                        videos: {
                            http: {
                                enabled: true
                            },
                            torrent: {
                                enabled: false
                            }
                        }
                    }
                });
                let fields = lodash_1.omit(baseCorrectParams, 'targetUrl');
                fields = extra_utils_1.immutableAssign(fields, { magnetUri: video_imports_1.getMagnetURI() });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.CONFLICT_409
                });
                fields = lodash_1.omit(fields, 'magnetUri');
                const attaches = {
                    torrentfile: path_1.join(__dirname, '..', '..', 'fixtures', 'video-720p.torrent')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    attaches,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.CONFLICT_409
                });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
