"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const video_history_1 = require("../../../../shared/extra-utils/videos/video-history");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
describe('Test videos history', function () {
    let server = null;
    let video1UUID;
    let video2UUID;
    let video3UUID;
    let video3WatchedDate;
    let userAccessToken;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 1' });
                video1UUID = res.body.video.uuid;
            }
            {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 2' });
                video2UUID = res.body.video.uuid;
            }
            {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 3' });
                video3UUID = res.body.video.uuid;
            }
            const user = {
                username: 'user_1',
                password: 'super password'
            };
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(server, user);
        });
    });
    it('Should get videos, without watching history', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosListWithToken(server.url, server.accessToken);
            const videos = res.body.data;
            for (const video of videos) {
                const resDetail = yield extra_utils_1.getVideoWithToken(server.url, server.accessToken, video.id);
                const videoDetails = resDetail.body;
                expect(video.userHistory).to.be.undefined;
                expect(videoDetails.userHistory).to.be.undefined;
            }
        });
    });
    it('Should watch the first and second video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield video_history_1.userWatchVideo(server.url, server.accessToken, video2UUID, 8);
            yield video_history_1.userWatchVideo(server.url, server.accessToken, video1UUID, 3);
        });
    });
    it('Should return the correct history when listing, searching and getting videos', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videosOfVideos = [];
            {
                const res = yield extra_utils_1.getVideosListWithToken(server.url, server.accessToken);
                videosOfVideos.push(res.body.data);
            }
            {
                const res = yield extra_utils_1.searchVideoWithToken(server.url, 'video', server.accessToken);
                videosOfVideos.push(res.body.data);
            }
            for (const videos of videosOfVideos) {
                const video1 = videos.find(v => v.uuid === video1UUID);
                const video2 = videos.find(v => v.uuid === video2UUID);
                const video3 = videos.find(v => v.uuid === video3UUID);
                expect(video1.userHistory).to.not.be.undefined;
                expect(video1.userHistory.currentTime).to.equal(3);
                expect(video2.userHistory).to.not.be.undefined;
                expect(video2.userHistory.currentTime).to.equal(8);
                expect(video3.userHistory).to.be.undefined;
            }
            {
                const resDetail = yield extra_utils_1.getVideoWithToken(server.url, server.accessToken, video1UUID);
                const videoDetails = resDetail.body;
                expect(videoDetails.userHistory).to.not.be.undefined;
                expect(videoDetails.userHistory.currentTime).to.equal(3);
            }
            {
                const resDetail = yield extra_utils_1.getVideoWithToken(server.url, server.accessToken, video2UUID);
                const videoDetails = resDetail.body;
                expect(videoDetails.userHistory).to.not.be.undefined;
                expect(videoDetails.userHistory.currentTime).to.equal(8);
            }
            {
                const resDetail = yield extra_utils_1.getVideoWithToken(server.url, server.accessToken, video3UUID);
                const videoDetails = resDetail.body;
                expect(videoDetails.userHistory).to.be.undefined;
            }
        });
    });
    it('Should have these videos when listing my history', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            video3WatchedDate = new Date();
            yield video_history_1.userWatchVideo(server.url, server.accessToken, video3UUID, 2);
            const res = yield video_history_1.listMyVideosHistory(server.url, server.accessToken);
            expect(res.body.total).to.equal(3);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('video 3');
            expect(videos[1].name).to.equal('video 1');
            expect(videos[2].name).to.equal('video 2');
        });
    });
    it('Should not have videos history on another user', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield video_history_1.listMyVideosHistory(server.url, userAccessToken);
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should clear my history', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield video_history_1.removeMyVideosHistory(server.url, server.accessToken, video3WatchedDate.toISOString());
        });
    });
    it('Should have my history cleared', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield video_history_1.listMyVideosHistory(server.url, server.accessToken);
            expect(res.body.total).to.equal(1);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('video 3');
        });
    });
    it('Should disable videos history', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateMyUser({
                url: server.url,
                accessToken: server.accessToken,
                videosHistoryEnabled: false
            });
            yield video_history_1.userWatchVideo(server.url, server.accessToken, video2UUID, 8, http_error_codes_1.HttpStatusCode.CONFLICT_409);
        });
    });
    it('Should re-enable videos history', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateMyUser({
                url: server.url,
                accessToken: server.accessToken,
                videosHistoryEnabled: true
            });
            yield video_history_1.userWatchVideo(server.url, server.accessToken, video1UUID, 8);
            const res = yield video_history_1.listMyVideosHistory(server.url, server.accessToken);
            expect(res.body.total).to.equal(2);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('video 1');
            expect(videos[1].name).to.equal('video 3');
        });
    });
    it('Should not clean old history', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server, { history: { videos: { max_age: '10 days' } } });
            yield extra_utils_1.wait(6000);
            const res = yield video_history_1.listMyVideosHistory(server.url, server.accessToken);
            expect(res.body.total).to.equal(2);
        });
    });
    it('Should clean old history', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server, { history: { videos: { max_age: '5 seconds' } } });
            yield extra_utils_1.wait(6000);
            const res = yield video_history_1.listMyVideosHistory(server.url, server.accessToken);
            expect(res.body.total).to.equal(0);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
