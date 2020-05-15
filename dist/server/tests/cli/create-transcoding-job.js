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
const chai = require("chai");
const extra_utils_1 = require("../../../shared/extra-utils");
const jobs_1 = require("../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test create transcoding jobs', function () {
    let servers = [];
    let videosUUID = [];
    const config = {
        transcoding: {
            enabled: false,
            resolutions: {
                '240p': true,
                '360p': true,
                '480p': true,
                '720p': true,
                '1080p': true,
                '2160p': true
            },
            hls: {
                enabled: false
            }
        }
    };
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            for (let i = 1; i <= 5; i++) {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video' + i });
                videosUUID.push(res.body.video.uuid);
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have two video files on each server', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const videos = res.body.data;
                expect(videos).to.have.lengthOf(videosUUID.length);
                for (const video of videos) {
                    const res2 = yield extra_utils_1.getVideo(server.url, video.uuid);
                    const videoDetail = res2.body;
                    expect(videoDetail.files).to.have.lengthOf(1);
                    expect(videoDetail.streamingPlaylists).to.have.lengthOf(0);
                }
            }
        });
    });
    it('Should run a transcoding job on video 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`${env} npm run create-transcoding-job -- -v ${videosUUID[1]}`);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const videos = res.body.data;
                let infoHashes;
                for (const video of videos) {
                    const res2 = yield extra_utils_1.getVideo(server.url, video.uuid);
                    const videoDetail = res2.body;
                    if (video.uuid === videosUUID[1]) {
                        expect(videoDetail.files).to.have.lengthOf(4);
                        expect(videoDetail.streamingPlaylists).to.have.lengthOf(0);
                        if (!infoHashes) {
                            infoHashes = {};
                            for (const file of videoDetail.files) {
                                infoHashes[file.resolution.id.toString()] = file.magnetUri;
                            }
                        }
                        else {
                            for (const resolution of Object.keys(infoHashes)) {
                                const file = videoDetail.files.find(f => f.resolution.id.toString() === resolution);
                                expect(file.magnetUri).to.equal(infoHashes[resolution]);
                            }
                        }
                    }
                    else {
                        expect(videoDetail.files).to.have.lengthOf(1);
                        expect(videoDetail.streamingPlaylists).to.have.lengthOf(0);
                    }
                }
            }
        });
    });
    it('Should run a transcoding job on video 1 with resolution', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`${env} npm run create-transcoding-job -- -v ${videosUUID[0]} -r 480`);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const videos = res.body.data;
                expect(videos).to.have.lengthOf(videosUUID.length);
                const res2 = yield extra_utils_1.getVideo(server.url, videosUUID[0]);
                const videoDetail = res2.body;
                expect(videoDetail.files).to.have.lengthOf(2);
                expect(videoDetail.files[0].resolution.id).to.equal(720);
                expect(videoDetail.files[1].resolution.id).to.equal(480);
                expect(videoDetail.streamingPlaylists).to.have.lengthOf(0);
            }
        });
    });
    it('Should generate an HLS resolution', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`${env} npm run create-transcoding-job -- -v ${videosUUID[2]} --generate-hls -r 480`);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videosUUID[2]);
                const videoDetail = res.body;
                expect(videoDetail.files).to.have.lengthOf(1);
                expect(videoDetail.streamingPlaylists).to.have.lengthOf(1);
                const files = videoDetail.streamingPlaylists[0].files;
                expect(files).to.have.lengthOf(1);
                expect(files[0].resolution.id).to.equal(480);
            }
        });
    });
    it('Should not duplicate an HLS resolution', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`${env} npm run create-transcoding-job -- -v ${videosUUID[2]} --generate-hls -r 480`);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videosUUID[2]);
                const videoDetail = res.body;
                const files = videoDetail.streamingPlaylists[0].files;
                expect(files).to.have.lengthOf(1);
                expect(files[0].resolution.id).to.equal(480);
            }
        });
    });
    it('Should generate all HLS resolutions', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`${env} npm run create-transcoding-job -- -v ${videosUUID[3]} --generate-hls`);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videosUUID[3]);
                const videoDetail = res.body;
                expect(videoDetail.files).to.have.lengthOf(1);
                expect(videoDetail.streamingPlaylists).to.have.lengthOf(1);
                const files = videoDetail.streamingPlaylists[0].files;
                expect(files).to.have.lengthOf(4);
            }
        });
    });
    it('Should optimize the video file and generate HLS videos if enabled in config', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            config.transcoding.hls.enabled = true;
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`${env} npm run create-transcoding-job -- -v ${videosUUID[4]}`);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videosUUID[4]);
                const videoDetail = res.body;
                expect(videoDetail.files).to.have.lengthOf(4);
                expect(videoDetail.streamingPlaylists).to.have.lengthOf(1);
                expect(videoDetail.streamingPlaylists[0].files).to.have.lengthOf(4);
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
