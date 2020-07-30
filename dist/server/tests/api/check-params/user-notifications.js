"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const io = require("socket.io-client");
const extra_utils_1 = require("../../../../shared/extra-utils");
const check_api_params_1 = require("../../../../shared/extra-utils/requests/check-api-params");
const users_1 = require("../../../../shared/models/users");
describe('Test user notifications API validators', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    describe('When listing my notifications', function () {
        const path = '/api/v1/users/me/notifications';
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
        it('Should fail with an incorrect unread parameter', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    query: {
                        unread: 'toto'
                    },
                    token: server.accessToken,
                    statusCodeExpected: 200
                });
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
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When marking as read my notifications', function () {
        const path = '/api/v1/users/me/notifications/read';
        it('Should fail with wrong ids parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    fields: {
                        ids: ['hello']
                    },
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    fields: {
                        ids: []
                    },
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    fields: {
                        ids: 5
                    },
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    fields: {
                        ids: [5]
                    },
                    statusCodeExpected: 401
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    fields: {
                        ids: [5]
                    },
                    token: server.accessToken,
                    statusCodeExpected: 204
                });
            });
        });
    });
    describe('When marking as read my notifications', function () {
        const path = '/api/v1/users/me/notifications/read-all';
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    statusCodeExpected: 204
                });
            });
        });
    });
    describe('When updating my notification settings', function () {
        const path = '/api/v1/users/me/notification-settings';
        const correctFields = {
            newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB,
            newCommentOnMyVideo: users_1.UserNotificationSettingValue.WEB,
            videoAbuseAsModerator: users_1.UserNotificationSettingValue.WEB,
            videoAutoBlacklistAsModerator: users_1.UserNotificationSettingValue.WEB,
            blacklistOnMyVideo: users_1.UserNotificationSettingValue.WEB,
            myVideoImportFinished: users_1.UserNotificationSettingValue.WEB,
            myVideoPublished: users_1.UserNotificationSettingValue.WEB,
            commentMention: users_1.UserNotificationSettingValue.WEB,
            newFollow: users_1.UserNotificationSettingValue.WEB,
            newUserRegistration: users_1.UserNotificationSettingValue.WEB,
            newInstanceFollower: users_1.UserNotificationSettingValue.WEB,
            autoInstanceFollowing: users_1.UserNotificationSettingValue.WEB
        };
        it('Should fail with missing fields', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: { newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB },
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with incorrect field values', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const fields = extra_utils_1.immutableAssign(correctFields, { newCommentOnMyVideo: 15 });
                    yield extra_utils_1.makePutBodyRequest({
                        url: server.url,
                        path,
                        token: server.accessToken,
                        fields,
                        statusCodeExpected: 400
                    });
                }
                {
                    const fields = extra_utils_1.immutableAssign(correctFields, { newCommentOnMyVideo: 'toto' });
                    yield extra_utils_1.makePutBodyRequest({
                        url: server.url,
                        path,
                        fields,
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                }
            });
        });
        it('Should fail with a non authenticated user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: correctFields,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    fields: correctFields,
                    statusCodeExpected: 204
                });
            });
        });
    });
    describe('When connecting to my notification socket', function () {
        it('Should fail with no token', function (next) {
            const socket = io(`http://localhost:${server.port}/user-notifications`, { reconnection: false });
            socket.on('error', () => {
                socket.removeListener('error', this);
                socket.disconnect();
                next();
            });
            socket.on('connect', () => {
                socket.disconnect();
                next(new Error('Connected with a missing token.'));
            });
        });
        it('Should fail with an invalid token', function (next) {
            const socket = io(`http://localhost:${server.port}/user-notifications`, {
                query: { accessToken: 'bad_access_token' },
                reconnection: false
            });
            socket.on('error', () => {
                socket.removeListener('error', this);
                socket.disconnect();
                next();
            });
            socket.on('connect', () => {
                socket.disconnect();
                next(new Error('Connected with an invalid token.'));
            });
        });
        it('Should success with the correct token', function (next) {
            const socket = io(`http://localhost:${server.port}/user-notifications`, {
                query: { accessToken: server.accessToken },
                reconnection: false
            });
            const errorListener = socket.on('error', err => {
                next(new Error('Error in connection: ' + err));
            });
            socket.on('connect', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                socket.removeListener('error', errorListener);
                socket.disconnect();
                yield extra_utils_1.wait(500);
                next();
            }));
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
