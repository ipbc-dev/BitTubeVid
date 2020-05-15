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
const videos_1 = require("../../../shared/models/videos");
const extra_utils_1 = require("../../../shared/extra-utils");
const jobs_1 = require("../../../shared/extra-utils/server/jobs");
const ffmpeg_utils_1 = require("../../helpers/ffmpeg-utils");
const constants_1 = require("../../initializers/constants");
const path_1 = require("path");
const expect = chai.expect;
describe('Test optimize old videos', function () {
    let servers = [];
    let video1UUID;
    let video2UUID;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(200000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            let tempFixturePath;
            {
                tempFixturePath = yield extra_utils_1.generateHighBitrateVideo();
                const bitrate = yield ffmpeg_utils_1.getVideoFileBitrate(tempFixturePath);
                expect(bitrate).to.be.above(videos_1.getMaxBitrate(videos_1.VideoResolution.H_1080P, 25, constants_1.VIDEO_TRANSCODING_FPS));
            }
            const res1 = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video1', fixture: tempFixturePath });
            video1UUID = res1.body.video.uuid;
            const res2 = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video2', fixture: tempFixturePath });
            video2UUID = res2.body.video.uuid;
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have two video files on each server', function () {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
                    const path = path_1.join(extra_utils_1.root(), 'test' + servers[0].internalServerNumber, 'videos', video.uuid + '-' + file.resolution.id + '.mp4');
                    const bitrate = yield ffmpeg_utils_1.getVideoFileBitrate(path);
                    const fps = yield ffmpeg_utils_1.getVideoFileFPS(path);
                    const resolution = yield ffmpeg_utils_1.getVideoFileResolution(path);
                    expect(resolution.videoFileResolution).to.equal(file.resolution.id);
                    expect(bitrate).to.be.below(videos_1.getMaxBitrate(resolution.videoFileResolution, fps, constants_1.VIDEO_TRANSCODING_FPS));
                }
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
