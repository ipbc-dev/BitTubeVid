"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai_1 = require("chai");
const path_1 = require("path");
const ffprobe_utils_1 = require("@server/helpers/ffprobe-utils");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
function createLiveWrapper(server) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const liveAttributes = {
            name: 'live video',
            channelId: server.videoChannel.id,
            privacy: 1
        };
        const res = yield extra_utils_1.createLive(server.url, server.accessToken, liveAttributes);
        return res.body.video.uuid;
    });
}
function updateConf(server, vodProfile, liveProfile) {
    return extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
        transcoding: {
            enabled: true,
            profile: vodProfile,
            hls: {
                enabled: true
            },
            webtorrent: {
                enabled: true
            },
            resolutions: {
                '240p': true,
                '360p': false,
                '480p': false,
                '720p': true
            }
        },
        live: {
            transcoding: {
                profile: liveProfile,
                enabled: true,
                resolutions: {
                    '240p': true,
                    '360p': false,
                    '480p': false,
                    '720p': true
                }
            }
        }
    });
}
describe('Test transcoding plugins', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.setDefaultVideoChannel([server]);
            yield updateConf(server, 'default', 'default');
        });
    });
    describe('When using a plugin adding profiles to existing encoders', function () {
        function checkVideoFPS(uuid, type, fps) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideo(server.url, uuid);
                const video = res.body;
                const files = video.files.concat(...video.streamingPlaylists.map(p => p.files));
                for (const file of files) {
                    if (type === 'above') {
                        chai_1.expect(file.fps).to.be.above(fps);
                    }
                    else {
                        chai_1.expect(file.fps).to.be.below(fps);
                    }
                }
            });
        }
        function checkLiveFPS(uuid, type, fps) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const playlistUrl = `${server.url}/static/streaming-playlists/hls/${uuid}/0.m3u8`;
                const videoFPS = yield ffprobe_utils_1.getVideoFileFPS(playlistUrl);
                if (type === 'above') {
                    chai_1.expect(videoFPS).to.be.above(fps);
                }
                else {
                    chai_1.expect(videoFPS).to.be.below(fps);
                }
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.installPlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    path: extra_utils_1.getPluginTestPath('-transcoding-one')
                });
            });
        });
        it('Should have the appropriate available profiles', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getConfig(server.url);
                const config = res.body;
                chai_1.expect(config.transcoding.availableProfiles).to.have.members(['default', 'low-vod']);
                chai_1.expect(config.live.transcoding.availableProfiles).to.have.members(['default', 'low-live']);
            });
        });
        it('Should not use the plugin profile if not chosen by the admin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                const videoUUID = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'video' })).uuid;
                yield extra_utils_1.waitJobs([server]);
                yield checkVideoFPS(videoUUID, 'above', 20);
            });
        });
        it('Should use the vod profile', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                yield updateConf(server, 'low-vod', 'default');
                const videoUUID = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'video' })).uuid;
                yield extra_utils_1.waitJobs([server]);
                yield checkVideoFPS(videoUUID, 'below', 12);
            });
        });
        it('Should not use the plugin profile if not chosen by the admin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                const liveVideoId = yield createLiveWrapper(server);
                yield extra_utils_1.sendRTMPStreamInVideo(server.url, server.accessToken, liveVideoId, 'video_short2.webm');
                yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, liveVideoId);
                yield extra_utils_1.waitJobs([server]);
                yield checkLiveFPS(liveVideoId, 'above', 20);
            });
        });
        it('Should use the live profile', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                yield updateConf(server, 'low-vod', 'low-live');
                const liveVideoId = yield createLiveWrapper(server);
                yield extra_utils_1.sendRTMPStreamInVideo(server.url, server.accessToken, liveVideoId, 'video_short2.webm');
                yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, liveVideoId);
                yield extra_utils_1.waitJobs([server]);
                yield checkLiveFPS(liveVideoId, 'below', 12);
            });
        });
        it('Should default to the default profile if the specified profile does not exist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                yield extra_utils_1.uninstallPlugin({ url: server.url, accessToken: server.accessToken, npmName: 'peertube-plugin-test-transcoding-one' });
                const res = yield extra_utils_1.getConfig(server.url);
                const config = res.body;
                chai_1.expect(config.transcoding.availableProfiles).to.deep.equal(['default']);
                chai_1.expect(config.live.transcoding.availableProfiles).to.deep.equal(['default']);
                const videoUUID = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'video' })).uuid;
                yield extra_utils_1.waitJobs([server]);
                yield checkVideoFPS(videoUUID, 'above', 20);
            });
        });
    });
    describe('When using a plugin adding new encoders', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.installPlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    path: extra_utils_1.getPluginTestPath('-transcoding-two')
                });
                yield updateConf(server, 'test-vod-profile', 'test-live-profile');
            });
        });
        it('Should use the new vod encoders', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(240000);
                const videoUUID = (yield extra_utils_1.uploadVideoAndGetId({ server, videoName: 'video', fixture: 'video_short_240p.mp4' })).uuid;
                yield extra_utils_1.waitJobs([server]);
                const path = extra_utils_1.buildServerDirectory(server, path_1.join('videos', videoUUID + '-240.mp4'));
                const audioProbe = yield ffprobe_utils_1.getAudioStream(path);
                chai_1.expect(audioProbe.audioStream.codec_name).to.equal('opus');
                const videoProbe = yield ffprobe_utils_1.getVideoStreamFromFile(path);
                chai_1.expect(videoProbe.codec_name).to.equal('vp9');
            });
        });
        it('Should use the new live encoders', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                const liveVideoId = yield createLiveWrapper(server);
                yield extra_utils_1.sendRTMPStreamInVideo(server.url, server.accessToken, liveVideoId, 'video_short2.webm');
                yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, liveVideoId);
                yield extra_utils_1.waitJobs([server]);
                const playlistUrl = `${server.url}/static/streaming-playlists/hls/${liveVideoId}/0.m3u8`;
                const audioProbe = yield ffprobe_utils_1.getAudioStream(playlistUrl);
                chai_1.expect(audioProbe.audioStream.codec_name).to.equal('opus');
                const videoProbe = yield ffprobe_utils_1.getVideoStreamFromFile(playlistUrl);
                chai_1.expect(videoProbe.codec_name).to.equal('h264');
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
