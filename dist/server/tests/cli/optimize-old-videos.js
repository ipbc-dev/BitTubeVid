"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const path_1 = require("path");
const extra_utils_1 = require("../../../shared/extra-utils");
const jobs_1 = require("../../../shared/extra-utils/server/jobs");
const videos_1 = require("../../../shared/models/videos");
const ffprobe_utils_1 = require("../../helpers/ffprobe-utils");
const constants_1 = require("../../initializers/constants");
const expect = chai.expect;
describe('Test optimize old videos', function () {
    let servers = [];
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(200000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            let tempFixturePath;
            {
                tempFixturePath = yield extra_utils_1.generateHighBitrateVideo();
                const bitrate = yield ffprobe_utils_1.getVideoFileBitrate(tempFixturePath);
                expect(bitrate).to.be.above(videos_1.getMaxBitrate(1080, 25, constants_1.VIDEO_TRANSCODING_FPS));
            }
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video1', fixture: tempFixturePath });
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video2', fixture: tempFixturePath });
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have two video files on each server', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const videos = res.body.data;
                expect(videos).to.have.lengthOf(2);
                for (const video of videos) {
                    const res2 = yield extra_utils_1.getVideo(server.url, video.uuid);
                    const videoDetail = res2.body;
                    expect(videoDetail.files).to.have.lengthOf(1);
                }
            }
        });
    });
    it('Should run optimize script', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(200000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`${env} npm run optimize-old-videos`);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const videos = res.body.data;
                expect(videos).to.have.lengthOf(2);
                for (const video of videos) {
                    yield extra_utils_1.viewVideo(server.url, video.uuid);
                    yield jobs_1.waitJobs(servers);
                    yield extra_utils_1.wait(5000);
                    yield jobs_1.waitJobs(servers);
                    const res2 = yield extra_utils_1.getVideo(server.url, video.uuid);
                    const videosDetails = res2.body;
                    expect(videosDetails.files).to.have.lengthOf(1);
                    const file = videosDetails.files[0];
                    expect(file.size).to.be.below(8000000);
                    const path = extra_utils_1.buildServerDirectory(servers[0], path_1.join('videos', video.uuid + '-' + file.resolution.id + '.mp4'));
                    const bitrate = yield ffprobe_utils_1.getVideoFileBitrate(path);
                    const fps = yield ffprobe_utils_1.getVideoFileFPS(path);
                    const resolution = yield ffprobe_utils_1.getVideoFileResolution(path);
                    expect(resolution.videoFileResolution).to.equal(file.resolution.id);
                    expect(bitrate).to.be.below(videos_1.getMaxBitrate(resolution.videoFileResolution, fps, constants_1.VIDEO_TRANSCODING_FPS));
                }
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
