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
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test video channels', function () {
    let servers;
    let userInfo;
    let firstVideoChannelId;
    let secondVideoChannelId;
    let videoUUID;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            {
                const res = yield index_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
                const user = res.body;
                firstVideoChannelId = user.videoChannels[0].id;
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have one video channel (created with root)', () => __awaiter(this, void 0, void 0, function* () {
        const res = yield index_1.getVideoChannelsList(servers[0].url, 0, 2);
        expect(res.body.total).to.equal(1);
        expect(res.body.data).to.be.an('array');
        expect(res.body.data).to.have.lengthOf(1);
    }));
    it('Should create another video channel', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            {
                const videoChannel = {
                    name: 'second_video_channel',
                    displayName: 'second video channel',
                    description: 'super video channel description',
                    support: 'super video channel support text'
                };
                const res = yield index_1.addVideoChannel(servers[0].url, servers[0].accessToken, videoChannel);
                secondVideoChannelId = res.body.videoChannel.id;
            }
            {
                const videoAttributesArg = { name: 'my video name', channelId: secondVideoChannelId, support: 'video support field' };
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributesArg);
                videoUUID = res.body.video.uuid;
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have two video channels when getting my information', () => __awaiter(this, void 0, void 0, function* () {
        const res = yield index_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
        userInfo = res.body;
        expect(userInfo.videoChannels).to.be.an('array');
        expect(userInfo.videoChannels).to.have.lengthOf(2);
        const videoChannels = userInfo.videoChannels;
        expect(videoChannels[0].name).to.equal('root_channel');
        expect(videoChannels[0].displayName).to.equal('Main root channel');
        expect(videoChannels[1].name).to.equal('second_video_channel');
        expect(videoChannels[1].displayName).to.equal('second video channel');
        expect(videoChannels[1].description).to.equal('super video channel description');
        expect(videoChannels[1].support).to.equal('super video channel support text');
    }));
    it('Should have two video channels when getting account channels on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getAccountVideoChannelsList({
                url: servers[0].url,
                accountName: userInfo.account.name + '@' + userInfo.account.host
            });
            expect(res.body.total).to.equal(2);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(2);
            const videoChannels = res.body.data;
            expect(videoChannels[0].name).to.equal('root_channel');
            expect(videoChannels[0].displayName).to.equal('Main root channel');
            expect(videoChannels[1].name).to.equal('second_video_channel');
            expect(videoChannels[1].displayName).to.equal('second video channel');
            expect(videoChannels[1].description).to.equal('super video channel description');
            expect(videoChannels[1].support).to.equal('super video channel support text');
        });
    });
    it('Should paginate and sort account channels', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield index_1.getAccountVideoChannelsList({
                    url: servers[0].url,
                    accountName: userInfo.account.name + '@' + userInfo.account.host,
                    start: 0,
                    count: 1,
                    sort: 'createdAt'
                });
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(1);
                const videoChannel = res.body.data[0];
                expect(videoChannel.name).to.equal('root_channel');
            }
            {
                const res = yield index_1.getAccountVideoChannelsList({
                    url: servers[0].url,
                    accountName: userInfo.account.name + '@' + userInfo.account.host,
                    start: 0,
                    count: 1,
                    sort: '-createdAt'
                });
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(1);
                const videoChannel = res.body.data[0];
                expect(videoChannel.name).to.equal('second_video_channel');
            }
            {
                const res = yield index_1.getAccountVideoChannelsList({
                    url: servers[0].url,
                    accountName: userInfo.account.name + '@' + userInfo.account.host,
                    start: 1,
                    count: 1,
                    sort: '-createdAt'
                });
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(1);
                const videoChannel = res.body.data[0];
                expect(videoChannel.name).to.equal('root_channel');
            }
        });
    });
    it('Should have one video channel when getting account channels on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getAccountVideoChannelsList({
                url: servers[1].url,
                accountName: userInfo.account.name + '@' + userInfo.account.host
            });
            expect(res.body.total).to.equal(1);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(1);
            const videoChannels = res.body.data;
            expect(videoChannels[0].name).to.equal('second_video_channel');
            expect(videoChannels[0].displayName).to.equal('second video channel');
            expect(videoChannels[0].description).to.equal('super video channel description');
            expect(videoChannels[0].support).to.equal('super video channel support text');
        });
    });
    it('Should list video channels', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideoChannelsList(servers[0].url, 1, 1, '-name');
            expect(res.body.total).to.equal(2);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].name).to.equal('root_channel');
            expect(res.body.data[0].displayName).to.equal('Main root channel');
        });
    });
    it('Should update video channel', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            const videoChannelAttributes = {
                displayName: 'video channel updated',
                description: 'video channel description updated',
                support: 'support updated'
            };
            yield index_1.updateVideoChannel(servers[0].url, servers[0].accessToken, 'second_video_channel', videoChannelAttributes);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have video channel updated', function () {
        return __awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield index_1.getVideoChannelsList(server.url, 0, 1, '-name');
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(1);
                expect(res.body.data[0].name).to.equal('second_video_channel');
                expect(res.body.data[0].displayName).to.equal('video channel updated');
                expect(res.body.data[0].description).to.equal('video channel description updated');
                expect(res.body.data[0].support).to.equal('support updated');
            }
        });
    });
    it('Should not have updated the video support field', function () {
        return __awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                const video = res.body;
                expect(video.support).to.equal('video support field');
            }
        });
    });
    it('Should update the channel support field and update videos too', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(35000);
            const videoChannelAttributes = {
                support: 'video channel support text updated',
                bulkVideosSupportUpdate: true
            };
            yield index_1.updateVideoChannel(servers[0].url, servers[0].accessToken, 'second_video_channel', videoChannelAttributes);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                const video = res.body;
                expect(video.support).to.equal(videoChannelAttributes.support);
            }
        });
    });
    it('Should update video channel avatar', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(5000);
            const fixture = 'avatar.png';
            yield extra_utils_1.updateVideoChannelAvatar({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                videoChannelName: 'second_video_channel',
                fixture
            });
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have video channel avatar updated', function () {
        return __awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield index_1.getVideoChannelsList(server.url, 0, 1, '-name');
                const videoChannel = res.body.data.find(c => c.id === secondVideoChannelId);
                yield extra_utils_1.testImage(server.url, 'avatar-resized', videoChannel.avatar.path, '.png');
            }
        });
    });
    it('Should get video channel', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideoChannel(servers[0].url, 'second_video_channel');
            const videoChannel = res.body;
            expect(videoChannel.name).to.equal('second_video_channel');
            expect(videoChannel.displayName).to.equal('video channel updated');
            expect(videoChannel.description).to.equal('video channel description updated');
            expect(videoChannel.support).to.equal('video channel support text updated');
        });
    });
    it('Should list the second video channel videos', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            for (const server of servers) {
                const channelURI = 'second_video_channel@localhost:' + servers[0].port;
                const res1 = yield extra_utils_1.getVideoChannelVideos(server.url, server.accessToken, channelURI, 0, 5);
                expect(res1.body.total).to.equal(1);
                expect(res1.body.data).to.be.an('array');
                expect(res1.body.data).to.have.lengthOf(1);
                expect(res1.body.data[0].name).to.equal('my video name');
            }
        });
    });
    it('Should change the video channel of a video', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, videoUUID, { channelId: firstVideoChannelId });
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should list the first video channel videos', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            for (const server of servers) {
                const secondChannelURI = 'second_video_channel@localhost:' + servers[0].port;
                const res1 = yield extra_utils_1.getVideoChannelVideos(server.url, server.accessToken, secondChannelURI, 0, 5);
                expect(res1.body.total).to.equal(0);
                const channelURI = 'root_channel@localhost:' + servers[0].port;
                const res2 = yield extra_utils_1.getVideoChannelVideos(server.url, server.accessToken, channelURI, 0, 5);
                expect(res2.body.total).to.equal(1);
                const videos = res2.body.data;
                expect(videos).to.be.an('array');
                expect(videos).to.have.lengthOf(1);
                expect(videos[0].name).to.equal('my video name');
            }
        });
    });
    it('Should delete video channel', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.deleteVideoChannel(servers[0].url, servers[0].accessToken, 'second_video_channel');
        });
    });
    it('Should have video channel deleted', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideoChannelsList(servers[0].url, 0, 10);
            expect(res.body.total).to.equal(1);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].displayName).to.equal('Main root channel');
        });
    });
    it('Should create the main channel with an uuid if there is a conflict', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const videoChannel = { name: 'toto_channel', displayName: 'My toto channel' };
                yield index_1.addVideoChannel(servers[0].url, servers[0].accessToken, videoChannel);
            }
            {
                yield extra_utils_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: 'toto', password: 'password' });
                const accessToken = yield extra_utils_1.userLogin(servers[0], { username: 'toto', password: 'password' });
                const res = yield index_1.getMyUserInformation(servers[0].url, accessToken);
                const videoChannel = res.body.videoChannels[0];
                expect(videoChannel.name).to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
            }
        });
    });
    it('Should report correct channel statistics', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield index_1.getAccountVideoChannelsList({
                    url: servers[0].url,
                    accountName: userInfo.account.name + '@' + userInfo.account.host,
                    withStats: true
                });
                res.body.data.forEach((channel) => {
                    expect(channel).to.haveOwnProperty('viewsPerDay');
                    expect(channel.viewsPerDay).to.have.length(30 + 1);
                    channel.viewsPerDay.forEach((v) => {
                        expect(v.date).to.be.an('string');
                        expect(v.views).to.equal(0);
                    });
                });
            }
            {
                yield index_1.viewVideo(servers[0].url, videoUUID, 204, '0.0.0.1,127.0.0.1');
                yield index_1.viewVideo(servers[0].url, videoUUID, 204, '0.0.0.2,127.0.0.1');
                yield extra_utils_1.wait(8000);
                const res = yield index_1.getAccountVideoChannelsList({
                    url: servers[0].url,
                    accountName: userInfo.account.name + '@' + userInfo.account.host,
                    withStats: true
                });
                const channelWithView = res.body.data.find((channel) => channel.id === firstVideoChannelId);
                expect(channelWithView.viewsPerDay.slice(-1)[0].views).to.equal(2);
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
