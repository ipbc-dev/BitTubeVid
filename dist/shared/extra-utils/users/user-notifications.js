"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNewAccountAbuseForModerators = exports.checkNewCommentAbuseForModerators = exports.prepareNotificationsTest = exports.checkNewInstanceFollower = exports.getLastNotification = exports.markAsReadNotifications = exports.getUserNotifications = exports.checkAbuseStateChange = exports.checkNewAbuseMessage = exports.checkVideoAutoBlacklistForModerators = exports.checkNewVideoAbuseForModerators = exports.updateMyNotificationSettings = exports.checkCommentMention = exports.checkNewBlacklistOnMyVideo = exports.checkNewCommentOnMyVideo = exports.checkNewActorFollow = exports.checkNewVideoFromSubscription = exports.checkVideoIsPublished = exports.checkAutoInstanceFollowing = exports.checkUserRegistered = exports.checkMyVideoImportIsFinished = exports.markAsReadAllNotifications = exports.checkNotification = exports.getAllNotificationsSettings = void 0;
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const util_1 = require("util");
const users_1 = require("../../models/users");
const email_1 = require("../miscs/email");
const requests_1 = require("../requests/requests");
const follows_1 = require("../server/follows");
const servers_1 = require("../server/servers");
const socket_io_1 = require("../socket/socket-io");
const login_1 = require("./login");
const users_2 = require("./users");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function updateMyNotificationSettings(url, token, settings, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/me/notification-settings';
    return requests_1.makePutBodyRequest({
        url,
        path,
        token,
        fields: settings,
        statusCodeExpected
    });
}
exports.updateMyNotificationSettings = updateMyNotificationSettings;
function getUserNotifications(url, token, start, count, unread, sort = '-createdAt', statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const path = '/api/v1/users/me/notifications';
        return requests_1.makeGetRequest({
            url,
            path,
            token,
            query: {
                start,
                count,
                sort,
                unread
            },
            statusCodeExpected
        });
    });
}
exports.getUserNotifications = getUserNotifications;
function markAsReadNotifications(url, token, ids, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/me/notifications/read';
    return requests_1.makePostBodyRequest({
        url,
        path,
        token,
        fields: { ids },
        statusCodeExpected
    });
}
exports.markAsReadNotifications = markAsReadNotifications;
function markAsReadAllNotifications(url, token, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/me/notifications/read-all';
    return requests_1.makePostBodyRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.markAsReadAllNotifications = markAsReadAllNotifications;
function getLastNotification(serverUrl, accessToken) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield getUserNotifications(serverUrl, accessToken, 0, 1, undefined, '-createdAt');
        if (res.body.total === 0)
            return undefined;
        return res.body.data[0];
    });
}
exports.getLastNotification = getLastNotification;
function checkNotification(base, notificationChecker, emailNotificationFinder, checkType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const check = base.check || { web: true, mail: true };
        if (check.web) {
            const notification = yield getLastNotification(base.server.url, base.token);
            if (notification || checkType !== 'absence') {
                notificationChecker(notification, checkType);
            }
            const socketNotification = base.socketNotifications.find(n => {
                try {
                    notificationChecker(n, 'presence');
                    return true;
                }
                catch (_a) {
                    return false;
                }
            });
            if (checkType === 'presence') {
                const obj = util_1.inspect(base.socketNotifications, { depth: 5 });
                chai_1.expect(socketNotification, 'The socket notification is absent when it should be present. ' + obj).to.not.be.undefined;
            }
            else {
                const obj = util_1.inspect(socketNotification, { depth: 5 });
                chai_1.expect(socketNotification, 'The socket notification is present when it should not be present. ' + obj).to.be.undefined;
            }
        }
        if (check.mail) {
            const email = base.emails
                .slice()
                .reverse()
                .find(e => emailNotificationFinder(e));
            if (checkType === 'presence') {
                const emails = base.emails.map(e => e.text);
                chai_1.expect(email, 'The email is absent when is should be present. ' + util_1.inspect(emails)).to.not.be.undefined;
            }
            else {
                chai_1.expect(email, 'The email is present when is should not be present. ' + util_1.inspect(email)).to.be.undefined;
            }
        }
    });
}
exports.checkNotification = checkNotification;
function checkVideo(video, videoName, videoUUID) {
    if (videoName) {
        chai_1.expect(video.name).to.be.a('string');
        chai_1.expect(video.name).to.not.be.empty;
        chai_1.expect(video.name).to.equal(videoName);
    }
    if (videoUUID) {
        chai_1.expect(video.uuid).to.be.a('string');
        chai_1.expect(video.uuid).to.not.be.empty;
        chai_1.expect(video.uuid).to.equal(videoUUID);
    }
    chai_1.expect(video.id).to.be.a('number');
}
function checkActor(actor) {
    chai_1.expect(actor.displayName).to.be.a('string');
    chai_1.expect(actor.displayName).to.not.be.empty;
    chai_1.expect(actor.host).to.not.be.undefined;
}
function checkComment(comment, commentId, threadId) {
    chai_1.expect(comment.id).to.equal(commentId);
    chai_1.expect(comment.threadId).to.equal(threadId);
}
function checkNewVideoFromSubscription(base, videoName, videoUUID, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_VIDEO_FROM_SUBSCRIPTION;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                checkVideo(notification.video, videoName, videoUUID);
                checkActor(notification.video.channel);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.type !== users_1.UserNotificationType.NEW_VIDEO_FROM_SUBSCRIPTION || n.video.name !== videoName;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.indexOf(videoUUID) !== -1 && text.indexOf('Your subscription') !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkNewVideoFromSubscription = checkNewVideoFromSubscription;
function checkVideoIsPublished(base, videoName, videoUUID, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.MY_VIDEO_PUBLISHED;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                checkVideo(notification.video, videoName, videoUUID);
                checkActor(notification.video.channel);
            }
            else {
                chai_1.expect(notification.video).to.satisfy(v => v === undefined || v.name !== videoName);
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.includes(videoUUID) && text.includes('Your video');
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkVideoIsPublished = checkVideoIsPublished;
function checkMyVideoImportIsFinished(base, videoName, videoUUID, url, success, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = success ? users_1.UserNotificationType.MY_VIDEO_IMPORT_SUCCESS : users_1.UserNotificationType.MY_VIDEO_IMPORT_ERROR;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                chai_1.expect(notification.videoImport.targetUrl).to.equal(url);
                if (success)
                    checkVideo(notification.videoImport.video, videoName, videoUUID);
            }
            else {
                chai_1.expect(notification.videoImport).to.satisfy(i => i === undefined || i.targetUrl !== url);
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            const toFind = success ? ' finished' : ' error';
            return text.includes(url) && text.includes(toFind);
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkMyVideoImportIsFinished = checkMyVideoImportIsFinished;
function checkUserRegistered(base, username, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_USER_REGISTRATION;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                checkActor(notification.account);
                chai_1.expect(notification.account.name).to.equal(username);
            }
            else {
                chai_1.expect(notification).to.satisfy(n => n.type !== notificationType || n.account.name !== username);
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.includes(' registered.') && text.includes(username);
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkUserRegistered = checkUserRegistered;
function checkNewActorFollow(base, followType, followerName, followerDisplayName, followingDisplayName, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_FOLLOW;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                checkActor(notification.actorFollow.follower);
                chai_1.expect(notification.actorFollow.follower.displayName).to.equal(followerDisplayName);
                chai_1.expect(notification.actorFollow.follower.name).to.equal(followerName);
                chai_1.expect(notification.actorFollow.follower.host).to.not.be.undefined;
                const following = notification.actorFollow.following;
                chai_1.expect(following.displayName).to.equal(followingDisplayName);
                chai_1.expect(following.type).to.equal(followType);
            }
            else {
                chai_1.expect(notification).to.satisfy(n => {
                    return n.type !== notificationType ||
                        (n.actorFollow.follower.name !== followerName && n.actorFollow.following !== followingDisplayName);
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.includes(followType) && text.includes(followingDisplayName) && text.includes(followerDisplayName);
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkNewActorFollow = checkNewActorFollow;
function checkNewInstanceFollower(base, followerHost, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_INSTANCE_FOLLOWER;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                checkActor(notification.actorFollow.follower);
                chai_1.expect(notification.actorFollow.follower.name).to.equal('peertube');
                chai_1.expect(notification.actorFollow.follower.host).to.equal(followerHost);
                chai_1.expect(notification.actorFollow.following.name).to.equal('peertube');
            }
            else {
                chai_1.expect(notification).to.satisfy(n => {
                    return n.type !== notificationType || n.actorFollow.follower.host !== followerHost;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.includes('instance has a new follower') && text.includes(followerHost);
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkNewInstanceFollower = checkNewInstanceFollower;
function checkAutoInstanceFollowing(base, followerHost, followingHost, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.AUTO_INSTANCE_FOLLOWING;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                const following = notification.actorFollow.following;
                checkActor(following);
                chai_1.expect(following.name).to.equal('peertube');
                chai_1.expect(following.host).to.equal(followingHost);
                chai_1.expect(notification.actorFollow.follower.name).to.equal('peertube');
                chai_1.expect(notification.actorFollow.follower.host).to.equal(followerHost);
            }
            else {
                chai_1.expect(notification).to.satisfy(n => {
                    return n.type !== notificationType || n.actorFollow.following.host !== followingHost;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.includes(' automatically followed a new instance') && text.includes(followingHost);
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkAutoInstanceFollowing = checkAutoInstanceFollowing;
function checkCommentMention(base, uuid, commentId, threadId, byAccountDisplayName, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.COMMENT_MENTION;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                checkComment(notification.comment, commentId, threadId);
                checkActor(notification.comment.account);
                chai_1.expect(notification.comment.account.displayName).to.equal(byAccountDisplayName);
                checkVideo(notification.comment.video, undefined, uuid);
            }
            else {
                chai_1.expect(notification).to.satisfy(n => n.type !== notificationType || n.comment.id !== commentId);
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.includes(' mentioned ') && text.includes(uuid) && text.includes(byAccountDisplayName);
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkCommentMention = checkCommentMention;
let lastEmailCount = 0;
function checkNewCommentOnMyVideo(base, uuid, commentId, threadId, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_COMMENT_ON_MY_VIDEO;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                checkComment(notification.comment, commentId, threadId);
                checkActor(notification.comment.account);
                checkVideo(notification.comment.video, undefined, uuid);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.comment === undefined || n.comment.id !== commentId;
                });
            }
        }
        const commentUrl = `http://localhost:${base.server.port}/videos/watch/${uuid};threadId=${threadId}`;
        function emailNotificationFinder(email) {
            return email['text'].indexOf(commentUrl) !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
        if (type === 'presence') {
            chai_1.expect(base.emails).to.have.length.above(lastEmailCount);
            lastEmailCount = base.emails.length;
        }
    });
}
exports.checkNewCommentOnMyVideo = checkNewCommentOnMyVideo;
function checkNewVideoAbuseForModerators(base, videoUUID, videoName, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_ABUSE_FOR_MODERATORS;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                chai_1.expect(notification.abuse.id).to.be.a('number');
                checkVideo(notification.abuse.video, videoName, videoUUID);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.abuse === undefined || n.abuse.video.uuid !== videoUUID;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.indexOf(videoUUID) !== -1 && text.indexOf('abuse') !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkNewVideoAbuseForModerators = checkNewVideoAbuseForModerators;
function checkNewAbuseMessage(base, abuseId, message, toEmail, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.ABUSE_NEW_MESSAGE;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                chai_1.expect(notification.abuse.id).to.equal(abuseId);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.type !== notificationType || n.abuse === undefined || n.abuse.id !== abuseId;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            const to = email['to'].filter(t => t.address === toEmail);
            return text.indexOf(message) !== -1 && to.length !== 0;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkNewAbuseMessage = checkNewAbuseMessage;
function checkAbuseStateChange(base, abuseId, state, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.ABUSE_STATE_CHANGE;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                chai_1.expect(notification.abuse.id).to.equal(abuseId);
                chai_1.expect(notification.abuse.state).to.equal(state);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.abuse === undefined || n.abuse.id !== abuseId;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            const contains = state === 3
                ? ' accepted'
                : ' rejected';
            return text.indexOf(contains) !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkAbuseStateChange = checkAbuseStateChange;
function checkNewCommentAbuseForModerators(base, videoUUID, videoName, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_ABUSE_FOR_MODERATORS;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                chai_1.expect(notification.abuse.id).to.be.a('number');
                checkVideo(notification.abuse.comment.video, videoName, videoUUID);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.abuse === undefined || n.abuse.comment.video.uuid !== videoUUID;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.indexOf(videoUUID) !== -1 && text.indexOf('abuse') !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkNewCommentAbuseForModerators = checkNewCommentAbuseForModerators;
function checkNewAccountAbuseForModerators(base, displayName, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.NEW_ABUSE_FOR_MODERATORS;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                chai_1.expect(notification.abuse.id).to.be.a('number');
                chai_1.expect(notification.abuse.account.displayName).to.equal(displayName);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.abuse === undefined || n.abuse.account.displayName !== displayName;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.indexOf(displayName) !== -1 && text.indexOf('abuse') !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkNewAccountAbuseForModerators = checkNewAccountAbuseForModerators;
function checkVideoAutoBlacklistForModerators(base, videoUUID, videoName, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = users_1.UserNotificationType.VIDEO_AUTO_BLACKLIST_FOR_MODERATORS;
        function notificationChecker(notification, type) {
            if (type === 'presence') {
                chai_1.expect(notification).to.not.be.undefined;
                chai_1.expect(notification.type).to.equal(notificationType);
                chai_1.expect(notification.videoBlacklist.video.id).to.be.a('number');
                checkVideo(notification.videoBlacklist.video, videoName, videoUUID);
            }
            else {
                chai_1.expect(notification).to.satisfy((n) => {
                    return n === undefined || n.video === undefined || n.video.uuid !== videoUUID;
                });
            }
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.indexOf(videoUUID) !== -1 && email['text'].indexOf('video-auto-blacklist/list') !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, type);
    });
}
exports.checkVideoAutoBlacklistForModerators = checkVideoAutoBlacklistForModerators;
function checkNewBlacklistOnMyVideo(base, videoUUID, videoName, blacklistType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const notificationType = blacklistType === 'blacklist'
            ? users_1.UserNotificationType.BLACKLIST_ON_MY_VIDEO
            : users_1.UserNotificationType.UNBLACKLIST_ON_MY_VIDEO;
        function notificationChecker(notification) {
            chai_1.expect(notification).to.not.be.undefined;
            chai_1.expect(notification.type).to.equal(notificationType);
            const video = blacklistType === 'blacklist' ? notification.videoBlacklist.video : notification.video;
            checkVideo(video, videoName, videoUUID);
        }
        function emailNotificationFinder(email) {
            const text = email['text'];
            return text.indexOf(videoUUID) !== -1 && text.indexOf(' ' + blacklistType) !== -1;
        }
        yield checkNotification(base, notificationChecker, emailNotificationFinder, 'presence');
    });
}
exports.checkNewBlacklistOnMyVideo = checkNewBlacklistOnMyVideo;
function getAllNotificationsSettings() {
    return {
        newVideoFromSubscription: 1 | 2,
        newCommentOnMyVideo: 1 | 2,
        abuseAsModerator: 1 | 2,
        videoAutoBlacklistAsModerator: 1 | 2,
        blacklistOnMyVideo: 1 | 2,
        myVideoImportFinished: 1 | 2,
        myVideoPublished: 1 | 2,
        commentMention: 1 | 2,
        newFollow: 1 | 2,
        newUserRegistration: 1 | 2,
        newInstanceFollower: 1 | 2,
        abuseNewMessage: 1 | 2,
        abuseStateChange: 1 | 2,
        autoInstanceFollowing: 1 | 2
    };
}
exports.getAllNotificationsSettings = getAllNotificationsSettings;
function prepareNotificationsTest(serversCount = 3) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const userNotifications = [];
        const adminNotifications = [];
        const adminNotificationsServer2 = [];
        const emails = [];
        const port = yield email_1.MockSmtpServer.Instance.collectEmails(emails);
        const overrideConfig = {
            smtp: {
                hostname: 'localhost',
                port
            },
            signup: {
                limit: 20
            }
        };
        const servers = yield servers_1.flushAndRunMultipleServers(serversCount, overrideConfig);
        yield login_1.setAccessTokensToServers(servers);
        if (serversCount > 1) {
            yield follows_1.doubleFollow(servers[0], servers[1]);
        }
        const user = {
            username: 'user_1',
            password: 'super password'
        };
        yield users_2.createUser({
            url: servers[0].url,
            accessToken: servers[0].accessToken,
            username: user.username,
            password: user.password,
            videoQuota: 10 * 1000 * 1000
        });
        const userAccessToken = yield login_1.userLogin(servers[0], user);
        yield updateMyNotificationSettings(servers[0].url, userAccessToken, getAllNotificationsSettings());
        yield updateMyNotificationSettings(servers[0].url, servers[0].accessToken, getAllNotificationsSettings());
        if (serversCount > 1) {
            yield updateMyNotificationSettings(servers[1].url, servers[1].accessToken, getAllNotificationsSettings());
        }
        {
            const socket = socket_io_1.getUserNotificationSocket(servers[0].url, userAccessToken);
            socket.on('new-notification', n => userNotifications.push(n));
        }
        {
            const socket = socket_io_1.getUserNotificationSocket(servers[0].url, servers[0].accessToken);
            socket.on('new-notification', n => adminNotifications.push(n));
        }
        if (serversCount > 1) {
            const socket = socket_io_1.getUserNotificationSocket(servers[1].url, servers[1].accessToken);
            socket.on('new-notification', n => adminNotificationsServer2.push(n));
        }
        const resChannel = yield users_2.getMyUserInformation(servers[0].url, servers[0].accessToken);
        const channelId = resChannel.body.videoChannels[0].id;
        return {
            userNotifications,
            adminNotifications,
            adminNotificationsServer2,
            userAccessToken,
            emails,
            servers,
            channelId
        };
    });
}
exports.prepareNotificationsTest = prepareNotificationsTest;
