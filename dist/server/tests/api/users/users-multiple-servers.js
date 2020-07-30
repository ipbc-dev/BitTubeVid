"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const accounts_1 = require("../../../../shared/extra-utils/users/accounts");
const login_1 = require("../../../../shared/extra-utils/users/login");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test users with multiple servers', function () {
    let servers = [];
    let user;
    let userId;
    let videoUUID;
    let userAccessToken;
    let userAvatarFilename;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3);
            yield login_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.doubleFollow(servers[0], servers[2]);
            yield extra_utils_1.doubleFollow(servers[1], servers[2]);
            yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, {});
            {
                const user = {
                    username: 'user1',
                    password: 'password'
                };
                const res = yield extra_utils_1.createUser({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    username: user.username,
                    password: user.password
                });
                userId = res.body.user.id;
                userAccessToken = yield extra_utils_1.userLogin(servers[0], user);
            }
            {
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, {});
                videoUUID = resVideo.body.video.uuid;
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should be able to update my display name', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.updateMyUser({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                displayName: 'my super display name'
            });
            const res = yield index_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
            user = res.body;
            expect(user.account.displayName).to.equal('my super display name');
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should be able to update my description', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.updateMyUser({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                description: 'my super description updated'
            });
            const res = yield index_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
            user = res.body;
            expect(user.account.displayName).to.equal('my super display name');
            expect(user.account.description).to.equal('my super description updated');
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should be able to update my avatar', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const fixture = 'avatar2.png';
            yield index_1.updateMyAvatar({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                fixture
            });
            const res = yield index_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
            user = res.body;
            userAvatarFilename = user.account.avatar.path;
            yield index_1.testImage(servers[0].url, 'avatar2-resized', userAvatarFilename, '.png');
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have updated my profile on other servers too', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const resAccounts = yield accounts_1.getAccountsList(server.url, '-createdAt');
                const rootServer1List = resAccounts.body.data.find(a => a.name === 'root' && a.host === 'localhost:' + servers[0].port);
                expect(rootServer1List).not.to.be.undefined;
                const resAccount = yield accounts_1.getAccount(server.url, rootServer1List.name + '@' + rootServer1List.host);
                const rootServer1Get = resAccount.body;
                expect(rootServer1Get.name).to.equal('root');
                expect(rootServer1Get.host).to.equal('localhost:' + servers[0].port);
                expect(rootServer1Get.displayName).to.equal('my super display name');
                expect(rootServer1Get.description).to.equal('my super description updated');
                if (server.serverNumber === 1) {
                    expect(rootServer1Get.userId).to.be.a('number');
                }
                else {
                    expect(rootServer1Get.userId).to.be.undefined;
                }
                yield index_1.testImage(server.url, 'avatar2-resized', rootServer1Get.avatar.path, '.png');
            }
        });
    });
    it('Should list account videos', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield extra_utils_1.getAccountVideos(server.url, server.accessToken, 'user1@localhost:' + servers[0].port, 0, 5);
                expect(res.body.total).to.equal(1);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(1);
                expect(res.body.data[0].uuid).to.equal(videoUUID);
            }
        });
    });
    it('Should remove the user', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            for (const server of servers) {
                const resAccounts = yield accounts_1.getAccountsList(server.url, '-createdAt');
                const accountDeleted = resAccounts.body.data.find(a => a.name === 'user1' && a.host === 'localhost:' + servers[0].port);
                expect(accountDeleted).not.to.be.undefined;
                const resVideoChannels = yield extra_utils_1.getVideoChannelsList(server.url, 0, 10);
                const videoChannelDeleted = resVideoChannels.body.data.find(a => {
                    return a.displayName === 'Main user1 channel' && a.host === 'localhost:' + servers[0].port;
                });
                expect(videoChannelDeleted).not.to.be.undefined;
            }
            yield extra_utils_1.removeUser(servers[0].url, userId, servers[0].accessToken);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const resAccounts = yield accounts_1.getAccountsList(server.url, '-createdAt');
                const accountDeleted = resAccounts.body.data.find(a => a.name === 'user1' && a.host === 'localhost:' + servers[0].port);
                expect(accountDeleted).to.be.undefined;
                const resVideoChannels = yield extra_utils_1.getVideoChannelsList(server.url, 0, 10);
                const videoChannelDeleted = resVideoChannels.body.data.find(a => {
                    return a.name === 'Main user1 channel' && a.host === 'localhost:' + servers[0].port;
                });
                expect(videoChannelDeleted).to.be.undefined;
            }
        });
    });
    it('Should not have actor files', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        for (const server of servers) {
            yield accounts_1.checkActorFilesWereRemoved(userAvatarFilename, server.internalServerNumber);
        }
    }));
    it('Should not have video files', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        for (const server of servers) {
            yield extra_utils_1.checkVideoFilesWereRemoved(videoUUID, server.internalServerNumber);
        }
    }));
    it('Should have an empty tmp directory', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                yield extra_utils_1.checkTmpIsEmpty(server);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
