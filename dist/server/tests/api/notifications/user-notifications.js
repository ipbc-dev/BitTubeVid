"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const uuid_1 = require("uuid");
const extra_utils_1 = require("../../../../shared/extra-utils");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const user_notifications_1 = require("../../../../shared/extra-utils/users/user-notifications");
const user_subscriptions_1 = require("../../../../shared/extra-utils/users/user-subscriptions");
const video_imports_1 = require("../../../../shared/extra-utils/videos/video-imports");
const users_1 = require("../../../../shared/models/users");
const expect = chai.expect;
describe('Test user notifications', function () {
    let servers = [];
    let userAccessToken;
    let userNotifications = [];
    let adminNotifications = [];
    let adminNotificationsServer2 = [];
    let emails = [];
    let channelId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const res = yield user_notifications_1.prepareNotificationsTest(3);
            emails = res.emails;
            userAccessToken = res.userAccessToken;
            servers = res.servers;
            userNotifications = res.userNotifications;
            adminNotifications = res.adminNotifications;
            adminNotificationsServer2 = res.adminNotificationsServer2;
            channelId = res.channelId;
        });
    });
    describe('New video from my subscription notification', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
        });
        it('Should not send notifications if the user does not follow the video publisher', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.uploadRandomVideoOnServers(servers, 1);
                const notification = yield user_notifications_1.getLastNotification(servers[0].url, userAccessToken);
                expect(notification).to.be.undefined;
                expect(emails).to.have.lengthOf(0);
                expect(userNotifications).to.have.lengthOf(0);
            });
        });
        it('Should send a new video notification if the user follows the local video publisher', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                yield user_subscriptions_1.addUserSubscription(servers[0].url, userAccessToken, 'root_channel@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 1);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification from a remote account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                yield user_subscriptions_1.addUserSubscription(servers[0].url, userAccessToken, 'root_channel@localhost:' + servers[1].port);
                yield jobs_1.waitJobs(servers);
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification on a scheduled publication', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const updateAt = new Date(new Date().getTime() + 2000);
                const data = {
                    privacy: 3,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: 1
                    }
                };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 1, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification on a remote scheduled publication', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const updateAt = new Date(new Date().getTime() + 2000);
                const data = {
                    privacy: 3,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: 1
                    }
                };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, data);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should not send a notification before the video is published', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const updateAt = new Date(new Date().getTime() + 1000000);
                const data = {
                    privacy: 3,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: 1
                    }
                };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 1, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
            });
        });
        it('Should send a new video notification when a video becomes public', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const data = { privacy: 3 };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 1, data);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, uuid, { privacy: 1 });
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification when a remote video becomes public', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const data = { privacy: 3 };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, data);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
                yield extra_utils_1.updateVideo(servers[1].url, servers[1].accessToken, uuid, { privacy: 1 });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should not send a new video notification when a video becomes unlisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const data = { privacy: 3 };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 1, data);
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, uuid, { privacy: 2 });
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
            });
        });
        it('Should not send a new video notification when a remote video becomes unlisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const data = { privacy: 3 };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, data);
                yield extra_utils_1.updateVideo(servers[1].url, servers[1].accessToken, uuid, { privacy: 2 });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
            });
        });
        it('Should send a new video notification after a video import', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(100000);
                const name = 'video import ' + uuid_1.v4();
                const attributes = {
                    name,
                    channelId,
                    privacy: 1,
                    targetUrl: video_imports_1.getGoodVideoUrl()
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
    });
    describe('My video is published', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[1],
                emails,
                socketNotifications: adminNotificationsServer2,
                token: servers[1].accessToken
            };
        });
        it('Should not send a notification if transcoding is not enabled', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 1);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'absence');
            });
        });
        it('Should not send a notification if the wait transcoding is false', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, { waitTranscoding: false });
                yield jobs_1.waitJobs(servers);
                const notification = yield user_notifications_1.getLastNotification(servers[0].url, userAccessToken);
                if (notification) {
                    expect(notification.type).to.not.equal(users_1.UserNotificationType.MY_VIDEO_PUBLISHED);
                }
            });
        });
        it('Should send a notification even if the video is not transcoded in other resolutions', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, { waitTranscoding: true, fixture: 'video_short_240p.mp4' });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a notification with a transcoded video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, { waitTranscoding: true });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a notification when an imported video is transcoded', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const name = 'video import ' + uuid_1.v4();
                const attributes = {
                    name,
                    channelId,
                    privacy: 1,
                    targetUrl: video_imports_1.getGoodVideoUrl(),
                    waitTranscoding: true
                };
                const res = yield video_imports_1.importVideo(servers[1].url, servers[1].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a notification when the scheduled update has been proceeded', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(70000);
                const updateAt = new Date(new Date().getTime() + 2000);
                const data = {
                    privacy: 3,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: 1
                    }
                };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should not send a notification before the video is published', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                const updateAt = new Date(new Date().getTime() + 1000000);
                const data = {
                    privacy: 3,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: 1
                    }
                };
                const { name, uuid } = yield extra_utils_1.uploadRandomVideoOnServers(servers, 2, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'absence');
            });
        });
    });
    describe('My video is imported', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
        });
        it('Should send a notification when the video import failed', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(70000);
                const name = 'video import ' + uuid_1.v4();
                const attributes = {
                    name,
                    channelId,
                    privacy: 3,
                    targetUrl: video_imports_1.getBadVideoUrl()
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkMyVideoImportIsFinished(baseParams, name, uuid, video_imports_1.getBadVideoUrl(), false, 'presence');
            });
        });
        it('Should send a notification when the video import succeeded', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(70000);
                const name = 'video import ' + uuid_1.v4();
                const attributes = {
                    name,
                    channelId,
                    privacy: 3,
                    targetUrl: video_imports_1.getGoodVideoUrl()
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkMyVideoImportIsFinished(baseParams, name, uuid, video_imports_1.getGoodVideoUrl(), true, 'presence');
            });
        });
    });
    describe('New actor follow', function () {
        let baseParams;
        const myChannelName = 'super channel name';
        const myUserName = 'super user name';
        before(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
            yield extra_utils_1.updateMyUser({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                displayName: 'super root name'
            });
            yield extra_utils_1.updateMyUser({
                url: servers[0].url,
                accessToken: userAccessToken,
                displayName: myUserName
            });
            yield extra_utils_1.updateMyUser({
                url: servers[1].url,
                accessToken: servers[1].accessToken,
                displayName: 'super root 2 name'
            });
            yield extra_utils_1.updateVideoChannel(servers[0].url, userAccessToken, 'user_1_channel', { displayName: myChannelName });
        }));
        it('Should notify when a local channel is following one of our channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield user_subscriptions_1.addUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewActorFollow(baseParams, 'channel', 'root', 'super root name', myChannelName, 'presence');
                yield user_subscriptions_1.removeUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            });
        });
        it('Should notify when a remote channel is following one of our channel', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield user_subscriptions_1.addUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewActorFollow(baseParams, 'channel', 'root', 'super root 2 name', myChannelName, 'presence');
                yield user_subscriptions_1.removeUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
