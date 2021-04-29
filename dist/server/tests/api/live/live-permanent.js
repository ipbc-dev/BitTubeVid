"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const expect = chai.expect;
describe('Permenant live', function () {
    let servers = [];
    let videoUUID;
    function createLiveWrapper(permanentLive) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const attributes = {
                channelId: servers[0].videoChannel.id,
                privacy: 1,
                name: 'my super live',
                saveReplay: false,
                permanentLive
            };
            const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, attributes);
            return res.body.video.uuid;
        });
    }
    function checkVideoState(videoId, state) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videoId);
                expect(res.body.state.id).to.equal(state);
            }
        });
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                live: {
                    enabled: true,
                    allowReplay: true,
                    maxDuration: -1,
                    transcoding: {
                        enabled: true,
                        resolutions: {
                            '240p': true,
                            '360p': true,
                            '480p': true,
                            '720p': true,
                            '1080p': true,
                            '1440p': true,
                            '2160p': true
                        }
                    }
                }
            });
        });
    });
    it('Should create a non permanent live and update it to be a permanent live', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            const videoUUID = yield createLiveWrapper(false);
            {
                const res = yield extra_utils_1.getLive(servers[0].url, servers[0].accessToken, videoUUID);
                expect(res.body.permanentLive).to.be.false;
            }
            yield extra_utils_1.updateLive(servers[0].url, servers[0].accessToken, videoUUID, { permanentLive: true });
            {
                const res = yield extra_utils_1.getLive(servers[0].url, servers[0].accessToken, videoUUID);
                expect(res.body.permanentLive).to.be.true;
            }
        });
    });
    it('Should create a permanent live', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            videoUUID = yield createLiveWrapper(true);
            const res = yield extra_utils_1.getLive(servers[0].url, servers[0].accessToken, videoUUID);
            expect(res.body.permanentLive).to.be.true;
            yield extra_utils_1.waitJobs(servers);
        });
    });
    it('Should stream into this permanent live', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, videoUUID);
            for (const server of servers) {
                yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, videoUUID);
            }
            yield checkVideoState(videoUUID, 1);
            yield extra_utils_1.stopFfmpeg(command);
            yield extra_utils_1.waitUntilLiveWaiting(servers[0].url, servers[0].accessToken, videoUUID);
            yield extra_utils_1.waitJobs(servers);
        });
    });
    it('Should not have cleaned up this live', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(40000);
            yield extra_utils_1.wait(5000);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                const videoDetails = res.body;
                expect(videoDetails.streamingPlaylists).to.have.lengthOf(1);
            }
        });
    });
    it('Should have set this live to waiting for live state', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield checkVideoState(videoUUID, 4);
        });
    });
    it('Should be able to stream again in the permanent live', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                live: {
                    enabled: true,
                    allowReplay: true,
                    maxDuration: -1,
                    transcoding: {
                        enabled: true,
                        resolutions: {
                            '240p': false,
                            '360p': false,
                            '480p': false,
                            '720p': false,
                            '1080p': false,
                            '1440p': false,
                            '2160p': false
                        }
                    }
                }
            });
            const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, videoUUID);
            for (const server of servers) {
                yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, videoUUID);
            }
            yield checkVideoState(videoUUID, 1);
            const count = yield extra_utils_1.getPlaylistsCount(servers[0], videoUUID);
            expect(count).to.equal(2);
            yield extra_utils_1.stopFfmpeg(command);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
