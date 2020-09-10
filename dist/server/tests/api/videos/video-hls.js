"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const path_1 = require("path");
const constants_1 = require("../../../initializers/constants");
const expect = chai.expect;
function checkHlsPlaylist(servers, videoUUID, hlsOnly, resolutions = [240, 360, 480, 720]) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        for (const server of servers) {
            const resVideoDetails = yield extra_utils_1.getVideo(server.url, videoUUID);
            const videoDetails = resVideoDetails.body;
            const baseUrl = `http://${videoDetails.account.host}`;
            expect(videoDetails.streamingPlaylists).to.have.lengthOf(1);
            const hlsPlaylist = videoDetails.streamingPlaylists.find(p => p.type === 1);
            expect(hlsPlaylist).to.not.be.undefined;
            const hlsFiles = hlsPlaylist.files;
            expect(hlsFiles).to.have.lengthOf(resolutions.length);
            if (hlsOnly)
                expect(videoDetails.files).to.have.lengthOf(0);
            else
                expect(videoDetails.files).to.have.lengthOf(resolutions.length);
            for (const resolution of resolutions) {
                const file = hlsFiles.find(f => f.resolution.id === resolution);
                expect(file).to.not.be.undefined;
                expect(file.magnetUri).to.have.lengthOf.above(2);
                expect(file.torrentUrl).to.equal(`${baseUrl}/static/torrents/${videoDetails.uuid}-${file.resolution.id}-hls.torrent`);
                expect(file.fileUrl).to.equal(`${baseUrl}/static/streaming-playlists/hls/${videoDetails.uuid}/${videoDetails.uuid}-${file.resolution.id}-fragmented.mp4`);
                expect(file.resolution.label).to.equal(resolution + 'p');
                yield extra_utils_1.makeRawRequest(file.torrentUrl, 200);
                yield extra_utils_1.makeRawRequest(file.fileUrl, 200);
                const torrent = yield extra_utils_1.webtorrentAdd(file.magnetUri, true);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).to.exist.and.to.not.equal('');
            }
            {
                const res = yield extra_utils_1.getPlaylist(hlsPlaylist.playlistUrl);
                const masterPlaylist = res.text;
                for (const resolution of resolutions) {
                    const reg = new RegExp('#EXT-X-STREAM-INF:BANDWIDTH=\\d+,RESOLUTION=\\d+x' + resolution + ',FRAME-RATE=\\d+,CODECS="avc1.64001f,mp4a.40.2"');
                    expect(masterPlaylist).to.match(reg);
                    expect(masterPlaylist).to.contain(`${resolution}.m3u8`);
                    expect(masterPlaylist).to.contain(`${resolution}.m3u8`);
                }
            }
            {
                for (const resolution of resolutions) {
                    const res = yield extra_utils_1.getPlaylist(`${baseUrl}/static/streaming-playlists/hls/${videoUUID}/${resolution}.m3u8`);
                    const subPlaylist = res.text;
                    expect(subPlaylist).to.contain(`${videoUUID}-${resolution}-fragmented.mp4`);
                }
            }
            {
                const baseUrlAndPath = baseUrl + '/static/streaming-playlists/hls';
                for (const resolution of resolutions) {
                    yield extra_utils_1.checkSegmentHash(baseUrlAndPath, baseUrlAndPath, videoUUID, resolution, hlsPlaylist);
                }
            }
        }
    });
}
describe('Test HLS videos', function () {
    let servers = [];
    let videoUUID = '';
    let videoAudioUUID = '';
    function runTestSuite(hlsOnly) {
        it('Should upload a video and transcode it to HLS', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video 1', fixture: 'video_short.webm' });
                videoUUID = res.body.video.uuid;
                yield extra_utils_1.waitJobs(servers);
                yield checkHlsPlaylist(servers, videoUUID, hlsOnly);
            });
        });
        it('Should upload an audio file and transcode it to HLS', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video audio', fixture: 'sample.ogg' });
                videoAudioUUID = res.body.video.uuid;
                yield extra_utils_1.waitJobs(servers);
                yield checkHlsPlaylist(servers, videoAudioUUID, hlsOnly, [constants_1.DEFAULT_AUDIO_RESOLUTION]);
            });
        });
        it('Should update the video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, videoUUID, { name: 'video 1 updated' });
                yield extra_utils_1.waitJobs(servers);
                yield checkHlsPlaylist(servers, videoUUID, hlsOnly);
            });
        });
        it('Should delete videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, videoUUID);
                yield extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, videoAudioUUID);
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    yield extra_utils_1.getVideo(server.url, videoUUID, 404);
                    yield extra_utils_1.getVideo(server.url, videoAudioUUID, 404);
                }
            });
        });
        it('Should have the playlists/segment deleted from the disk', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    yield extra_utils_1.checkDirectoryIsEmpty(server, 'videos');
                    yield extra_utils_1.checkDirectoryIsEmpty(server, path_1.join('streaming-playlists', 'hls'));
                }
            });
        });
        it('Should have an empty tmp directory', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    yield extra_utils_1.checkTmpIsEmpty(server);
                }
            });
        });
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const configOverride = {
                transcoding: {
                    enabled: true,
                    allow_audio_files: true,
                    hls: {
                        enabled: true
                    }
                }
            };
            servers = yield extra_utils_1.flushAndRunMultipleServers(2, configOverride);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('With WebTorrent & HLS enabled', function () {
        runTestSuite(false);
    });
    describe('With only HLS enabled', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                    transcoding: {
                        enabled: true,
                        allowAudioFiles: true,
                        resolutions: {
                            '240p': true,
                            '360p': true,
                            '480p': true,
                            '720p': true,
                            '1080p': true,
                            '2160p': true
                        },
                        hls: {
                            enabled: true
                        },
                        webtorrent: {
                            enabled: false
                        }
                    }
                });
            });
        });
        runTestSuite(true);
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
