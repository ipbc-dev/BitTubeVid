"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const path_1 = require("path");
const ffmpeg_utils_1 = require("@server/helpers/ffmpeg-utils");
const expect = chai.expect;
describe('Test audio only video transcoding', function () {
    let servers = [];
    let videoUUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const configOverride = {
                transcoding: {
                    enabled: true,
                    resolutions: {
                        '0p': true,
                        '240p': true,
                        '360p': false,
                        '480p': false,
                        '720p': false,
                        '1080p': false,
                        '2160p': false
                    },
                    hls: {
                        enabled: true
                    },
                    webtorrent: {
                        enabled: true
                    }
                }
            };
            servers = yield extra_utils_1.flushAndRunMultipleServers(2, configOverride);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should upload a video and transcode it', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const resUpload = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'audio only' });
            videoUUID = resUpload.body.video.uuid;
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                const video = res.body;
                expect(video.streamingPlaylists).to.have.lengthOf(1);
                for (const files of [video.files, video.streamingPlaylists[0].files]) {
                    expect(files).to.have.lengthOf(3);
                    expect(files[0].resolution.id).to.equal(720);
                    expect(files[1].resolution.id).to.equal(240);
                    expect(files[2].resolution.id).to.equal(0);
                }
            }
        });
    });
    it('0p transcoded video should not have video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const paths = [
                path_1.join(extra_utils_1.root(), 'test' + servers[0].internalServerNumber, 'videos', videoUUID + '-0.mp4'),
                path_1.join(extra_utils_1.root(), 'test' + servers[0].internalServerNumber, 'streaming-playlists', 'hls', videoUUID, videoUUID + '-0-fragmented.mp4')
            ];
            for (const path of paths) {
                const { audioStream } = yield ffmpeg_utils_1.audio.get(path);
                expect(audioStream['codec_name']).to.be.equal('aac');
                expect(audioStream['bit_rate']).to.be.at.most(384 * 8000);
                const size = yield ffmpeg_utils_1.getVideoStreamSize(path);
                expect(size.height).to.equal(0);
                expect(size.width).to.equal(0);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
