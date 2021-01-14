"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const expect = chai.expect;
describe('Test live constraints', function () {
    let servers = [];
    let userId;
    let userAccessToken;
    let userChannelId;
    function createLiveWrapper(saveReplay) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const liveAttributes = {
                name: 'user live',
                channelId: userChannelId,
                privacy: 1,
                saveReplay
            };
            const res = yield extra_utils_1.createLive(servers[0].url, userAccessToken, liveAttributes);
            return res.body.video.uuid;
        });
    }
    function checkSaveReplay(videoId, resolutions = [720]) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videoId);
                const video = res.body;
                expect(video.isLive).to.be.false;
                expect(video.duration).to.be.greaterThan(0);
            }
            yield extra_utils_1.checkLiveCleanup(servers[0], videoId, resolutions);
        });
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                live: {
                    enabled: true,
                    allowReplay: true,
                    transcoding: {
                        enabled: false
                    }
                }
            });
            {
                const user = { username: 'user1', password: 'superpassword' };
                const res = yield extra_utils_1.createUser({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    username: user.username,
                    password: user.password
                });
                userId = res.body.user.id;
                userAccessToken = yield extra_utils_1.userLogin(servers[0], user);
                const resMe = yield extra_utils_1.getMyUserInformation(servers[0].url, userAccessToken);
                userChannelId = resMe.body.videoChannels[0].id;
                yield extra_utils_1.updateUser({
                    url: servers[0].url,
                    userId,
                    accessToken: servers[0].accessToken,
                    videoQuota: 1,
                    videoQuotaDaily: -1
                });
            }
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should not have size limit if save replay is disabled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const userVideoLiveoId = yield createLiveWrapper(false);
            yield extra_utils_1.runAndTestFfmpegStreamError(servers[0].url, userAccessToken, userVideoLiveoId, false);
        });
    });
    it('Should have size limit depending on user global quota if save replay is enabled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.wait(5000);
            const userVideoLiveoId = yield createLiveWrapper(true);
            yield extra_utils_1.runAndTestFfmpegStreamError(servers[0].url, userAccessToken, userVideoLiveoId, true);
            yield extra_utils_1.waitJobs(servers);
            yield checkSaveReplay(userVideoLiveoId);
        });
    });
    it('Should have size limit depending on user daily quota if save replay is enabled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.wait(5000);
            yield extra_utils_1.updateUser({
                url: servers[0].url,
                userId,
                accessToken: servers[0].accessToken,
                videoQuota: -1,
                videoQuotaDaily: 1
            });
            const userVideoLiveoId = yield createLiveWrapper(true);
            yield extra_utils_1.runAndTestFfmpegStreamError(servers[0].url, userAccessToken, userVideoLiveoId, true);
            yield extra_utils_1.waitJobs(servers);
            yield checkSaveReplay(userVideoLiveoId);
        });
    });
    it('Should succeed without quota limit', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.wait(5000);
            yield extra_utils_1.updateUser({
                url: servers[0].url,
                userId,
                accessToken: servers[0].accessToken,
                videoQuota: 10 * 1000 * 1000,
                videoQuotaDaily: -1
            });
            const userVideoLiveoId = yield createLiveWrapper(true);
            yield extra_utils_1.runAndTestFfmpegStreamError(servers[0].url, userAccessToken, userVideoLiveoId, false);
        });
    });
    it('Should have max duration limit', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                live: {
                    enabled: true,
                    allowReplay: true,
                    maxDuration: 1,
                    transcoding: {
                        enabled: true,
                        resolutions: {
                            '240p': true,
                            '360p': true,
                            '480p': true,
                            '720p': true,
                            '1080p': true,
                            '2160p': true
                        }
                    }
                }
            });
            const userVideoLiveoId = yield createLiveWrapper(true);
            yield extra_utils_1.runAndTestFfmpegStreamError(servers[0].url, userAccessToken, userVideoLiveoId, true);
            yield extra_utils_1.waitJobs(servers);
            yield checkSaveReplay(userVideoLiveoId, [720, 480, 360, 240]);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
