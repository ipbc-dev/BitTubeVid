"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const path_1 = require("path");
const ffprobe_utils_1 = require("@server/helpers/ffprobe-utils");
const socket_io_1 = require("@shared/extra-utils/socket/socket-io");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const extra_utils_1 = require("../../../../shared/extra-utils");
const expect = chai.expect;
describe('Test live', function () {
    let servers = [];
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
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('Live creation, update and delete', function () {
        let liveVideoUUID;
        it('Should create a live with the appropriate parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const attributes = {
                    category: 1,
                    licence: 2,
                    language: 'fr',
                    description: 'super live description',
                    support: 'support field',
                    channelId: servers[0].videoChannel.id,
                    nsfw: false,
                    waitTranscoding: false,
                    name: 'my super live',
                    tags: ['tag1', 'tag2'],
                    commentsEnabled: false,
                    downloadEnabled: false,
                    saveReplay: true,
                    privacy: 1,
                    previewfile: 'video_short1-preview.webm.jpg',
                    thumbnailfile: 'video_short1.webm.jpg'
                };
                const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, attributes);
                liveVideoUUID = res.body.video.uuid;
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const resVideo = yield extra_utils_1.getVideo(server.url, liveVideoUUID);
                    const video = resVideo.body;
                    expect(video.category.id).to.equal(1);
                    expect(video.licence.id).to.equal(2);
                    expect(video.language.id).to.equal('fr');
                    expect(video.description).to.equal('super live description');
                    expect(video.support).to.equal('support field');
                    expect(video.channel.name).to.equal(servers[0].videoChannel.name);
                    expect(video.channel.host).to.equal(servers[0].videoChannel.host);
                    expect(video.isLive).to.be.true;
                    expect(video.nsfw).to.be.false;
                    expect(video.waitTranscoding).to.be.false;
                    expect(video.name).to.equal('my super live');
                    expect(video.tags).to.deep.equal(['tag1', 'tag2']);
                    expect(video.commentsEnabled).to.be.false;
                    expect(video.downloadEnabled).to.be.false;
                    expect(video.privacy.id).to.equal(1);
                    yield extra_utils_1.testImage(server.url, 'video_short1-preview.webm', video.previewPath);
                    yield extra_utils_1.testImage(server.url, 'video_short1.webm', video.thumbnailPath);
                    const resLive = yield extra_utils_1.getLive(server.url, server.accessToken, liveVideoUUID);
                    const live = resLive.body;
                    if (server.url === servers[0].url) {
                        expect(live.rtmpUrl).to.equal('rtmp://' + server.hostname + ':' + servers[0].rtmpPort + '/live');
                        expect(live.streamKey).to.not.be.empty;
                    }
                    else {
                        expect(live.rtmpUrl).to.be.null;
                        expect(live.streamKey).to.be.null;
                    }
                    expect(live.saveReplay).to.be.true;
                }
            });
        });
        it('Should have a default preview and thumbnail', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const attributes = {
                    name: 'default live thumbnail',
                    channelId: servers[0].videoChannel.id,
                    privacy: 2,
                    nsfw: true
                };
                const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, attributes);
                const videoId = res.body.video.uuid;
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const resVideo = yield extra_utils_1.getVideo(server.url, videoId);
                    const video = resVideo.body;
                    expect(video.privacy.id).to.equal(2);
                    expect(video.nsfw).to.be.true;
                    yield extra_utils_1.makeRawRequest(server.url + video.thumbnailPath, http_error_codes_1.HttpStatusCode.OK_200);
                    yield extra_utils_1.makeRawRequest(server.url + video.previewPath, http_error_codes_1.HttpStatusCode.OK_200);
                }
            });
        });
        it('Should not have the live listed since nobody streams into', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.have.lengthOf(0);
                }
            });
        });
        it('Should not be able to update a live of another server', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateLive(servers[1].url, servers[1].accessToken, liveVideoUUID, { saveReplay: false }, http_error_codes_1.HttpStatusCode.FORBIDDEN_403);
            });
        });
        it('Should update the live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.updateLive(servers[0].url, servers[0].accessToken, liveVideoUUID, { saveReplay: false });
                yield extra_utils_1.waitJobs(servers);
            });
        });
        it('Have the live updated', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getLive(server.url, server.accessToken, liveVideoUUID);
                    const live = res.body;
                    if (server.url === servers[0].url) {
                        expect(live.rtmpUrl).to.equal('rtmp://' + server.hostname + ':' + servers[0].rtmpPort + '/live');
                        expect(live.streamKey).to.not.be.empty;
                    }
                    else {
                        expect(live.rtmpUrl).to.be.null;
                        expect(live.streamKey).to.be.null;
                    }
                    expect(live.saveReplay).to.be.false;
                }
            });
        });
        it('Delete the live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
            });
        });
        it('Should have the live deleted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    yield extra_utils_1.getVideo(server.url, liveVideoUUID, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                    yield extra_utils_1.getLive(server.url, server.accessToken, liveVideoUUID, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                }
            });
        });
    });
    describe('Stream checks', function () {
        let liveVideo;
        let rtmpUrl;
        before(function () {
            rtmpUrl = 'rtmp://' + servers[0].hostname + ':' + servers[0].rtmpPort + '';
        });
        function createLiveWrapper() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const liveAttributes = {
                    name: 'user live',
                    channelId: servers[0].videoChannel.id,
                    privacy: 1,
                    saveReplay: false
                };
                const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, liveAttributes);
                const uuid = res.body.video.uuid;
                const resLive = yield extra_utils_1.getLive(servers[0].url, servers[0].accessToken, uuid);
                const resVideo = yield extra_utils_1.getVideo(servers[0].url, uuid);
                return Object.assign(resVideo.body, resLive.body);
            });
        }
        it('Should not allow a stream without the appropriate path', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                liveVideo = yield createLiveWrapper();
                const command = extra_utils_1.sendRTMPStream(rtmpUrl + '/bad-live', liveVideo.streamKey);
                yield extra_utils_1.testFfmpegStreamError(command, true);
            });
        });
        it('Should not allow a stream without the appropriate stream key', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const command = extra_utils_1.sendRTMPStream(rtmpUrl + '/live', 'bad-stream-key');
                yield extra_utils_1.testFfmpegStreamError(command, true);
            });
        });
        it('Should succeed with the correct params', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const command = extra_utils_1.sendRTMPStream(rtmpUrl + '/live', liveVideo.streamKey);
                yield extra_utils_1.testFfmpegStreamError(command, false);
            });
        });
        it('Should list this live now someone stream into it', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                    const video = res.body.data[0];
                    expect(video.name).to.equal('user live');
                    expect(video.isLive).to.be.true;
                }
            });
        });
        it('Should not allow a stream on a live that was blacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                liveVideo = yield createLiveWrapper();
                yield extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, liveVideo.uuid);
                const command = extra_utils_1.sendRTMPStream(rtmpUrl + '/live', liveVideo.streamKey);
                yield extra_utils_1.testFfmpegStreamError(command, true);
            });
        });
        it('Should not allow a stream on a live that was deleted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                liveVideo = yield createLiveWrapper();
                yield extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, liveVideo.uuid);
                const command = extra_utils_1.sendRTMPStream(rtmpUrl + '/live', liveVideo.streamKey);
                yield extra_utils_1.testFfmpegStreamError(command, true);
            });
        });
    });
    describe('Live transcoding', function () {
        let liveVideoId;
        function createLiveWrapper(saveReplay) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const liveAttributes = {
                    name: 'live video',
                    channelId: servers[0].videoChannel.id,
                    privacy: 1,
                    saveReplay
                };
                const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, liveAttributes);
                return res.body.video.uuid;
            });
        }
        function testVideoResolutions(liveVideoId, resolutions) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const resList = yield extra_utils_1.getVideosList(server.url);
                    const videos = resList.body.data;
                    expect(videos.find(v => v.uuid === liveVideoId)).to.exist;
                    const resVideo = yield extra_utils_1.getVideo(server.url, liveVideoId);
                    const video = resVideo.body;
                    expect(video.streamingPlaylists).to.have.lengthOf(1);
                    const hlsPlaylist = video.streamingPlaylists.find(s => s.type === 1);
                    expect(hlsPlaylist).to.exist;
                    expect(hlsPlaylist.files).to.have.lengthOf(0);
                    yield extra_utils_1.checkResolutionsInMasterPlaylist(hlsPlaylist.playlistUrl, resolutions);
                    for (let i = 0; i < resolutions.length; i++) {
                        const segmentNum = 3;
                        const segmentName = `${i}-00000${segmentNum}.ts`;
                        yield extra_utils_1.waitUntilLiveSegmentGeneration(servers[0], video.uuid, i, segmentNum);
                        const res = yield extra_utils_1.getPlaylist(`${servers[0].url}/static/streaming-playlists/hls/${video.uuid}/${i}.m3u8`);
                        const subPlaylist = res.text;
                        expect(subPlaylist).to.contain(segmentName);
                        const baseUrlAndPath = servers[0].url + '/static/streaming-playlists/hls';
                        yield extra_utils_1.checkLiveSegmentHash(baseUrlAndPath, video.uuid, segmentName, hlsPlaylist);
                    }
                }
            });
        }
        function updateConf(resolutions) {
            return extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                live: {
                    enabled: true,
                    allowReplay: true,
                    maxDuration: -1,
                    transcoding: {
                        enabled: true,
                        resolutions: {
                            '240p': resolutions.includes(240),
                            '360p': resolutions.includes(360),
                            '480p': resolutions.includes(480),
                            '720p': resolutions.includes(720),
                            '1080p': resolutions.includes(1080),
                            '2160p': resolutions.includes(2160)
                        }
                    }
                }
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield updateConf([]);
            });
        });
        it('Should enable transcoding without additional resolutions', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                liveVideoId = yield createLiveWrapper(false);
                const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitJobs(servers);
                yield testVideoResolutions(liveVideoId, [720]);
                yield extra_utils_1.stopFfmpeg(command);
            });
        });
        it('Should enable transcoding with some resolutions', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const resolutions = [240, 480];
                yield updateConf(resolutions);
                liveVideoId = yield createLiveWrapper(false);
                const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitJobs(servers);
                yield testVideoResolutions(liveVideoId, resolutions);
                yield extra_utils_1.stopFfmpeg(command);
            });
        });
        it('Should enable transcoding with some resolutions and correctly save them', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(200000);
                const resolutions = [240, 360, 720];
                yield updateConf(resolutions);
                liveVideoId = yield createLiveWrapper(true);
                const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoId, 'video_short2.webm');
                yield extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitJobs(servers);
                yield testVideoResolutions(liveVideoId, resolutions);
                yield extra_utils_1.stopFfmpeg(command);
                yield extra_utils_1.waitUntilLiveEnded(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoId);
                const bitrateLimits = {
                    720: 5000 * 1000,
                    360: 1100 * 1000,
                    240: 600 * 1000
                };
                for (const server of servers) {
                    const resVideo = yield extra_utils_1.getVideo(server.url, liveVideoId);
                    const video = resVideo.body;
                    expect(video.state.id).to.equal(1);
                    expect(video.duration).to.be.greaterThan(1);
                    expect(video.files).to.have.lengthOf(0);
                    const hlsPlaylist = video.streamingPlaylists.find(s => s.type === 1);
                    yield extra_utils_1.makeRawRequest(hlsPlaylist.playlistUrl, http_error_codes_1.HttpStatusCode.OK_200);
                    yield extra_utils_1.makeRawRequest(hlsPlaylist.segmentsSha256Url, http_error_codes_1.HttpStatusCode.OK_200);
                    expect(hlsPlaylist.files).to.have.lengthOf(resolutions.length);
                    for (const resolution of resolutions) {
                        const file = hlsPlaylist.files.find(f => f.resolution.id === resolution);
                        expect(file).to.exist;
                        expect(file.size).to.be.greaterThan(1);
                        if (resolution >= 720) {
                            expect(file.fps).to.be.approximately(60, 2);
                        }
                        else {
                            expect(file.fps).to.be.approximately(30, 2);
                        }
                        const filename = `${video.uuid}-${resolution}-fragmented.mp4`;
                        const segmentPath = extra_utils_1.buildServerDirectory(servers[0], path_1.join('streaming-playlists', 'hls', video.uuid, filename));
                        const probe = yield ffprobe_utils_1.ffprobePromise(segmentPath);
                        const videoStream = yield ffprobe_utils_1.getVideoStreamFromFile(segmentPath, probe);
                        expect(probe.format.bit_rate).to.be.below(bitrateLimits[videoStream.height]);
                        yield extra_utils_1.makeRawRequest(file.torrentUrl, http_error_codes_1.HttpStatusCode.OK_200);
                        yield extra_utils_1.makeRawRequest(file.fileUrl, http_error_codes_1.HttpStatusCode.OK_200);
                    }
                }
            });
        });
        it('Should correctly have cleaned up the live files', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.checkLiveCleanup(servers[0], liveVideoId, [240, 360, 720]);
            });
        });
    });
    describe('Live views', function () {
        let liveVideoId;
        let command;
        function countViews(expected) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideo(server.url, liveVideoId);
                    const video = res.body;
                    expect(video.views).to.equal(expected);
                }
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const liveAttributes = {
                    name: 'live video',
                    channelId: servers[0].videoChannel.id,
                    privacy: 1
                };
                const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, liveAttributes);
                liveVideoId = res.body.video.uuid;
                command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoId);
                yield extra_utils_1.waitJobs(servers);
            });
        });
        it('Should display no views for a live', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield countViews(0);
            });
        });
        it('Should view a live twice and display 1 view', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.viewVideo(servers[0].url, liveVideoId);
                yield extra_utils_1.viewVideo(servers[0].url, liveVideoId);
                yield extra_utils_1.wait(7000);
                yield extra_utils_1.waitJobs(servers);
                yield countViews(1);
            });
        });
        it('Should wait and display 0 views', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.wait(7000);
                yield extra_utils_1.waitJobs(servers);
                yield countViews(0);
            });
        });
        it('Should view a live on a remote and on local and display 2 views', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.viewVideo(servers[0].url, liveVideoId);
                yield extra_utils_1.viewVideo(servers[1].url, liveVideoId);
                yield extra_utils_1.viewVideo(servers[1].url, liveVideoId);
                yield extra_utils_1.wait(7000);
                yield extra_utils_1.waitJobs(servers);
                yield countViews(2);
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.stopFfmpeg(command);
            });
        });
    });
    describe('Live socket messages', function () {
        function createLiveWrapper() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const liveAttributes = {
                    name: 'live video',
                    channelId: servers[0].videoChannel.id,
                    privacy: 1
                };
                const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, liveAttributes);
                return res.body.video.uuid;
            });
        }
        it('Should correctly send a message when the live starts and ends', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const localStateChanges = [];
                const remoteStateChanges = [];
                const liveVideoUUID = yield createLiveWrapper();
                yield extra_utils_1.waitJobs(servers);
                {
                    const videoId = yield extra_utils_1.getVideoIdFromUUID(servers[0].url, liveVideoUUID);
                    const localSocket = socket_io_1.getLiveNotificationSocket(servers[0].url);
                    localSocket.on('state-change', data => localStateChanges.push(data.state));
                    localSocket.emit('subscribe', { videoId });
                }
                {
                    const videoId = yield extra_utils_1.getVideoIdFromUUID(servers[1].url, liveVideoUUID);
                    const remoteSocket = socket_io_1.getLiveNotificationSocket(servers[1].url);
                    remoteSocket.on('state-change', data => remoteStateChanges.push(data.state));
                    remoteSocket.emit('subscribe', { videoId });
                }
                const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                for (const server of servers) {
                    yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, liveVideoUUID);
                }
                yield extra_utils_1.waitJobs(servers);
                for (const stateChanges of [localStateChanges, remoteStateChanges]) {
                    expect(stateChanges).to.have.length.at.least(1);
                    expect(stateChanges[stateChanges.length - 1]).to.equal(1);
                }
                yield extra_utils_1.stopFfmpeg(command);
                for (const server of servers) {
                    yield extra_utils_1.waitUntilLiveEnded(server.url, server.accessToken, liveVideoUUID);
                }
                yield extra_utils_1.waitJobs(servers);
                for (const stateChanges of [localStateChanges, remoteStateChanges]) {
                    expect(stateChanges).to.have.length.at.least(2);
                    expect(stateChanges[stateChanges.length - 1]).to.equal(5);
                }
            });
        });
        it('Should correctly send views change notification', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                let localLastVideoViews = 0;
                let remoteLastVideoViews = 0;
                const liveVideoUUID = yield createLiveWrapper();
                yield extra_utils_1.waitJobs(servers);
                {
                    const videoId = yield extra_utils_1.getVideoIdFromUUID(servers[0].url, liveVideoUUID);
                    const localSocket = socket_io_1.getLiveNotificationSocket(servers[0].url);
                    localSocket.on('views-change', data => { localLastVideoViews = data.views; });
                    localSocket.emit('subscribe', { videoId });
                }
                {
                    const videoId = yield extra_utils_1.getVideoIdFromUUID(servers[1].url, liveVideoUUID);
                    const remoteSocket = socket_io_1.getLiveNotificationSocket(servers[1].url);
                    remoteSocket.on('views-change', data => { remoteLastVideoViews = data.views; });
                    remoteSocket.emit('subscribe', { videoId });
                }
                const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                for (const server of servers) {
                    yield extra_utils_1.waitUntilLivePublished(server.url, server.accessToken, liveVideoUUID);
                }
                yield extra_utils_1.waitJobs(servers);
                expect(localLastVideoViews).to.equal(0);
                expect(remoteLastVideoViews).to.equal(0);
                yield extra_utils_1.viewVideo(servers[0].url, liveVideoUUID);
                yield extra_utils_1.viewVideo(servers[1].url, liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.wait(5000);
                yield extra_utils_1.waitJobs(servers);
                expect(localLastVideoViews).to.equal(2);
                expect(remoteLastVideoViews).to.equal(2);
                yield extra_utils_1.stopFfmpeg(command);
            });
        });
        it('Should not receive a notification after unsubscribe', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                const stateChanges = [];
                const liveVideoUUID = yield createLiveWrapper();
                yield extra_utils_1.waitJobs(servers);
                const videoId = yield extra_utils_1.getVideoIdFromUUID(servers[0].url, liveVideoUUID);
                const socket = socket_io_1.getLiveNotificationSocket(servers[0].url);
                socket.on('state-change', data => stateChanges.push(data.state));
                socket.emit('subscribe', { videoId });
                const command = yield extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoUUID);
                yield extra_utils_1.waitJobs(servers);
                expect(stateChanges).to.have.lengthOf(1);
                socket.emit('unsubscribe', { videoId });
                yield extra_utils_1.stopFfmpeg(command);
                yield extra_utils_1.waitJobs(servers);
                expect(stateChanges).to.have.lengthOf(1);
            });
        });
    });
    describe('After a server restart', function () {
        let liveVideoId;
        let liveVideoReplayId;
        function createLiveWrapper(saveReplay) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const liveAttributes = {
                    name: 'live video',
                    channelId: servers[0].videoChannel.id,
                    privacy: 1,
                    saveReplay
                };
                const res = yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, liveAttributes);
                return res.body.video.uuid;
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                liveVideoId = yield createLiveWrapper(false);
                liveVideoReplayId = yield createLiveWrapper(true);
                yield Promise.all([
                    extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoId),
                    extra_utils_1.sendRTMPStreamInVideo(servers[0].url, servers[0].accessToken, liveVideoReplayId)
                ]);
                yield Promise.all([
                    extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoId),
                    extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoReplayId)
                ]);
                yield extra_utils_1.waitUntilLiveSegmentGeneration(servers[0], liveVideoId, 0, 2);
                yield extra_utils_1.waitUntilLiveSegmentGeneration(servers[0], liveVideoReplayId, 0, 2);
                yield extra_utils_1.killallServers([servers[0]]);
                yield extra_utils_1.reRunServer(servers[0]);
                yield extra_utils_1.wait(5000);
            });
        });
        it('Should cleanup lives', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield extra_utils_1.waitUntilLiveEnded(servers[0].url, servers[0].accessToken, liveVideoId);
            });
        });
        it('Should save a live replay', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                yield extra_utils_1.waitUntilLivePublished(servers[0].url, servers[0].accessToken, liveVideoReplayId);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
