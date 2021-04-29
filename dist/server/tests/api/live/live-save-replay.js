"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const extra_utils_1 = require("../../../../shared/extra-utils");
const expect = chai.expect;
describe('Save replay setting', function () {
    let servers = [];
    let liveVideoUUID;
    let ffmpegCommand;
    function createLiveWrapper(saveReplay) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (liveVideoUUID) {
                try {
                    yield extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                    yield extra_utils_1.waitJobs(servers);
                }
                catch (_a) { }
            }
            const attributes = {
                channelId: servers[0].videoChannel.id,
                privacy: 1,
                name: 'my super live',
                saveReplay
            };
            const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, attributes);
            return res.body.video.uuid;
        });
    }
    function checkVideosExist(videoId, existsInList, getStatus) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const length = existsInList ? 1 : 0;
                const resVideos = yield extra_utils_1.getVideosList(server.url);
                expect(resVideos.body.data).to.have.lengthOf(length);
                expect(resVideos.body.total).to.equal(length);
                if (getStatus) {
                    yield extra_utils_1.getVideo(server.url, videoId, getStatus);
                }
            }
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
    function waitUntilLivePublishedOnAllServers(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, videoId);
            }
        });
    }
    function waitUntilLiveSavedOnAllServers(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                yield extra_utils_1.waitUntilLiveSaved(server.url, server.accessToken, videoId);
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
                        enabled: false,
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
    describe('With save replay disabled', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
            });
        });
        it('Should correctly create and federate the "waiting for stream" live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                liveVideoUUID = yield createLiveWrapper(false);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, false, http_error_codes_1.HttpStatusCode.OK_200);
                yield checkVideoState(liveVideoUUID, 4);
            });
        });
        it('Should correctly have updated the live and federated it when streaming in the live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                ffmpegCommand = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield waitUntilLivePublishedOnAllServers(liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, true, http_error_codes_1.HttpStatusCode.OK_200);
                yield checkVideoState(liveVideoUUID, 1);
            });
        });
        it('Should correctly delete the video files after the stream ended', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                yield extra_utils_1.stopFfmpeg(ffmpegCommand);
                for (const server of servers) {
                    yield extra_utils_1.waitUntilLiveEnded(server.url, server.accessToken, liveVideoUUID);
                }
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, false, http_error_codes_1.HttpStatusCode.OK_200);
                yield checkVideoState(liveVideoUUID, 5);
                yield extra_utils_1.checkLiveCleanup(servers[0], liveVideoUUID, []);
            });
        });
        it('Should correctly terminate the stream on blacklist and delete the live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                liveVideoUUID = yield createLiveWrapper(false);
                ffmpegCommand = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield waitUntilLivePublishedOnAllServers(liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, true, http_error_codes_1.HttpStatusCode.OK_200);
                yield Promise.all([
                    extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, liveVideoUUID, 'bad live', true),
                    extra_utils_1.testFfmpegStreamError(ffmpegCommand, true)
                ]);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, false);
                yield extra_utils_1.getVideo(servers[0].url, liveVideoUUID, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
                yield extra_utils_1.getVideo(servers[1].url, liveVideoUUID, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                yield extra_utils_1.wait(5000);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.checkLiveCleanup(servers[0], liveVideoUUID, []);
            });
        });
        it('Should correctly terminate the stream on delete and delete the video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                liveVideoUUID = yield createLiveWrapper(false);
                ffmpegCommand = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield waitUntilLivePublishedOnAllServers(liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, true, http_error_codes_1.HttpStatusCode.OK_200);
                yield Promise.all([
                    extra_utils_1.testFfmpegStreamError(ffmpegCommand, true),
                    extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, liveVideoUUID)
                ]);
                yield extra_utils_1.wait(5000);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, false, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                yield extra_utils_1.checkLiveCleanup(servers[0], liveVideoUUID, []);
            });
        });
    });
    describe('With save replay enabled', function () {
        it('Should correctly create and federate the "waiting for stream" live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                liveVideoUUID = yield createLiveWrapper(true);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, false, http_error_codes_1.HttpStatusCode.OK_200);
                yield checkVideoState(liveVideoUUID, 4);
            });
        });
        it('Should correctly have updated the live and federated it when streaming in the live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                ffmpegCommand = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield waitUntilLivePublishedOnAllServers(liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, true, http_error_codes_1.HttpStatusCode.OK_200);
                yield checkVideoState(liveVideoUUID, 1);
            });
        });
        it('Should correctly have saved the live and federated it after the streaming', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.stopFfmpeg(ffmpegCommand);
                yield waitUntilLiveSavedOnAllServers(liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, true, http_error_codes_1.HttpStatusCode.OK_200);
                yield checkVideoState(liveVideoUUID, 1);
            });
        });
        it('Should update the saved live and correctly federate the updated attributes', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, liveVideoUUID, { name: 'video updated' });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideo(server.url, liveVideoUUID);
                    expect(res.body.name).to.equal('video updated');
                    expect(res.body.isLive).to.be.false;
                }
            });
        });
        it('Should have cleaned up the live files', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkLiveCleanup(servers[0], liveVideoUUID, [720]);
            });
        });
        it('Should correctly terminate the stream on blacklist and blacklist the saved replay video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                liveVideoUUID = yield createLiveWrapper(true);
                ffmpegCommand = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield waitUntilLivePublishedOnAllServers(liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, true, http_error_codes_1.HttpStatusCode.OK_200);
                yield Promise.all([
                    extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, liveVideoUUID, 'bad live', true),
                    extra_utils_1.testFfmpegStreamError(ffmpegCommand, true)
                ]);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, false);
                yield extra_utils_1.getVideo(servers[0].url, liveVideoUUID, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
                yield extra_utils_1.getVideo(servers[1].url, liveVideoUUID, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                yield extra_utils_1.wait(5000);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.checkLiveCleanup(servers[0], liveVideoUUID, [720]);
            });
        });
        it('Should correctly terminate the stream on delete and delete the video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                liveVideoUUID = yield createLiveWrapper(true);
                ffmpegCommand = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield waitUntilLivePublishedOnAllServers(liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, true, http_error_codes_1.HttpStatusCode.OK_200);
                yield Promise.all([
                    extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, liveVideoUUID),
                    extra_utils_1.testFfmpegStreamError(ffmpegCommand, true)
                ]);
                yield extra_utils_1.wait(5000);
                yield extra_utils_1.waitJobs(servers);
                yield checkVideosExist(liveVideoUUID, false, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                yield extra_utils_1.checkLiveCleanup(servers[0], liveVideoUUID, []);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
