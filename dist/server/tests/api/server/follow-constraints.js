"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const login_1 = require("../../../../shared/extra-utils/users/login");
const users_1 = require("../../../../shared/extra-utils/users/users");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
describe('Test follow constraints', function () {
    let servers = [];
    let video1UUID;
    let video2UUID;
    let userAccessToken;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video server 1' });
                video1UUID = res.body.video.uuid;
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video server 2' });
                video2UUID = res.body.video.uuid;
            }
            const user = {
                username: 'user1',
                password: 'super_password'
            };
            yield users_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
            userAccessToken = yield login_1.userLogin(servers[0], user);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('With a followed instance', function () {
        describe('With an unlogged user', function () {
            it('Should get the local video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideo(servers[0].url, video1UUID, http_error_codes_1.HttpStatusCode.OK_200);
                });
            });
            it('Should get the remote video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideo(servers[0].url, video2UUID, http_error_codes_1.HttpStatusCode.OK_200);
                });
            });
            it('Should list local account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, undefined, 'root@localhost:' + servers[0].port, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list remote account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, undefined, 'root@localhost:' + servers[1].port, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list local channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[0].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, undefined, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list remote channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[1].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, undefined, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
        });
        describe('With a logged user', function () {
            it('Should get the local video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken, video1UUID, http_error_codes_1.HttpStatusCode.OK_200);
                });
            });
            it('Should get the remote video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken, video2UUID, http_error_codes_1.HttpStatusCode.OK_200);
                });
            });
            it('Should list local account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, userAccessToken, 'root@localhost:' + servers[0].port, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list remote account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, userAccessToken, 'root@localhost:' + servers[1].port, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list local channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[0].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, userAccessToken, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list remote channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[1].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, userAccessToken, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
        });
    });
    describe('With a non followed instance', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield follows_1.unfollow(servers[0].url, servers[0].accessToken, servers[1]);
            });
        });
        describe('With an unlogged user', function () {
            it('Should get the local video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideo(servers[0].url, video1UUID, http_error_codes_1.HttpStatusCode.OK_200);
                });
            });
            it('Should not get the remote video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideo(servers[0].url, video2UUID, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
                });
            });
            it('Should list local account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, undefined, 'root@localhost:' + servers[0].port, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should not list remote account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, undefined, 'root@localhost:' + servers[1].port, 0, 5);
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.have.lengthOf(0);
                });
            });
            it('Should list local channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[0].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, undefined, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should not list remote channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[1].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, undefined, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.have.lengthOf(0);
                });
            });
        });
        describe('With a logged user', function () {
            it('Should get the local video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken, video1UUID, http_error_codes_1.HttpStatusCode.OK_200);
                });
            });
            it('Should get the remote video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.getVideoWithToken(servers[0].url, userAccessToken, video2UUID, http_error_codes_1.HttpStatusCode.OK_200);
                });
            });
            it('Should list local account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, userAccessToken, 'root@localhost:' + servers[0].port, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list remote account videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.getAccountVideos(servers[0].url, userAccessToken, 'root@localhost:' + servers[1].port, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list local channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[0].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, userAccessToken, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
            it('Should list remote channel videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const videoChannelName = 'root_channel@localhost:' + servers[1].port;
                    const res = yield extra_utils_1.getVideoChannelVideos(servers[0].url, userAccessToken, videoChannelName, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
