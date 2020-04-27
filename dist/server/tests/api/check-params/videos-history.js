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
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const expect = chai.expect;
describe('Test videos history API validator', function () {
    let watchingPath;
    let myHistoryPath = '/api/v1/users/me/history/videos';
    let myHistoryRemove = myHistoryPath + '/remove';
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, {});
            const videoUUID = res.body.video.uuid;
            watchingPath = '/api/v1/videos/' + videoUUID + '/watching';
        });
    });
    describe('When notifying a user is watching a video', function () {
        it('Should fail with an unauthenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = { currentTime: 5 };
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: watchingPath, fields, statusCodeExpected: 401 });
            });
        });
        it('Should fail with an incorrect video id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = { currentTime: 5 };
                const path = '/api/v1/videos/blabla/watching';
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path, fields, token: server.accessToken, statusCodeExpected: 400 });
            });
        });
        it('Should fail with an unknown video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = { currentTime: 5 };
                const path = '/api/v1/videos/d91fff41-c24d-4508-8e13-3bd5902c3b02/watching';
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path, fields, token: server.accessToken, statusCodeExpected: 404 });
            });
        });
        it('Should fail with a bad current time', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = { currentTime: 'hello' };
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: watchingPath, fields, token: server.accessToken, statusCodeExpected: 400 });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const fields = { currentTime: 5 };
                yield extra_utils_1.makePutBodyRequest({ url: server.url, path: watchingPath, fields, token: server.accessToken, statusCodeExpected: 204 });
            });
        });
    });
    describe('When listing user videos history', function () {
        it('Should fail with a bad start pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadStartPagination(server.url, myHistoryPath, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadCountPagination(server.url, myHistoryPath, server.accessToken);
            });
        });
        it('Should fail with an unauthenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, path: myHistoryPath, statusCodeExpected: 401 });
            });
        });
        it('Should succeed with the correct params', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({ url: server.url, token: server.accessToken, path: myHistoryPath, statusCodeExpected: 200 });
            });
        });
    });
    describe('When removing user videos history', function () {
        it('Should fail with an unauthenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({ url: server.url, path: myHistoryPath + '/remove', statusCodeExpected: 401 });
            });
        });
        it('Should fail with a bad beforeDate parameter', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const body = { beforeDate: '15' };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    token: server.accessToken,
                    path: myHistoryRemove,
                    fields: body,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should succeed with a valid beforeDate param', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const body = { beforeDate: new Date().toISOString() };
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    token: server.accessToken,
                    path: myHistoryRemove,
                    fields: body,
                    statusCodeExpected: 204
                });
            });
        });
        it('Should succeed without body', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePostBodyRequest({
                    url: server.url,
                    token: server.accessToken,
                    path: myHistoryRemove,
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
