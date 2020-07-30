"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const user_subscriptions_1 = require("@shared/extra-utils/users/user-subscriptions");
const extra_utils_1 = require("../../../../shared/extra-utils");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const user_notifications_1 = require("../../../../shared/extra-utils/users/user-notifications");
const users_1 = require("../../../../shared/models/users");
const expect = chai.expect;
describe('Test notifications API', function () {
    let server;
    let userNotifications = [];
    let userAccessToken;
    let emails = [];
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const res = yield user_notifications_1.prepareNotificationsTest(1);
            emails = res.emails;
            userAccessToken = res.userAccessToken;
            userNotifications = res.userNotifications;
            server = res.servers[0];
            yield user_subscriptions_1.addUserSubscription(server.url, userAccessToken, 'root_channel@localhost:' + server.port);
            for (let i = 0; i < 10; i++) {
                yield extra_utils_1.uploadRandomVideo(server, false);
            }
            yield extra_utils_1.waitJobs([server]);
        });
    });
    describe('Mark as read', function () {
        it('Should mark as read some notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(server.url, userAccessToken, 2, 3);
                const ids = res.body.data.map(n => n.id);
                yield user_notifications_1.markAsReadNotifications(server.url, userAccessToken, ids);
            });
        });
        it('Should have the notifications marked as read', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(server.url, userAccessToken, 0, 10);
                const notifications = res.body.data;
                expect(notifications[0].read).to.be.false;
                expect(notifications[1].read).to.be.false;
                expect(notifications[2].read).to.be.true;
                expect(notifications[3].read).to.be.true;
                expect(notifications[4].read).to.be.true;
                expect(notifications[5].read).to.be.false;
            });
        });
        it('Should only list read notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(server.url, userAccessToken, 0, 10, false);
                const notifications = res.body.data;
                for (const notification of notifications) {
                    expect(notification.read).to.be.true;
                }
            });
        });
        it('Should only list unread notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(server.url, userAccessToken, 0, 10, true);
                const notifications = res.body.data;
                for (const notification of notifications) {
                    expect(notification.read).to.be.false;
                }
            });
        });
        it('Should mark as read all notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.markAsReadAllNotifications(server.url, userAccessToken);
                const res = yield user_notifications_1.getUserNotifications(server.url, userAccessToken, 0, 10, true);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.have.lengthOf(0);
            });
        });
    });
    describe('Notification settings', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: server,
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
        });
        it('Should not have notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(server.url, userAccessToken, extra_utils_1.immutableAssign(user_notifications_1.getAllNotificationsSettings(), {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.NONE
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(server.url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.NONE);
                }
                const { name, uuid } = yield extra_utils_1.uploadRandomVideo(server);
                const check = { web: true, mail: true };
                yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'absence');
            });
        });
        it('Should only have web notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(server.url, userAccessToken, extra_utils_1.immutableAssign(user_notifications_1.getAllNotificationsSettings(), {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(server.url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.WEB);
                }
                const { name, uuid } = yield extra_utils_1.uploadRandomVideo(server);
                {
                    const check = { mail: true, web: false };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'absence');
                }
                {
                    const check = { mail: false, web: true };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'presence');
                }
            });
        });
        it('Should only have mail notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(server.url, userAccessToken, extra_utils_1.immutableAssign(user_notifications_1.getAllNotificationsSettings(), {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.EMAIL
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(server.url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.EMAIL);
                }
                const { name, uuid } = yield extra_utils_1.uploadRandomVideo(server);
                {
                    const check = { mail: false, web: true };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'absence');
                }
                {
                    const check = { mail: true, web: false };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'presence');
                }
            });
        });
        it('Should have email and web notifications', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(server.url, userAccessToken, extra_utils_1.immutableAssign(user_notifications_1.getAllNotificationsSettings(), {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(server.url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL);
                }
                const { name, uuid } = yield extra_utils_1.uploadRandomVideo(server);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
