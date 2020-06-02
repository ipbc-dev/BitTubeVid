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
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const stats_1 = require("../../../../shared/extra-utils/server/stats");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test stats (excluding redundancy)', function () {
    let servers = [];
    const user = {
        username: 'user1',
        password: 'super_password'
    };
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            yield extra_utils_1.unfollow(servers[2].url, servers[2].accessToken, servers[0]);
            yield jobs_1.waitJobs(servers);
            const res = yield stats_1.getStats(servers[2].url);
            const data = res.body;
            expect(data.totalVideos).to.equal(0);
        });
    });
    it('Should have the correct active users stats', function () {
        return __awaiter(this, void 0, void 0, function* () {
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
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
