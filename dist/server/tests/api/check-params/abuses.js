"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
describe('Test abuses API validators', function () {
    const basePath = '/api/v1/abuses/';
    let server;
    let userAccessToken = '';
    let userAccessToken2 = '';
    let abuseId;
    let messageId;
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
                userAccessToken2 = yield extra_utils_1.generateUserAccessToken(server, 'user_2');
            }
            const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, {});
            server.video = res.body.video;
        });
    });
    describe('When listing abuses for admins', function () {
        const path = basePath;
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
        it('Should fail with a bad filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { filter: 'toto' } });
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { filter: 'videos' } });
            });
        });
        it('Should fail with bad predefined reason', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { predefinedReason: 'violentOrRepulsives' } });
            });
        });
        it('Should fail with a bad state filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { state: 'toto' } });
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { state: 0 } });
            });
        });
        it('Should fail with a bad videoIs filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query: { videoIs: 'toto' } });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const query = {
                    id: 13,
                    predefinedReason: 'violentOrRepulsive',
                    filter: 'comment',
                    state: 2,
                    videoIs: 'deleted'
                };
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: server.accessToken, query, statusCodeExpected: 200 });
            });
        });
    });
    describe('When listing abuses for users', function () {
        const path = '/api/v1/users/me/abuses';
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(server.url, path, userAccessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(server.url, path, userAccessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(server.url, path, userAccessToken);
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
        it('Should fail with a bad id filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: userAccessToken, query: { id: 'toto' } });
            });
        });
        it('Should fail with a bad state filter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: userAccessToken, query: { state: 'toto' } });
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: userAccessToken, query: { state: 0 } });
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const query = {
                    id: 13,
                    state: 2
                };
                yield extra_utils_1.makeGetRequest({ url: server.url, path, token: userAccessToken, query, statusCodeExpected: 200 });
            });
        });
    });
    describe('When reporting an abuse', function () {
        const path = basePath;
        it('Should fail with nothing', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields });
            });
        });
        it('Should fail with a wrong video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: 'blabla' }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: path, token: userAccessToken, fields });
            });
        });
        it('Should fail with an unknown video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: 42 }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: path, token: userAccessToken, fields, statusCodeExpected: 404 });
            });
        });
        it('Should fail with a wrong comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { comment: { id: 'blabla' }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: path, token: userAccessToken, fields });
            });
        });
        it('Should fail with an unknown comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { comment: { id: 42 }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: path, token: userAccessToken, fields, statusCodeExpected: 404 });
            });
        });
        it('Should fail with a wrong account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { account: { id: 'blabla' }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: path, token: userAccessToken, fields });
            });
        });
        it('Should fail with an unknown account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { account: { id: 42 }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: path, token: userAccessToken, fields, statusCodeExpected: 404 });
            });
        });
        it('Should fail with not account, comment or video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: path, token: userAccessToken, fields, statusCodeExpected: 400 });
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: server.video.id }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: 'hello', fields, statusCodeExpected: 401 });
            });
        });
        it('Should fail with a reason too short', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: server.video.id }, reason: 'h' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields });
            });
        });
        it('Should fail with a too big reason', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: server.video.id }, reason: 'super'.repeat(605) };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields });
            });
        });
        it('Should succeed with the correct parameters (basic)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: server.video.id }, reason: 'my super reason' };
                const res = yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields, statusCodeExpected: 200 });
                abuseId = res.body.abuse.id;
            });
        });
        it('Should fail with a wrong predefined reason', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: server.video.id }, reason: 'my super reason', predefinedReasons: ['wrongPredefinedReason'] };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields });
            });
        });
        it('Should fail with negative timestamps', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: server.video.id, startAt: -1 }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields });
            });
        });
        it('Should fail mith misordered startAt/endAt', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = { video: { id: server.video.id, startAt: 5, endAt: 1 }, reason: 'my super reason' };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields });
            });
        });
        it('Should succeed with the corret parameters (advanced)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fields = {
                    video: {
                        id: server.video.id,
                        startAt: 1,
                        endAt: 5
                    },
                    reason: 'my super reason',
                    predefinedReasons: ['serverRules']
                };
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path, token: userAccessToken, fields, statusCodeExpected: 200 });
            });
        });
    });
    describe('When updating an abuse', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateAbuse(server.url, 'blabla', abuseId, {}, 401);
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateAbuse(server.url, userAccessToken, abuseId, {}, 403);
            });
        });
        it('Should fail with a bad abuse id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateAbuse(server.url, server.accessToken, 45, {}, 404);
            });
        });
        it('Should fail with a bad state', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { state: 5 };
                yield extra_utils_1.updateAbuse(server.url, server.accessToken, abuseId, body, 400);
            });
        });
        it('Should fail with a bad moderation comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { moderationComment: 'b'.repeat(3001) };
                yield extra_utils_1.updateAbuse(server.url, server.accessToken, abuseId, body, 400);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { state: 3 };
                yield extra_utils_1.updateAbuse(server.url, server.accessToken, abuseId, body);
            });
        });
    });
    describe('When creating an abuse message', function () {
        const message = 'my super message';
        it('Should fail with an invalid abuse id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.addAbuseMessage(server.url, userAccessToken2, 888, message, 404);
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.addAbuseMessage(server.url, 'fake_token', abuseId, message, 401);
            });
        });
        it('Should fail with an invalid logged in user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.addAbuseMessage(server.url, userAccessToken2, abuseId, message, 403);
            });
        });
        it('Should fail with an invalid message', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.addAbuseMessage(server.url, userAccessToken, abuseId, 'a'.repeat(5000), 400);
            });
        });
        it('Should suceed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.addAbuseMessage(server.url, userAccessToken, abuseId, message);
                messageId = res.body.abuseMessage.id;
            });
        });
    });
    describe('When listing abuse messages', function () {
        it('Should fail with an invalid abuse id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.listAbuseMessages(server.url, userAccessToken, 888, 404);
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.listAbuseMessages(server.url, 'fake_token', abuseId, 401);
            });
        });
        it('Should fail with an invalid logged in user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.listAbuseMessages(server.url, userAccessToken2, abuseId, 403);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.listAbuseMessages(server.url, userAccessToken, abuseId);
            });
        });
    });
    describe('When deleting an abuse message', function () {
        it('Should fail with an invalid abuse id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuseMessage(server.url, userAccessToken, 888, messageId, 404);
            });
        });
        it('Should fail with an invalid message id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuseMessage(server.url, userAccessToken, abuseId, 888, 404);
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuseMessage(server.url, 'fake_token', abuseId, messageId, 401);
            });
        });
        it('Should fail with an invalid logged in user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuseMessage(server.url, userAccessToken2, abuseId, messageId, 403);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuseMessage(server.url, userAccessToken, abuseId, messageId);
            });
        });
    });
    describe('When deleting a video abuse', function () {
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuse(server.url, 'blabla', abuseId, 401);
            });
        });
        it('Should fail with a non admin user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuse(server.url, userAccessToken, abuseId, 403);
            });
        });
        it('Should fail with a bad abuse id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuse(server.url, server.accessToken, 45, 404);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteAbuse(server.url, server.accessToken, abuseId);
            });
        });
    });
    describe('When trying to manage messages of a remote abuse', function () {
        let remoteAbuseId;
        let anotherServer;
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                anotherServer = yield extra_utils_1.flushAndRunServer(2);
                yield extra_utils_1.setAccessTokensToServers([anotherServer]);
                yield extra_utils_1.doubleFollow(anotherServer, server);
                const server2VideoId = yield extra_utils_1.getVideoIdFromUUID(anotherServer.url, server.video.uuid);
                yield extra_utils_1.reportAbuse({
                    url: anotherServer.url,
                    token: anotherServer.accessToken,
                    reason: 'remote server',
                    videoId: server2VideoId
                });
                yield extra_utils_1.waitJobs([server, anotherServer]);
                const res = yield extra_utils_1.getAdminAbusesList({ url: server.url, token: server.accessToken, sort: '-createdAt' });
                remoteAbuseId = res.body.data[0].id;
            });
        });
        it('Should fail when listing abuse messages of a remote abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.listAbuseMessages(server.url, server.accessToken, remoteAbuseId, 400);
            });
        });
        it('Should fail when creating abuse message of a remote abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.addAbuseMessage(server.url, server.accessToken, remoteAbuseId, 'message', 400);
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.cleanupTests([anotherServer]);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
