"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
const lodash_1 = require("lodash");
require("mocha");
const path_1 = require("path");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
describe('Test videos API validator', function () {
    const path = '/api/v1/videos/';
    let server;
    let userAccessToken = '';
    let accountName;
    let channelId;
    let channelName;
    let videoId;
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
                channelName = res.body.videoChannels[0].name;
                accountName = res.body.account.name + '@' + res.body.account.host;
            }
        });
    });
    describe('When listing videos', function () {
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path);
            });
        });
        it('Should fail with a bad skipVideos query', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200, query: { skipCount: 'toto' } });
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200, query: { skipCount: false } });
            });
        });
    });
    describe('When searching a video', function () {
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: path_1.join(path, 'search'),
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
                });
            });
        });
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path_1.join(path, 'search', 'test'));
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path_1.join(path, 'search', 'test'));
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path_1.join(path, 'search', 'test'));
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200 });
            });
        });
    });
    describe('When listing my videos', function () {
        const path = '/api/v1/users/me/videos';
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, token: server.accessToken, path, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200 });
            });
        });
    });
    describe('When listing account videos', function () {
        let path;
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                path = '/api/v1/accounts/' + accountName + '/videos';
            });
        });
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200 });
            });
        });
    });
    describe('When listing video channel videos', function () {
        let path;
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                path = '/api/v1/video-channels/' + channelName + '/videos';
            });
        });
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200 });
            });
        });
    });
    describe('When adding a video', function () {
        let baseCorrectParams;
        const baseCorrectAttaches = {
            videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.webm')
        };
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
                channelId: channelId,
                originallyPublishedAt: new Date().toISOString()
            };
        });
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
                const attaches = {};
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail without name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = lodash_1.omit(baseCorrectParams, 'name');
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a long name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { name: 'super'.repeat(65) });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a bad category', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { category: 125 });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a bad licence', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { licence: 125 });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a bad language', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { language: 'a'.repeat(15) });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a long description', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { description: 'super'.repeat(2500) });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a long support text', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { support: 'super'.repeat(201) });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail without a channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = lodash_1.omit(baseCorrectParams, 'channelId');
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a bad channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { channelId: 545454 });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
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
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: userAccessToken, fields, attaches });
            });
        });
        it('Should fail with too many tags', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a tag length too low', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 't'] });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a tag length too big', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 'my_super_tag_too_long_long_long_long_long_long'] });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a bad schedule update (miss updateAt)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { 'scheduleUpdate[privacy]': 1 });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a bad schedule update (wrong updateAt)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, {
                    'scheduleUpdate[privacy]': 1,
                    'scheduleUpdate[updateAt]': 'toto'
                });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a bad originally published at attribute', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { originallyPublishedAt: 'toto' });
                const attaches = baseCorrectAttaches;
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail without an input file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {};
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with an incorrect input file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                let attaches = {
                    videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short_fake.webm')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    path: path + '/upload',
                    token: server.accessToken,
                    fields,
                    attaches,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNPROCESSABLE_ENTITY_422
                });
                attaches = {
                    videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.mkv')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    path: path + '/upload',
                    token: server.accessToken,
                    fields,
                    attaches,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.UNSUPPORTED_MEDIA_TYPE_415
                });
            });
        });
        it('Should fail with an incorrect thumbnail file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    thumbnailfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar.png'),
                    videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.mp4')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a big thumbnail file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    thumbnailfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar-big.png'),
                    videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.mp4')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with an incorrect preview file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    previewfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar.png'),
                    videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.mp4')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should fail with a big preview file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    previewfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar-big.png'),
                    videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.mp4')
                };
                yield extra_utils_1.makeUploadRequest({ url: server.url, path: path + '/upload', token: server.accessToken, fields, attaches });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const fields = baseCorrectParams;
                {
                    const attaches = baseCorrectAttaches;
                    yield extra_utils_1.makeUploadRequest({
                        url: server.url,
                        path: path + '/upload',
                        token: server.accessToken,
                        fields,
                        attaches,
                        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                    });
                }
                {
                    const attaches = extra_utils_1.immutableAssign(baseCorrectAttaches, {
                        videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.mp4')
                    });
                    yield extra_utils_1.makeUploadRequest({
                        url: server.url,
                        path: path + '/upload',
                        token: server.accessToken,
                        fields,
                        attaches,
                        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                    });
                }
                {
                    const attaches = extra_utils_1.immutableAssign(baseCorrectAttaches, {
                        videofile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'video_short.ogv')
                    });
                    yield extra_utils_1.makeUploadRequest({
                        url: server.url,
                        path: path + '/upload',
                        token: server.accessToken,
                        fields,
                        attaches,
                        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                    });
                }
            });
        });
    });
    describe('When updating a video', function () {
        const baseCorrectParams = {
            name: 'my super name',
            category: 5,
            licence: 2,
            language: 'pt',
            nsfw: false,
            commentsEnabled: false,
            downloadEnabled: false,
            description: 'my super description',
            privacy: 1,
            tags: ['tag1', 'tag2']
        };
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideosList(server.url);
                videoId = res.body.data[0].uuid;
            });
        });
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail without a valid uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + 'blabla', token: server.accessToken, fields });
            });
        });
        it('Should fail with an unknown id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df5630b06',
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail with a long name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { name: 'super'.repeat(65) });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad category', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { category: 125 });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad licence', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { licence: 125 });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad language', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { language: 'a'.repeat(15) });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long description', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { description: 'super'.repeat(2500) });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a long support text', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { support: 'super'.repeat(201) });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { channelId: 545454 });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with too many tags', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a tag length too low', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 't'] });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a tag length too big', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { tags: ['tag1', 'my_super_tag_too_long_long_long_long_long_long'] });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad schedule update (miss updateAt)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { scheduleUpdate: { privacy: 1 } });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad schedule update (wrong updateAt)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { scheduleUpdate: { updateAt: 'toto', privacy: 1 } });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with a bad originally published at param', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = extra_utils_1.immutableAssign(baseCorrectParams, { originallyPublishedAt: 'toto' });
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId, token: server.accessToken, fields });
            });
        });
        it('Should fail with an incorrect thumbnail file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    thumbnailfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar.png')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    method: 'PUT',
                    path: path + videoId,
                    token: server.accessToken,
                    fields,
                    attaches
                });
            });
        });
        it('Should fail with a big thumbnail file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    thumbnailfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar-big.png')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    method: 'PUT',
                    path: path + videoId,
                    token: server.accessToken,
                    fields,
                    attaches
                });
            });
        });
        it('Should fail with an incorrect preview file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    previewfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar.png')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    method: 'PUT',
                    path: path + videoId,
                    token: server.accessToken,
                    fields,
                    attaches
                });
            });
        });
        it('Should fail with a big preview file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                const attaches = {
                    previewfile: path_1.join(extra_utils_1.root(), 'server', 'tests', 'fixtures', 'avatar-big.png')
                };
                yield extra_utils_1.makeUploadRequest({
                    url: server.url,
                    method: 'PUT',
                    path: path + videoId,
                    token: server.accessToken,
                    fields,
                    attaches
                });
            });
        });
        it('Should fail with a video of another user without the appropriate right', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + videoId,
                    token: userAccessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.FORBIDDEN_403
                });
            });
        });
        it('Should fail with a video of another server');
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = baseCorrectParams;
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + videoId,
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
                });
            });
        });
    });
    describe('When getting a video', function () {
        it('Should return the list of the videos with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
                });
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.equal(3);
            });
        });
        it('Should fail without a correct uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideo(server.url, 'coucou', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            });
        });
        it('Should return 404 with an incorrect video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideo(server.url, '4da6fde3-88f7-4d16-b119-108df5630b06', http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideo(server.url, videoId);
            });
        });
    });
    describe('When rating a video', function () {
        let videoId;
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideosList(server.url);
                videoId = res.body.data[0].id;
            });
        });
        it('Should fail without a valid uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    rating: 'like'
                };
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + 'blabla/rate', token: server.accessToken, fields });
            });
        });
        it('Should fail with an unknown id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    rating: 'like'
                };
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + '4da6fde3-88f7-4d16-b119-108df5630b06/rate',
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
                });
            });
        });
        it('Should fail with a wrong rating', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    rating: 'likes'
                };
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: path + videoId + '/rate', token: server.accessToken, fields });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    rating: 'like'
                };
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + videoId + '/rate',
                    token: server.accessToken,
                    fields,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
                });
            });
        });
    });
    describe('When removing a video', function () {
        it('Should have 404 with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
                });
            });
        });
        it('Should fail without a correct uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideo(server.url, server.accessToken, 'hello', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            });
        });
        it('Should fail with a video which does not exist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideo(server.url, server.accessToken, '4da6fde3-88f7-4d16-b119-108df5630b06', http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should fail with a video of another user without the appropriate right', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideo(server.url, userAccessToken, videoId, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should fail with a video of another server');
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideo(server.url, server.accessToken, videoId);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
