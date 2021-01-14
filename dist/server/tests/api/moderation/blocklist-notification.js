"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const user_notifications_1 = require("@shared/extra-utils/users/user-notifications");
const user_subscriptions_1 = require("@shared/extra-utils/users/user-subscriptions");
const models_1 = require("@shared/models");
const index_1 = require("../../../../shared/extra-utils/index");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const blocklist_1 = require("../../../../shared/extra-utils/users/blocklist");
const login_1 = require("../../../../shared/extra-utils/users/login");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const expect = chai.expect;
function checkNotifications(url, token, expected) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield user_notifications_1.getUserNotifications(url, token, 0, 10, true);
        const notifications = res.body.data;
        expect(notifications).to.have.lengthOf(expected.length);
        for (const type of expected) {
            expect(notifications.find(n => n.type === type)).to.exist;
        }
    });
}
describe('Test blocklist', function () {
    let servers;
    let videoUUID;
    let userToken1;
    let userToken2;
    let remoteUserToken;
    function resetState() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield user_subscriptions_1.removeUserSubscription(servers[1].url, remoteUserToken, 'user1_channel@' + servers[0].host);
                yield user_subscriptions_1.removeUserSubscription(servers[1].url, remoteUserToken, 'user2_channel@' + servers[0].host);
            }
            catch (_a) { }
            yield jobs_1.waitJobs(servers);
            yield user_notifications_1.markAsReadAllNotifications(servers[0].url, userToken1);
            yield user_notifications_1.markAsReadAllNotifications(servers[0].url, userToken2);
            {
                const res = yield index_1.uploadVideo(servers[0].url, userToken1, { name: 'video' });
                videoUUID = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
            }
            {
                yield video_comments_1.addVideoCommentThread(servers[1].url, remoteUserToken, videoUUID, '@user2@' + servers[0].host + ' hello');
            }
            {
                yield user_subscriptions_1.addUserSubscription(servers[1].url, remoteUserToken, 'user1_channel@' + servers[0].host);
                yield user_subscriptions_1.addUserSubscription(servers[1].url, remoteUserToken, 'user2_channel@' + servers[0].host);
            }
            yield jobs_1.waitJobs(servers);
        });
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield index_1.flushAndRunMultipleServers(2);
            yield login_1.setAccessTokensToServers(servers);
            {
                const user = { username: 'user1', password: 'password' };
                yield index_1.createUser({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    username: user.username,
                    password: user.password,
                    videoQuota: -1,
                    videoQuotaDaily: -1
                });
                userToken1 = yield index_1.userLogin(servers[0], user);
                yield index_1.uploadVideo(servers[0].url, userToken1, { name: 'video user 1' });
            }
            {
                const user = { username: 'user2', password: 'password' };
                yield index_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
                userToken2 = yield index_1.userLogin(servers[0], user);
            }
            {
                const user = { username: 'user3', password: 'password' };
                yield index_1.createUser({ url: servers[1].url, accessToken: servers[1].accessToken, username: user.username, password: user.password });
                remoteUserToken = yield index_1.userLogin(servers[1], user);
            }
            yield index_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('User blocks another user', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield resetState();
            });
        });
        it('Should have appropriate notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const notifs = [models_1.UserNotificationType.NEW_COMMENT_ON_MY_VIDEO, models_1.UserNotificationType.NEW_FOLLOW];
                yield checkNotifications(servers[0].url, userToken1, notifs);
            });
        });
        it('Should block an account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, userToken1, 'user3@' + servers[1].host);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should not have notifications from this account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield checkNotifications(servers[0].url, userToken1, []);
            });
        });
        it('Should have notifications of this account on user 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const notifs = [models_1.UserNotificationType.COMMENT_MENTION, models_1.UserNotificationType.NEW_FOLLOW];
                yield checkNotifications(servers[0].url, userToken2, notifs);
                yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, userToken1, 'user3@' + servers[1].host);
            });
        });
    });
    describe('User blocks another server', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield resetState();
            });
        });
        it('Should have appropriate notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const notifs = [models_1.UserNotificationType.NEW_COMMENT_ON_MY_VIDEO, models_1.UserNotificationType.NEW_FOLLOW];
                yield checkNotifications(servers[0].url, userToken1, notifs);
            });
        });
        it('Should block an account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield blocklist_1.addServerToAccountBlocklist(servers[0].url, userToken1, servers[1].host);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should not have notifications from this account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield checkNotifications(servers[0].url, userToken1, []);
            });
        });
        it('Should have notifications of this account on user 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const notifs = [models_1.UserNotificationType.COMMENT_MENTION, models_1.UserNotificationType.NEW_FOLLOW];
                yield checkNotifications(servers[0].url, userToken2, notifs);
                yield blocklist_1.removeServerFromAccountBlocklist(servers[0].url, userToken1, servers[1].host);
            });
        });
    });
    describe('Server blocks a user', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield resetState();
            });
        });
        it('Should have appropriate notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const notifs = [models_1.UserNotificationType.NEW_COMMENT_ON_MY_VIDEO, models_1.UserNotificationType.NEW_FOLLOW];
                    yield checkNotifications(servers[0].url, userToken1, notifs);
                }
                {
                    const notifs = [models_1.UserNotificationType.COMMENT_MENTION, models_1.UserNotificationType.NEW_FOLLOW];
                    yield checkNotifications(servers[0].url, userToken2, notifs);
                }
            });
        });
        it('Should block an account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, 'user3@' + servers[1].host);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should not have notifications from this account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield checkNotifications(servers[0].url, userToken1, []);
                yield checkNotifications(servers[0].url, userToken2, []);
                yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, 'user3@' + servers[1].host);
            });
        });
    });
    describe('Server blocks a server', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield resetState();
            });
        });
        it('Should have appropriate notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const notifs = [models_1.UserNotificationType.NEW_COMMENT_ON_MY_VIDEO, models_1.UserNotificationType.NEW_FOLLOW];
                    yield checkNotifications(servers[0].url, userToken1, notifs);
                }
                {
                    const notifs = [models_1.UserNotificationType.COMMENT_MENTION, models_1.UserNotificationType.NEW_FOLLOW];
                    yield checkNotifications(servers[0].url, userToken2, notifs);
                }
            });
        });
        it('Should block an account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield blocklist_1.addServerToServerBlocklist(servers[0].url, servers[0].accessToken, servers[1].host);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should not have notifications from this account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield checkNotifications(servers[0].url, userToken1, []);
                yield checkNotifications(servers[0].url, userToken2, []);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
