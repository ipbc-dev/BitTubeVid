"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const lodash_1 = require("lodash");
const path_1 = require("path");
const extra_utils_1 = require("../../../../shared/extra-utils");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test video lives API validator', function () {
    const path = '/api/v1/videos/live';
    let server;
    let userAccessToken = '';
    let channelId;
    let videoId;
    let videoIdNotLive;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                live: {
                    enabled: true,
                    maxInstanceLives: 20,
                    maxUserLives: 20,
                    allowReplay: true
                }
            });
            const username = 'user1';
            const password = 'my super password';
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: username, password: password });
            userAccessToken = yield extra_utils_1.userLogin(server, { username, password });
            {
                const res = yield extra_utils_1.getMyUserInformation(server.url, server.accessToken);
                channelId = res.body.videoChannels[0].id;
            }
            {
                videoIdNotLive = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'not live' })).id;
            }
        });
    });
    describe('When creating a live', function () {
        let baseCorrectParams;
        before(function () {
            baseCorrectParams = {
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
                channelId,
                saveReplay: false,
                permanentLive: false
            };
        });
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
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
        it('Should fail with save replay and permanent live set to true', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { saveReplay: true, permanentLive: true });
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const res = yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
                videoId = res.body.video.id;
            });
        });
        it('Should forbid if live is disabled', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    live: {
                        enabled: false
                    }
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should forbid to save replay if not enabled by the admin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { saveReplay: true });
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    live: {
                        enabled: true,
                        allowReplay: false
                    }
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should allow to save replay if enabled by the admin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { saveReplay: true });
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    live: {
                        enabled: true,
                        allowReplay: true
                    }
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
            });
        });
        it('Should not allow live if max instance lives is reached', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    live: {
                        enabled: true,
                        maxInstanceLives: 1
                    }
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should not allow live if max user lives is reached', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    live: {
                        enabled: true,
                        maxInstanceLives: 20,
                        maxUserLives: 1
                    }
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: baseCorrectParams,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
    });
    describe('When getting live information', function () {
        it('Should fail without access token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getLive(server.url, '', videoId, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
            });
        });
        it('Should fail with a bad access token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getLive(server.url, 'toto', videoId, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
            });
        });
        it('Should fail with access token of another user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getLive(server.url, userAccessToken, videoId, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should fail with a bad video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getLive(server.url, server.accessToken, 'toto', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            });
        });
        it('Should fail with an unknown video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getLive(server.url, server.accessToken, 454555, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should fail with a non live video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getLive(server.url, server.accessToken, videoIdNotLive, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getLive(server.url, server.accessToken, videoId);
            });
        });
    });
    describe('When updating live information', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            it('Should fail without access token', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateLive(server.url, '', videoId, {}, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
                });
            });
            it('Should fail with a bad access token', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateLive(server.url, 'toto', videoId, {}, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
                });
            });
            it('Should fail with access token of another user', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateLive(server.url, userAccessToken, videoId, {}, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
                });
            });
            it('Should fail with a bad video id', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateLive(server.url, server.accessToken, 'toto', {}, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
                });
            });
            it('Should fail with an unknown video id', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateLive(server.url, server.accessToken, 454555, {}, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                });
            });
            it('Should fail with a non live video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateLive(server.url, server.accessToken, videoIdNotLive, {}, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                });
            });
            it('Should fail with save replay and permanent live set to true', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const fields = { saveReplay: true, permanentLive: true };
                    yield extra_utils_1.updateLive(server.url, server.accessToken, videoId, fields, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
                });
            });
            it('Should succeed with the correct params', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateLive(server.url, server.accessToken, videoId, { saveReplay: false });
                });
            });
            it('Should fail to update replay status if replay is not allowed on the instance', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                        live: {
                            enabled: true,
                            allowReplay: false
                        }
                    });
                    yield extra_utils_1.updateLive(server.url, server.accessToken, videoId, { saveReplay: true }, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
                });
            });
            it('Should fail to update a live if it has already started', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(40000);
                    const resLive = yield extra_utils_1.getLive(server.url, server.accessToken, videoId);
                    const live = resLive.body;
                    const command = extra_utils_1.sendRTMPStream(live.rtmpUrl, live.streamKey);
                    yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, videoId);
                    yield extra_utils_1.updateLive(server.url, server.accessToken, videoId, {}, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
                    yield extra_utils_1.stopFfmpeg(command);
                });
            });
            it('Should fail to stream twice in the save live', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(40000);
                    const resLive = yield extra_utils_1.getLive(server.url, server.accessToken, videoId);
                    const live = resLive.body;
                    const command = extra_utils_1.sendRTMPStream(live.rtmpUrl, live.streamKey);
                    yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, videoId);
                    yield extra_utils_1.runAndTestFfmpegStreamError(server.url, server.accessToken, videoId, true);
                    yield extra_utils_1.stopFfmpeg(command);
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
