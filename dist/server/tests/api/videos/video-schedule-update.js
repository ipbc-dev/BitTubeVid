"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const videos_1 = require("../../../../shared/models/videos");
const extra_utils_1 = require("../../../../shared/extra-utils");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
function in10Seconds() {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 10);
    return now;
}
describe('Test video update scheduler', function () {
    let servers = [];
    let video2UUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should upload a video and schedule an update in 10 seconds', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const videoAttributes = {
                name: 'video 1',
                privacy: videos_1.VideoPrivacy.PRIVATE,
                scheduleUpdate: {
                    updateAt: in10Seconds().toISOString(),
                    privacy: videos_1.VideoPrivacy.PUBLIC
                }
            };
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not list the video (in privacy mode)', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.total).to.equal(0);
            }
        });
    });
    it('Should have my scheduled video in my account videos', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getMyVideos(servers[0].url, servers[0].accessToken, 0, 5);
            expect(res.body.total).to.equal(1);
            const videoFromList = res.body.data[0];
            const res2 = yield extra_utils_1.getVideoWithToken(servers[0].url, servers[0].accessToken, videoFromList.uuid);
            const videoFromGet = res2.body;
            for (const video of [videoFromList, videoFromGet]) {
                expect(video.name).to.equal('video 1');
                expect(video.privacy.id).to.equal(videos_1.VideoPrivacy.PRIVATE);
                expect(new Date(video.scheduledUpdate.updateAt)).to.be.above(new Date());
                expect(video.scheduledUpdate.privacy).to.equal(videos_1.VideoPrivacy.PUBLIC);
            }
        });
    });
    it('Should wait some seconds and have the video in public privacy', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            yield extra_utils_1.wait(15000);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.total).to.equal(1);
                expect(res.body.data[0].name).to.equal('video 1');
            }
        });
    });
    it('Should upload a video without scheduling an update', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const videoAttributes = {
                name: 'video 2',
                privacy: videos_1.VideoPrivacy.PRIVATE
            };
            const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            video2UUID = res.body.video.uuid;
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should update a video by scheduling an update', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const videoAttributes = {
                name: 'video 2 updated',
                scheduleUpdate: {
                    updateAt: in10Seconds().toISOString(),
                    privacy: videos_1.VideoPrivacy.PUBLIC
                }
            };
            yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, video2UUID, videoAttributes);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not display the updated video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.total).to.equal(1);
            }
        });
    });
    it('Should have my scheduled updated video in my account videos', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getMyVideos(servers[0].url, servers[0].accessToken, 0, 5);
            expect(res.body.total).to.equal(2);
            const video = res.body.data.find(v => v.uuid === video2UUID);
            expect(video).not.to.be.undefined;
            expect(video.name).to.equal('video 2 updated');
            expect(video.privacy.id).to.equal(videos_1.VideoPrivacy.PRIVATE);
            expect(new Date(video.scheduledUpdate.updateAt)).to.be.above(new Date());
            expect(video.scheduledUpdate.privacy).to.equal(videos_1.VideoPrivacy.PUBLIC);
        });
    });
    it('Should wait some seconds and have the updated video in public privacy', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.wait(15000);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.total).to.equal(2);
                const video = res.body.data.find(v => v.uuid === video2UUID);
                expect(video).not.to.be.undefined;
                expect(video.name).to.equal('video 2 updated');
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
