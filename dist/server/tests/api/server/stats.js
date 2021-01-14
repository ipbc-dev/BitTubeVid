"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const stats_1 = require("../../../../shared/extra-utils/server/stats");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const expect = chai.expect;
describe('Test stats (excluding redundancy)', function () {
    let servers = [];
    const user = {
        username: 'user1',
        password: 'super_password'
    };
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3);
            yield index_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
            const resVideo = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { fixture: 'video_short.webm' });
            const videoUUID = resVideo.body.video.uuid;
            yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, 'comment');
            yield extra_utils_1.viewVideo(servers[0].url, videoUUID);
            yield extra_utils_1.wait(8000);
            yield extra_utils_1.follow(servers[2].url, [servers[0].url], servers[2].accessToken);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have the correct stats on instance 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield stats_1.getStats(servers[0].url);
            const data = res.body;
            expect(data.totalLocalVideoComments).to.equal(1);
            expect(data.totalLocalVideos).to.equal(1);
            expect(data.totalLocalVideoViews).to.equal(1);
            expect(data.totalLocalVideoFilesSize).to.equal(218910);
            expect(data.totalUsers).to.equal(2);
            expect(data.totalVideoComments).to.equal(1);
            expect(data.totalVideos).to.equal(1);
            expect(data.totalInstanceFollowers).to.equal(2);
            expect(data.totalInstanceFollowing).to.equal(1);
        });
    });
    it('Should have the correct stats on instance 2', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield stats_1.getStats(servers[1].url);
            const data = res.body;
            expect(data.totalLocalVideoComments).to.equal(0);
            expect(data.totalLocalVideos).to.equal(0);
            expect(data.totalLocalVideoViews).to.equal(0);
            expect(data.totalLocalVideoFilesSize).to.equal(0);
            expect(data.totalUsers).to.equal(1);
            expect(data.totalVideoComments).to.equal(1);
            expect(data.totalVideos).to.equal(1);
            expect(data.totalInstanceFollowers).to.equal(1);
            expect(data.totalInstanceFollowing).to.equal(1);
        });
    });
    it('Should have the correct stats on instance 3', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield stats_1.getStats(servers[2].url);
            const data = res.body;
            expect(data.totalLocalVideoComments).to.equal(0);
            expect(data.totalLocalVideos).to.equal(0);
            expect(data.totalLocalVideoViews).to.equal(0);
            expect(data.totalUsers).to.equal(1);
            expect(data.totalVideoComments).to.equal(1);
            expect(data.totalVideos).to.equal(1);
            expect(data.totalInstanceFollowing).to.equal(1);
            expect(data.totalInstanceFollowers).to.equal(0);
        });
    });
    it('Should have the correct total videos stats after an unfollow', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            yield extra_utils_1.unfollow(servers[2].url, servers[2].accessToken, servers[0]);
            yield jobs_1.waitJobs(servers);
            const res = yield stats_1.getStats(servers[2].url);
            const data = res.body;
            expect(data.totalVideos).to.equal(0);
        });
    });
    it('Should have the correct active users stats', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const server = servers[0];
            {
                const res = yield stats_1.getStats(server.url);
                const data = res.body;
                expect(data.totalDailyActiveUsers).to.equal(1);
                expect(data.totalWeeklyActiveUsers).to.equal(1);
                expect(data.totalMonthlyActiveUsers).to.equal(1);
            }
            {
                yield extra_utils_1.userLogin(server, user);
                const res = yield stats_1.getStats(server.url);
                const data = res.body;
                expect(data.totalDailyActiveUsers).to.equal(2);
                expect(data.totalWeeklyActiveUsers).to.equal(2);
                expect(data.totalMonthlyActiveUsers).to.equal(2);
            }
        });
    });
    it('Should correctly count video file sizes if transcoding is enabled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                transcoding: {
                    enabled: true,
                    webtorrent: {
                        enabled: true
                    },
                    hls: {
                        enabled: true
                    },
                    resolutions: {
                        '0p': false,
                        '240p': false,
                        '360p': false,
                        '480p': false,
                        '720p': false,
                        '1080p': false,
                        '2160p': false
                    }
                }
            });
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video', fixture: 'video_short.webm' });
            yield jobs_1.waitJobs(servers);
            {
                const res = yield stats_1.getStats(servers[1].url);
                const data = res.body;
                expect(data.totalLocalVideoFilesSize).to.equal(0);
            }
            {
                const res = yield stats_1.getStats(servers[0].url);
                const data = res.body;
                expect(data.totalLocalVideoFilesSize).to.be.greaterThan(300000);
                expect(data.totalLocalVideoFilesSize).to.be.lessThan(400000);
            }
        });
    });
    it('Should have the correct AP stats', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
                transcoding: {
                    enabled: false
                }
            });
            const res1 = yield stats_1.getStats(servers[1].url);
            const first = res1.body;
            for (let i = 0; i < 10; i++) {
                yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video' });
            }
            yield jobs_1.waitJobs(servers);
            const res2 = yield stats_1.getStats(servers[1].url);
            const second = res2.body;
            expect(second.totalActivityPubMessagesProcessed).to.be.greaterThan(first.totalActivityPubMessagesProcessed);
            yield extra_utils_1.wait(5000);
            const res3 = yield stats_1.getStats(servers[1].url);
            const third = res3.body;
            expect(third.totalActivityPubMessagesWaiting).to.equal(0);
            expect(third.activityPubMessagesProcessedPerSecond).to.be.lessThan(second.activityPubMessagesProcessedPerSecond);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
