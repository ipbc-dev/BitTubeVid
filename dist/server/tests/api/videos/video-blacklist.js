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
const lodash_1 = require("lodash");
require("mocha");
const index_1 = require("../../../../shared/extra-utils/index");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const videos_1 = require("../../../../shared/models/videos");
const user_flag_model_1 = require("../../../../shared/models/users/user-flag.model");
const users_1 = require("../../../../shared/models/users");
const video_imports_1 = require("../../../../shared/extra-utils/videos/video-imports");
const expect = chai.expect;
describe('Test video blacklist', function () {
    let servers = [];
    let videoId;
    function blacklistVideosOnServer(server) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideosList(server.url);
            const videos = res.body.data;
            for (const video of videos) {
                yield index_1.addVideoToBlacklist(server.url, server.accessToken, video.id, 'super reason');
            }
        });
    }
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            servers = yield index_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            yield follows_1.doubleFollow(servers[0], servers[1]);
            yield index_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'My 1st video', description: 'A video on server 2' });
            yield index_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'My 2nd video', description: 'A video on server 2' });
            yield jobs_1.waitJobs(servers);
            yield blacklistVideosOnServer(servers[0]);
        });
    });
    describe('When listing/searching videos', function () {
        it('Should not have the video blacklisted in videos list/search on server 1', function () {
            return __awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield index_1.getVideosList(servers[0].url);
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.be.an('array');
                    expect(res.body.data.length).to.equal(0);
                }
                {
                    const res = yield index_1.searchVideo(servers[0].url, 'name');
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.be.an('array');
                    expect(res.body.data.length).to.equal(0);
                }
            });
        });
        it('Should have the blacklisted video in videos list/search on server 2', function () {
            return __awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield index_1.getVideosList(servers[1].url);
                    expect(res.body.total).to.equal(2);
                    expect(res.body.data).to.be.an('array');
                    expect(res.body.data.length).to.equal(2);
                }
                {
                    const res = yield index_1.searchVideo(servers[1].url, 'video');
                    expect(res.body.total).to.equal(2);
                    expect(res.body.data).to.be.an('array');
                    expect(res.body.data.length).to.equal(2);
                }
            });
        });
    });
    describe('When listing manually blacklisted videos', function () {
        it('Should display all the blacklisted videos', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(2);
                const blacklistedVideos = res.body.data;
                expect(blacklistedVideos).to.be.an('array');
                expect(blacklistedVideos.length).to.equal(2);
                for (const blacklistedVideo of blacklistedVideos) {
                    expect(blacklistedVideo.reason).to.equal('super reason');
                    videoId = blacklistedVideo.video.id;
                }
            });
        });
        it('Should display all the blacklisted videos when applying manual type filter', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    type: videos_1.VideoBlacklistType.MANUAL
                });
                expect(res.body.total).to.equal(2);
                const blacklistedVideos = res.body.data;
                expect(blacklistedVideos).to.be.an('array');
                expect(blacklistedVideos.length).to.equal(2);
            });
        });
        it('Should display nothing when applying automatic type filter', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    type: videos_1.VideoBlacklistType.AUTO_BEFORE_PUBLISHED
                });
                expect(res.body.total).to.equal(0);
                const blacklistedVideos = res.body.data;
                expect(blacklistedVideos).to.be.an('array');
                expect(blacklistedVideos.length).to.equal(0);
            });
        });
        it('Should get the correct sort when sorting by descending id', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, sort: '-id' });
                expect(res.body.total).to.equal(2);
                const blacklistedVideos = res.body.data;
                expect(blacklistedVideos).to.be.an('array');
                expect(blacklistedVideos.length).to.equal(2);
                const result = lodash_1.orderBy(res.body.data, ['id'], ['desc']);
                expect(blacklistedVideos).to.deep.equal(result);
            });
        });
        it('Should get the correct sort when sorting by descending video name', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, sort: '-name' });
                expect(res.body.total).to.equal(2);
                const blacklistedVideos = res.body.data;
                expect(blacklistedVideos).to.be.an('array');
                expect(blacklistedVideos.length).to.equal(2);
                const result = lodash_1.orderBy(res.body.data, ['name'], ['desc']);
                expect(blacklistedVideos).to.deep.equal(result);
            });
        });
        it('Should get the correct sort when sorting by ascending creation date', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, sort: 'createdAt' });
                expect(res.body.total).to.equal(2);
                const blacklistedVideos = res.body.data;
                expect(blacklistedVideos).to.be.an('array');
                expect(blacklistedVideos.length).to.equal(2);
                const result = lodash_1.orderBy(res.body.data, ['createdAt']);
                expect(blacklistedVideos).to.deep.equal(result);
            });
        });
    });
    describe('When updating blacklisted videos', function () {
        it('Should change the reason', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield index_1.updateVideoBlacklist(servers[0].url, servers[0].accessToken, videoId, 'my super reason updated');
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, sort: '-name' });
                const video = res.body.data.find(b => b.video.id === videoId);
                expect(video.reason).to.equal('my super reason updated');
            });
        });
    });
    describe('When listing my videos', function () {
        it('Should display blacklisted videos', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield blacklistVideosOnServer(servers[1]);
                const res = yield index_1.getMyVideos(servers[1].url, servers[1].accessToken, 0, 5);
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(2);
                for (const video of res.body.data) {
                    expect(video.blacklisted).to.be.true;
                    expect(video.blacklistedReason).to.equal('super reason');
                }
            });
        });
    });
    describe('When removing a blacklisted video', function () {
        let videoToRemove;
        let blacklist = [];
        it('Should not have any video in videos list on server 1', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getVideosList(servers[0].url);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.equal(0);
            });
        });
        it('Should remove a video from the blacklist on server 1', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, sort: '-name' });
                videoToRemove = res.body.data[0];
                blacklist = res.body.data.slice(1);
                yield index_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, videoToRemove.video.id);
            });
        });
        it('Should have the ex-blacklisted video in videos list on server 1', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getVideosList(servers[0].url);
                expect(res.body.total).to.equal(1);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos.length).to.equal(1);
                expect(videos[0].name).to.equal(videoToRemove.video.name);
                expect(videos[0].id).to.equal(videoToRemove.video.id);
            });
        });
        it('Should not have the ex-blacklisted video in videos blacklist list on server 1', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, sort: '-name' });
                expect(res.body.total).to.equal(1);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos.length).to.equal(1);
                expect(videos).to.deep.equal(blacklist);
            });
        });
    });
    describe('When blacklisting local videos', function () {
        let video3UUID;
        let video4UUID;
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                {
                    const res = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'Video 3' });
                    video3UUID = res.body.video.uuid;
                }
                {
                    const res = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'Video 4' });
                    video4UUID = res.body.video.uuid;
                }
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should blacklist video 3 and keep it federated', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, video3UUID, 'super reason', false);
                yield jobs_1.waitJobs(servers);
                {
                    const res = yield index_1.getVideosList(servers[0].url);
                    expect(res.body.data.find(v => v.uuid === video3UUID)).to.be.undefined;
                }
                {
                    const res = yield index_1.getVideosList(servers[1].url);
                    expect(res.body.data.find(v => v.uuid === video3UUID)).to.not.be.undefined;
                }
            });
        });
        it('Should unfederate the video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, video4UUID, 'super reason', true);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield index_1.getVideosList(server.url);
                    expect(res.body.data.find(v => v.uuid === video4UUID)).to.be.undefined;
                }
            });
        });
        it('Should have the video unfederated even after an Update AP message', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.updateVideo(servers[0].url, servers[0].accessToken, video4UUID, { description: 'super description' });
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield index_1.getVideosList(server.url);
                    expect(res.body.data.find(v => v.uuid === video4UUID)).to.be.undefined;
                }
            });
        });
        it('Should have the correct video blacklist unfederate attribute', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getBlacklistedVideosList({ url: servers[0].url, token: servers[0].accessToken, sort: 'createdAt' });
                const blacklistedVideos = res.body.data;
                const video3Blacklisted = blacklistedVideos.find(b => b.video.uuid === video3UUID);
                const video4Blacklisted = blacklistedVideos.find(b => b.video.uuid === video4UUID);
                expect(video3Blacklisted.unfederated).to.be.false;
                expect(video4Blacklisted.unfederated).to.be.true;
            });
        });
        it('Should remove the video from blacklist and refederate the video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, video4UUID);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield index_1.getVideosList(server.url);
                    expect(res.body.data.find(v => v.uuid === video4UUID)).to.not.be.undefined;
                }
            });
        });
    });
    describe('When auto blacklist videos', function () {
        let userWithoutFlag;
        let userWithFlag;
        let channelOfUserWithoutFlag;
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                index_1.killallServers([servers[0]]);
                const config = {
                    auto_blacklist: {
                        videos: {
                            of_users: {
                                enabled: true
                            }
                        }
                    }
                };
                yield index_1.reRunServer(servers[0], config);
                {
                    const user = { username: 'user_without_flag', password: 'password' };
                    yield index_1.createUser({
                        url: servers[0].url,
                        accessToken: servers[0].accessToken,
                        username: user.username,
                        adminFlags: user_flag_model_1.UserAdminFlag.NONE,
                        password: user.password,
                        role: users_1.UserRole.USER
                    });
                    userWithoutFlag = yield index_1.userLogin(servers[0], user);
                    const res = yield index_1.getMyUserInformation(servers[0].url, userWithoutFlag);
                    const body = res.body;
                    channelOfUserWithoutFlag = body.videoChannels[0].id;
                }
                {
                    const user = { username: 'user_with_flag', password: 'password' };
                    yield index_1.createUser({
                        url: servers[0].url,
                        accessToken: servers[0].accessToken,
                        username: user.username,
                        adminFlags: user_flag_model_1.UserAdminFlag.BY_PASS_VIDEO_AUTO_BLACKLIST,
                        password: user.password,
                        role: users_1.UserRole.USER
                    });
                    userWithFlag = yield index_1.userLogin(servers[0], user);
                }
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should auto blacklist a video on upload', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield index_1.uploadVideo(servers[0].url, userWithoutFlag, { name: 'blacklisted' });
                const res = yield index_1.getBlacklistedVideosList({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    type: videos_1.VideoBlacklistType.AUTO_BEFORE_PUBLISHED
                });
                expect(res.body.total).to.equal(1);
                expect(res.body.data[0].video.name).to.equal('blacklisted');
            });
        });
        it('Should auto blacklist a video on URL import', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                const attributes = {
                    targetUrl: video_imports_1.getYoutubeVideoUrl(),
                    name: 'URL import',
                    channelId: channelOfUserWithoutFlag
                };
                yield video_imports_1.importVideo(servers[0].url, userWithoutFlag, attributes);
                const res = yield index_1.getBlacklistedVideosList({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    sort: 'createdAt',
                    type: videos_1.VideoBlacklistType.AUTO_BEFORE_PUBLISHED
                });
                expect(res.body.total).to.equal(2);
                expect(res.body.data[1].video.name).to.equal('URL import');
            });
        });
        it('Should auto blacklist a video on torrent import', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const attributes = {
                    magnetUri: video_imports_1.getMagnetURI(),
                    name: 'Torrent import',
                    channelId: channelOfUserWithoutFlag
                };
                yield video_imports_1.importVideo(servers[0].url, userWithoutFlag, attributes);
                const res = yield index_1.getBlacklistedVideosList({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    sort: 'createdAt',
                    type: videos_1.VideoBlacklistType.AUTO_BEFORE_PUBLISHED
                });
                expect(res.body.total).to.equal(3);
                expect(res.body.data[2].video.name).to.equal('Torrent import');
            });
        });
        it('Should not auto blacklist a video on upload if the user has the bypass blacklist flag', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield index_1.uploadVideo(servers[0].url, userWithFlag, { name: 'not blacklisted' });
                const res = yield index_1.getBlacklistedVideosList({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    type: videos_1.VideoBlacklistType.AUTO_BEFORE_PUBLISHED
                });
                expect(res.body.total).to.equal(3);
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
