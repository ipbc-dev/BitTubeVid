"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const uuid_1 = require("uuid");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const user_notifications_1 = require("../../../../shared/extra-utils/users/user-notifications");
const user_subscriptions_1 = require("../../../../shared/extra-utils/users/user-subscriptions");
const videos_1 = require("../../../../shared/models/videos");
describe('Test moderation notifications', function () {
    let servers = [];
    let userAccessToken;
    let userNotifications = [];
    let adminNotifications = [];
    let adminNotificationsServer2 = [];
    let emails = [];
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
        });
    });
    describe('Video abuse for moderators notification', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
        });
        it('Should send a notification to moderators on local video abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuid_1.v4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, uuid, 'super reason');
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoAbuseForModerators(baseParams, uuid, name, 'presence');
            });
        });
        it('Should send a notification to moderators on remote video abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuid_1.v4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.reportVideoAbuse(servers[1].url, servers[1].accessToken, uuid, 'super reason');
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoAbuseForModerators(baseParams, uuid, name, 'presence');
            });
        });
    });
    describe('Video blacklist on my video', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
        });
        it('Should send a notification to video owner on blacklist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuid_1.v4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewBlacklistOnMyVideo(baseParams, uuid, name, 'blacklist');
            });
        });
        it('Should send a notification to video owner on unblacklist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuid_1.v4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewBlacklistOnMyVideo(baseParams, uuid, name, 'unblacklist');
            });
        });
    });
    describe('New registration', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
        });
        it('Should send a notification only to moderators when a user registers on the instance', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.registerUser(servers[0].url, 'user_45', 'password');
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkUserRegistered(baseParams, 'user_45', 'presence');
                const userOverride = { socketNotifications: userNotifications, token: userAccessToken, check: { web: true, mail: false } };
                yield user_notifications_1.checkUserRegistered(extra_utils_1.immutableAssign(baseParams, userOverride), 'user_45', 'absence');
            });
        });
    });
    describe('New instance follows', function () {
        const instanceIndexServer = new extra_utils_1.MockInstancesIndex();
        const config = {
            followings: {
                instance: {
                    autoFollowIndex: {
                        indexUrl: 'http://localhost:42101/api/v1/instances/hosts',
                        enabled: true
                    }
                }
            }
        };
        let baseParams;
        before(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
            yield instanceIndexServer.initialize();
            instanceIndexServer.addInstance(servers[1].host);
        }));
        it('Should send a notification only to admin when there is a new instance follower', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield extra_utils_1.follow(servers[2].url, [servers[0].url], servers[2].accessToken);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewInstanceFollower(baseParams, 'localhost:' + servers[2].port, 'presence');
                const userOverride = { socketNotifications: userNotifications, token: userAccessToken, check: { web: true, mail: false } };
                yield user_notifications_1.checkNewInstanceFollower(extra_utils_1.immutableAssign(baseParams, userOverride), 'localhost:' + servers[2].port, 'absence');
            });
        });
        it('Should send a notification on auto follow back', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                yield extra_utils_1.unfollow(servers[2].url, servers[2].accessToken, servers[0]);
                yield jobs_1.waitJobs(servers);
                const config = {
                    followings: {
                        instance: {
                            autoFollowBack: { enabled: true }
                        }
                    }
                };
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.follow(servers[2].url, [servers[0].url], servers[2].accessToken);
                yield jobs_1.waitJobs(servers);
                const followerHost = servers[0].host;
                const followingHost = servers[2].host;
                yield user_notifications_1.checkAutoInstanceFollowing(baseParams, followerHost, followingHost, 'presence');
                const userOverride = { socketNotifications: userNotifications, token: userAccessToken, check: { web: true, mail: false } };
                yield user_notifications_1.checkAutoInstanceFollowing(extra_utils_1.immutableAssign(baseParams, userOverride), followerHost, followingHost, 'absence');
                config.followings.instance.autoFollowBack.enabled = false;
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[2]);
                yield extra_utils_1.unfollow(servers[2].url, servers[2].accessToken, servers[0]);
            });
        });
        it('Should send a notification on auto instances index follow', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[1]);
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.wait(5000);
                yield jobs_1.waitJobs(servers);
                const followerHost = servers[0].host;
                const followingHost = servers[1].host;
                yield user_notifications_1.checkAutoInstanceFollowing(baseParams, followerHost, followingHost, 'presence');
                config.followings.instance.autoFollowIndex.enabled = false;
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[1]);
            });
        });
    });
    describe('Video-related notifications when video auto-blacklist is enabled', function () {
        let userBaseParams;
        let adminBaseParamsServer1;
        let adminBaseParamsServer2;
        let videoUUID;
        let videoName;
        let currentCustomConfig;
        before(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            adminBaseParamsServer1 = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
            adminBaseParamsServer2 = {
                server: servers[1],
                emails,
                socketNotifications: adminNotificationsServer2,
                token: servers[1].accessToken
            };
            userBaseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
            const resCustomConfig = yield extra_utils_1.getCustomConfig(servers[0].url, servers[0].accessToken);
            currentCustomConfig = resCustomConfig.body;
            const autoBlacklistTestsCustomConfig = extra_utils_1.immutableAssign(currentCustomConfig, {
                autoBlacklist: {
                    videos: {
                        ofUsers: {
                            enabled: true
                        }
                    }
                }
            });
            autoBlacklistTestsCustomConfig.transcoding.enabled = true;
            yield extra_utils_1.updateCustomConfig(servers[0].url, servers[0].accessToken, autoBlacklistTestsCustomConfig);
            yield user_subscriptions_1.addUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            yield user_subscriptions_1.addUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
        }));
        it('Should send notification to moderators on new video with auto-blacklist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                videoName = 'video with auto-blacklist ' + uuid_1.v4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: videoName });
                videoUUID = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoAutoBlacklistForModerators(adminBaseParamsServer1, videoUUID, videoName, 'presence');
            });
        });
        it('Should not send video publish notification if auto-blacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkVideoIsPublished(userBaseParams, videoName, videoUUID, 'absence');
            });
        });
        it('Should not send a local user subscription notification if auto-blacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, videoName, videoUUID, 'absence');
            });
        });
        it('Should not send a remote user subscription notification if auto-blacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, videoName, videoUUID, 'absence');
            });
        });
        it('Should send video published and unblacklist after video unblacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, videoUUID);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should send a local user subscription notification after removed from blacklist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, videoName, videoUUID, 'presence');
            });
        });
        it('Should send a remote user subscription notification after removed from blacklist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, videoName, videoUUID, 'presence');
            });
        });
        it('Should send unblacklist but not published/subscription notes after unblacklisted if scheduled update pending', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const updateAt = new Date(new Date().getTime() + 1000000);
                const name = 'video with auto-blacklist and future schedule ' + uuid_1.v4();
                const data = {
                    name,
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, data);
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewBlacklistOnMyVideo(userBaseParams, uuid, name, 'unblacklist');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, name, uuid, 'absence');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, name, uuid, 'absence');
            });
        });
        it('Should not send publish/subscription notifications after scheduled update if video still auto-blacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const updateAt = new Date(new Date().getTime() + 2000);
                const name = 'video with schedule done and still auto-blacklisted ' + uuid_1.v4();
                const data = {
                    name,
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, data);
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkVideoIsPublished(userBaseParams, name, uuid, 'absence');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, name, uuid, 'absence');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, name, uuid, 'absence');
            });
        });
        it('Should not send a notification to moderators on new video without auto-blacklist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const name = 'video without auto-blacklist ' + uuid_1.v4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoAutoBlacklistForModerators(adminBaseParamsServer1, uuid, name, 'absence');
            });
        });
        after(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateCustomConfig(servers[0].url, servers[0].accessToken, currentCustomConfig);
            yield user_subscriptions_1.removeUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            yield user_subscriptions_1.removeUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
        }));
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
