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
const videos_1 = require("../../../../shared/models/videos");
const chai_1 = require("chai");
describe('Test video blacklist API validators', function () {
    let servers;
    let notBlacklistedVideoId;
    let remoteVideoUUID;
    let userAccessToken1 = '';
    let userAccessToken2 = '';
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            {
                const username = 'user1';
                const password = 'my super password';
                yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: username, password: password });
                userAccessToken1 = yield extra_utils_1.userLogin(servers[0], { username, password });
            }
            {
                const username = 'user2';
                const password = 'my super password';
                yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: username, password: password });
                userAccessToken2 = yield extra_utils_1.userLogin(servers[0], { username, password });
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, userAccessToken1, {});
                servers[0].video = res.body.video;
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, {});
                notBlacklistedVideoId = res.body.video.uuid;
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, {});
                remoteVideoUUID = res.body.video.uuid;
            }
            yield extra_utils_1.waitJobs(servers);
        });
    });
    describe('When adding a video in blacklist', function () {
        const basePath = '/api/v1/videos/';
        it('Should fail with nothing', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail with a wrong video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const wrongPath = '/api/v1/videos/blabla/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path: wrongPath, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: 'hello', fields, statusCodeExpected: 401 });
            });
        });
        it('Should fail with a non admin user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: userAccessToken2, fields, statusCodeExpected: 403 });
            });
        });
        it('Should fail with an invalid reason', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = { reason: 'a'.repeat(305) };
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail to unfederate a remote video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + remoteVideoUUID + '/blacklist';
                const fields = { unfederate: true };
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields, statusCodeExpected: 409 });
            });
        });
        it('Should succeed with the correct params', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePostBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields, statusCodeExpected: 204 });
            });
        });
    });
    describe('When updating a video in blacklist', function () {
        const basePath = '/api/v1/videos/';
        it('Should fail with a wrong video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const wrongPath = '/api/v1/videos/blabla/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path: wrongPath, token: servers[0].accessToken, fields });
            });
        });
        it('Should fail with a video not blacklisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = '/api/v1/videos/' + notBlacklistedVideoId + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields, statusCodeExpected: 404 });
            });
        });
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path, token: 'hello', fields, statusCodeExpected: 401 });
            });
        });
        it('Should fail with a non admin user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video + '/blacklist';
                const fields = {};
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path, token: userAccessToken2, fields, statusCodeExpected: 403 });
            });
        });
        it('Should fail with an invalid reason', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = { reason: 'a'.repeat(305) };
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields });
            });
        });
        it('Should succeed with the correct params', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const path = basePath + servers[0].video.uuid + '/blacklist';
                const fields = { reason: 'hello' };
                yield extra_utils_1.makePutBodyRequest({ url: servers[0].url, path, token: servers[0].accessToken, fields, statusCodeExpected: 204 });
            });
        });
    });
    describe('When getting blacklisted video', function () {
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideo(servers[0].url, servers[0].video.uuid, 401);
            });
        });
        it('Should fail with another user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken2, servers[0].video.uuid, 403);
            });
        });
        it('Should succeed with the owner authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken1, servers[0].video.uuid, 200);
                const video = res.body;
                chai_1.expect(video.blacklisted).to.be.true;
            });
        });
        it('Should succeed with an admin', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideoWithToken(servers[0].url, servers[0].accessToken, servers[0].video.uuid, 200);
                const video = res.body;
                chai_1.expect(video.blacklisted).to.be.true;
            });
        });
    });
    describe('When removing a video in blacklist', function () {
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, 'fake token', servers[0].video.uuid, 401);
            });
        });
        it('Should fail with a non admin user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, userAccessToken2, servers[0].video.uuid, 403);
            });
        });
        it('Should fail with an incorrect id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, 'hello', 400);
            });
        });
        it('Should fail with a not blacklisted video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, notBlacklistedVideoId, 404);
            });
        });
        it('Should succeed with the correct params', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, servers[0].video.uuid, 204);
            });
        });
    });
    describe('When listing videos in blacklist', function () {
        const basePath = '/api/v1/videos/blacklist/';
        it('Should fail with a non authenticated user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: servers[0].url, token: 'fake token', specialStatus: 401 });
            });
        });
        it('Should fail with a non admin user', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: servers[0].url, token: userAccessToken2, specialStatus: 403 });
            });
        });
        it('Should fail with a bad start pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadStartPagination(servers[0].url, basePath, servers[0].accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadCountPagination(servers[0].url, basePath, servers[0].accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield check_api_params_1.checkBadSortPagination(servers[0].url, basePath, servers[0].accessToken);
            });
        });
        it('Should fail with an invalid type', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, type: 0, specialStatus: 400 });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, type: videos_1.VideoBlacklistType.MANUAL });
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
