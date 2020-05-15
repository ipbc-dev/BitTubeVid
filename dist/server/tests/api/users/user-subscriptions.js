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
const login_1 = require("../../../../shared/extra-utils/users/login");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const user_subscriptions_1 = require("../../../../shared/extra-utils/users/user-subscriptions");
const expect = chai.expect;
describe('Test users subscriptions', function () {
    let servers = [];
    const users = [];
    let video3UUID;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3);
            yield login_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            {
                for (const server of servers) {
                    const user = { username: 'user' + server.serverNumber, password: 'password' };
                    yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                    const accessToken = yield extra_utils_1.userLogin(server, user);
                    users.push({ accessToken });
                    const videoName1 = 'video 1-' + server.serverNumber;
                    yield index_1.uploadVideo(server.url, accessToken, { name: videoName1 });
                    const videoName2 = 'video 2-' + server.serverNumber;
                    yield index_1.uploadVideo(server.url, accessToken, { name: videoName2 });
                }
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should display videos of server 2 on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            expect(res.body.total).to.equal(4);
        });
    });
    it('User of server 1 should follow user of server 3 and root of server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield user_subscriptions_1.addUserSubscription(servers[0].url, users[0].accessToken, 'user3_channel@localhost:' + servers[2].port);
            yield user_subscriptions_1.addUserSubscription(servers[0].url, users[0].accessToken, 'root_channel@localhost:' + servers[0].port);
            yield jobs_1.waitJobs(servers);
            const res = yield index_1.uploadVideo(servers[2].url, users[2].accessToken, { name: 'video server 3 added after follow' });
            video3UUID = res.body.video.uuid;
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not display videos of server 3 on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            expect(res.body.total).to.equal(4);
            for (const video of res.body.data) {
                expect(video.name).to.not.contain('1-3');
                expect(video.name).to.not.contain('2-3');
                expect(video.name).to.not.contain('video server 3 added after follow');
            }
        });
    });
    it('Should list subscriptions', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield user_subscriptions_1.listUserSubscriptions(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(0);
            }
            {
                const res = yield user_subscriptions_1.listUserSubscriptions(servers[0].url, users[0].accessToken, 'createdAt');
                expect(res.body.total).to.equal(2);
                const subscriptions = res.body.data;
                expect(subscriptions).to.be.an('array');
                expect(subscriptions).to.have.lengthOf(2);
                expect(subscriptions[0].name).to.equal('user3_channel');
                expect(subscriptions[1].name).to.equal('root_channel');
            }
        });
    });
    it('Should get subscription', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield user_subscriptions_1.getUserSubscription(servers[0].url, users[0].accessToken, 'user3_channel@localhost:' + servers[2].port);
                const videoChannel = res.body;
                expect(videoChannel.name).to.equal('user3_channel');
                expect(videoChannel.host).to.equal('localhost:' + servers[2].port);
                expect(videoChannel.displayName).to.equal('Main user3 channel');
                expect(videoChannel.followingCount).to.equal(0);
                expect(videoChannel.followersCount).to.equal(1);
            }
            {
                const res = yield user_subscriptions_1.getUserSubscription(servers[0].url, users[0].accessToken, 'root_channel@localhost:' + servers[0].port);
                const videoChannel = res.body;
                expect(videoChannel.name).to.equal('root_channel');
                expect(videoChannel.host).to.equal('localhost:' + servers[0].port);
                expect(videoChannel.displayName).to.equal('Main root channel');
                expect(videoChannel.followingCount).to.equal(0);
                expect(videoChannel.followersCount).to.equal(1);
            }
        });
    });
    it('Should return the existing subscriptions', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const uris = [
                'user3_channel@localhost:' + servers[2].port,
                'root2_channel@localhost:' + servers[0].port,
                'root_channel@localhost:' + servers[0].port,
                'user3_channel@localhost:' + servers[0].port
            ];
            const res = yield user_subscriptions_1.areSubscriptionsExist(servers[0].url, users[0].accessToken, uris);
            const body = res.body;
            expect(body['user3_channel@localhost:' + servers[2].port]).to.be.true;
            expect(body['root2_channel@localhost:' + servers[0].port]).to.be.false;
            expect(body['root_channel@localhost:' + servers[0].port]).to.be.true;
            expect(body['user3_channel@localhost:' + servers[0].port]).to.be.false;
        });
    });
    it('Should list subscription videos', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(0);
            }
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, users[0].accessToken, 'createdAt');
                expect(res.body.total).to.equal(3);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos).to.have.lengthOf(3);
                expect(videos[0].name).to.equal('video 1-3');
                expect(videos[1].name).to.equal('video 2-3');
                expect(videos[2].name).to.equal('video server 3 added after follow');
            }
        });
    });
    it('Should upload a video by root on server 1 and see it in the subscription videos', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoName = 'video server 1 added after follow';
            yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: videoName });
            yield jobs_1.waitJobs(servers);
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(0);
            }
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, users[0].accessToken, 'createdAt');
                expect(res.body.total).to.equal(4);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos).to.have.lengthOf(4);
                expect(videos[0].name).to.equal('video 1-3');
                expect(videos[1].name).to.equal('video 2-3');
                expect(videos[2].name).to.equal('video server 3 added after follow');
                expect(videos[3].name).to.equal('video server 1 added after follow');
            }
            {
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                expect(res.body.total).to.equal(5);
                for (const video of res.body.data) {
                    expect(video.name).to.not.contain('1-3');
                    expect(video.name).to.not.contain('2-3');
                    expect(video.name).to.not.contain('video server 3 added after follow');
                }
            }
        });
    });
    it('Should have server 1 follow server 3 and display server 3 videos', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.follow(servers[0].url, [servers[2].url], servers[0].accessToken);
            yield jobs_1.waitJobs(servers);
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            expect(res.body.total).to.equal(8);
            const names = ['1-3', '2-3', 'video server 3 added after follow'];
            for (const name of names) {
                const video = res.body.data.find(v => v.name.indexOf(name) === -1);
                expect(video).to.not.be.undefined;
            }
        });
    });
    it('Should remove follow server 1 -> server 3 and hide server 3 videos', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[2]);
            yield jobs_1.waitJobs(servers);
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            expect(res.body.total).to.equal(5);
            for (const video of res.body.data) {
                expect(video.name).to.not.contain('1-3');
                expect(video.name).to.not.contain('2-3');
                expect(video.name).to.not.contain('video server 3 added after follow');
            }
        });
    });
    it('Should still list subscription videos', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, servers[0].accessToken);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(0);
            }
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, users[0].accessToken, 'createdAt');
                expect(res.body.total).to.equal(4);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos).to.have.lengthOf(4);
                expect(videos[0].name).to.equal('video 1-3');
                expect(videos[1].name).to.equal('video 2-3');
                expect(videos[2].name).to.equal('video server 3 added after follow');
                expect(videos[3].name).to.equal('video server 1 added after follow');
            }
        });
    });
    it('Should update a video of server 3 and see the updated video on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.updateVideo(servers[2].url, users[2].accessToken, video3UUID, { name: 'video server 3 added after follow updated' });
            yield jobs_1.waitJobs(servers);
            const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, users[0].accessToken, 'createdAt');
            const videos = res.body.data;
            expect(videos[2].name).to.equal('video server 3 added after follow updated');
        });
    });
    it('Should remove user of server 3 subscription', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield user_subscriptions_1.removeUserSubscription(servers[0].url, users[0].accessToken, 'user3_channel@localhost:' + servers[2].port);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not display its videos anymore', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, users[0].accessToken, 'createdAt');
                expect(res.body.total).to.equal(1);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos).to.have.lengthOf(1);
                expect(videos[0].name).to.equal('video server 1 added after follow');
            }
        });
    });
    it('Should remove the root subscription and not display the videos anymore', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield user_subscriptions_1.removeUserSubscription(servers[0].url, users[0].accessToken, 'root_channel@localhost:' + servers[0].port);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, users[0].accessToken, 'createdAt');
                expect(res.body.total).to.equal(0);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos).to.have.lengthOf(0);
            }
        });
    });
    it('Should correctly display public videos on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            expect(res.body.total).to.equal(5);
            for (const video of res.body.data) {
                expect(video.name).to.not.contain('1-3');
                expect(video.name).to.not.contain('2-3');
                expect(video.name).to.not.contain('video server 3 added after follow updated');
            }
        });
    });
    it('Should follow user of server 3 again', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield user_subscriptions_1.addUserSubscription(servers[0].url, users[0].accessToken, 'user3_channel@localhost:' + servers[2].port);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield user_subscriptions_1.listUserSubscriptionVideos(servers[0].url, users[0].accessToken, 'createdAt');
                expect(res.body.total).to.equal(3);
                const videos = res.body.data;
                expect(videos).to.be.an('array');
                expect(videos).to.have.lengthOf(3);
                expect(videos[0].name).to.equal('video 1-3');
                expect(videos[1].name).to.equal('video 2-3');
                expect(videos[2].name).to.equal('video server 3 added after follow updated');
            }
            {
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                expect(res.body.total).to.equal(5);
                for (const video of res.body.data) {
                    expect(video.name).to.not.contain('1-3');
                    expect(video.name).to.not.contain('2-3');
                    expect(video.name).to.not.contain('video server 3 added after follow updated');
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
