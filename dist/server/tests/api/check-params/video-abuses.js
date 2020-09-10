"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
describe('Test video abuses API validators', function () {
    let server;
    let userAccessToken = '';
    let videoAbuseId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const username = 'user1';
            const password = 'my super password';
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: username, password: password });
            userAccessToken = yield extra_utils_1.userLogin(server, { username, password });
            const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, {});
            server.video = res.body.video;
        });
    });
    describe('When listing video abuses', function () {
        const path = '/api/v1/videos/abuse';
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
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail with a bad id filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { id: 'toto' } });
            });
        });
        it('Should fail with a bad state filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { state: 'toto' } });
            });
        });
        it('Should fail with a bad videoIs filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { videoIs: 'toto' } });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { id: 13 }, statusCodeExpected: 200 });
            });
        });
    });
    describe('When reporting a video abuse', function () {
        const basePath = '/api/v1/videos/';
        let path;
        before(() => {
            path = basePath + server.video.id + '/abuse';
        });
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a wrong video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const wrongPath = '/api/v1/videos/blabla/abuse';
                const fields = { reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: wrongPath, token: server.accessToken, fields });
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: 'hello', fields, statusCodeExpected: 401 });
            });
        });
        it('Should fail with a reason too short', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'h' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with a too big reason', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'super'.repeat(605) };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should succeed with the correct parameters (basic)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'my super reason' };
                const res = yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields, statusCodeExpected: 200 });
                videoAbuseId = res.body.abuse.id;
            });
        });
        it('Should fail with a wrong predefined reason', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'my super reason', predefinedReasons: ['wrongPredefinedReason'] };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should fail with negative timestamps', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'my super reason', startAt: -1 };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields });
            });
        });
        it('Should succeed with the corret parameters (advanced)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'my super reason', predefinedReasons: ['serverRules'], startAt: 1, endAt: 5 };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: server.accessToken, fields, statusCodeExpected: 200 });
            });
        });
    });
    describe('When updating a video abuse', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideoAbuse(server.url, 'blabla', server.video.uuid, videoAbuseId, {}, 401);
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideoAbuse(server.url, userAccessToken, server.video.uuid, videoAbuseId, {}, 403);
            });
        });
        it('Should fail with a bad video id or bad video abuse id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideoAbuse(server.url, server.accessToken, server.video.uuid, 45, {}, 404);
                yield extra_utils_1.updateVideoAbuse(server.url, server.accessToken, 52, videoAbuseId, {}, 404);
            });
        });
        it('Should fail with a bad state', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { state: 5 };
                yield extra_utils_1.updateVideoAbuse(server.url, server.accessToken, server.video.uuid, videoAbuseId, body, 400);
            });
        });
        it('Should fail with a bad moderation comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { moderationComment: 'b'.repeat(3001) };
                yield extra_utils_1.updateVideoAbuse(server.url, server.accessToken, server.video.uuid, videoAbuseId, body, 400);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { state: 3 };
                yield extra_utils_1.updateVideoAbuse(server.url, server.accessToken, server.video.uuid, videoAbuseId, body);
            });
        });
    });
    describe('When deleting a video abuse', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoAbuse(server.url, 'blabla', server.video.uuid, videoAbuseId, 401);
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoAbuse(server.url, userAccessToken, server.video.uuid, videoAbuseId, 403);
            });
        });
        it('Should fail with a bad video id or bad video abuse id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoAbuse(server.url, server.accessToken, server.video.uuid, 45, 404);
                yield extra_utils_1.deleteVideoAbuse(server.url, server.accessToken, 52, videoAbuseId, 404);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoAbuse(server.url, server.accessToken, server.video.uuid, videoAbuseId);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
