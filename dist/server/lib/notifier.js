"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifier = void 0;
const tslib_1 = require("tslib");
const application_1 = require("@server/models/application/application");
const server_blocklist_1 = require("@server/models/server/server-blocklist");
const users_1 = require("../../shared/models/users");
const videos_1 = require("../../shared/models/videos");
const logger_1 = require("../helpers/logger");
const config_1 = require("../initializers/config");
const account_blocklist_1 = require("../models/account/account-blocklist");
const user_1 = require("../models/account/user");
const user_notification_1 = require("../models/account/user-notification");
const blocklist_1 = require("./blocklist");
const emailer_1 = require("./emailer");
const peertube_socket_1 = require("./peertube-socket");
class Notifier {
    constructor() {
    }
    notifyOnNewVideoIfNeeded(video) {
        if (video.privacy !== videos_1.VideoPrivacy.PUBLIC || video.state !== videos_1.VideoState.PUBLISHED || video.isBlacklisted())
            return;
        this.notifySubscribersOfNewVideo(video)
            .catch(err => logger_1.logger.error('Cannot notify subscribers of new video %s.', video.url, { err }));
    }
    notifyOnVideoPublishedAfterTranscoding(video) {
        if (!video.waitTranscoding || video.VideoBlacklist || video.ScheduleVideoUpdate)
            return;
        this.notifyOwnedVideoHasBeenPublished(video)
            .catch(err => logger_1.logger.error('Cannot notify owner that its video %s has been published after transcoding.', video.url, { err }));
    }
    notifyOnVideoPublishedAfterScheduledUpdate(video) {
        if (video.VideoBlacklist || (video.waitTranscoding && video.state !== videos_1.VideoState.PUBLISHED))
            return;
        this.notifyOwnedVideoHasBeenPublished(video)
            .catch(err => logger_1.logger.error('Cannot notify owner that its video %s has been published after scheduled update.', video.url, { err }));
    }
    notifyOnVideoPublishedAfterRemovedFromAutoBlacklist(video) {
        if (video.ScheduleVideoUpdate || (video.waitTranscoding && video.state !== videos_1.VideoState.PUBLISHED))
            return;
        this.notifyOwnedVideoHasBeenPublished(video)
            .catch(err => {
            logger_1.logger.error('Cannot notify owner that its video %s has been published after removed from auto-blacklist.', video.url, { err });
        });
    }
    notifyOnNewComment(comment) {
        this.notifyVideoOwnerOfNewComment(comment)
            .catch(err => logger_1.logger.error('Cannot notify video owner of new comment %s.', comment.url, { err }));
        this.notifyOfCommentMention(comment)
            .catch(err => logger_1.logger.error('Cannot notify mentions of comment %s.', comment.url, { err }));
    }
    notifyOnNewVideoAbuse(parameters) {
        this.notifyModeratorsOfNewVideoAbuse(parameters)
            .catch(err => logger_1.logger.error('Cannot notify of new video abuse of video %s.', parameters.videoAbuseInstance.Video.url, { err }));
    }
    notifyOnVideoAutoBlacklist(videoBlacklist) {
        this.notifyModeratorsOfVideoAutoBlacklist(videoBlacklist)
            .catch(err => logger_1.logger.error('Cannot notify of auto-blacklist of video %s.', videoBlacklist.Video.url, { err }));
    }
    notifyOnVideoBlacklist(videoBlacklist) {
        this.notifyVideoOwnerOfBlacklist(videoBlacklist)
            .catch(err => logger_1.logger.error('Cannot notify video owner of new video blacklist of %s.', videoBlacklist.Video.url, { err }));
    }
    notifyOnVideoUnblacklist(video) {
        this.notifyVideoOwnerOfUnblacklist(video)
            .catch(err => logger_1.logger.error('Cannot notify video owner of unblacklist of %s.', video.url, { err }));
    }
    notifyOnFinishedVideoImport(videoImport, success) {
        this.notifyOwnerVideoImportIsFinished(videoImport, success)
            .catch(err => logger_1.logger.error('Cannot notify owner that its video import %s is finished.', videoImport.getTargetIdentifier(), { err }));
    }
    notifyOnNewUserRegistration(user) {
        this.notifyModeratorsOfNewUserRegistration(user)
            .catch(err => logger_1.logger.error('Cannot notify moderators of new user registration (%s).', user.username, { err }));
    }
    notifyOfNewUserFollow(actorFollow) {
        this.notifyUserOfNewActorFollow(actorFollow)
            .catch(err => {
            logger_1.logger.error('Cannot notify owner of channel %s of a new follow by %s.', actorFollow.ActorFollowing.VideoChannel.getDisplayName(), actorFollow.ActorFollower.Account.getDisplayName(), { err });
        });
    }
    notifyOfNewInstanceFollow(actorFollow) {
        this.notifyAdminsOfNewInstanceFollow(actorFollow)
            .catch(err => {
            logger_1.logger.error('Cannot notify administrators of new follower %s.', actorFollow.ActorFollower.url, { err });
        });
    }
    notifyOfAutoInstanceFollowing(actorFollow) {
        this.notifyAdminsOfAutoInstanceFollowing(actorFollow)
            .catch(err => {
            logger_1.logger.error('Cannot notify administrators of auto instance following %s.', actorFollow.ActorFollowing.url, { err });
        });
    }
    notifySubscribersOfNewVideo(video) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const users = yield user_1.UserModel.listUserSubscribersOf(video.VideoChannel.actorId);
            logger_1.logger.info('Notifying %d users of new video %s.', users.length, video.url);
            function settingGetter(user) {
                return user.NotificationSetting.newVideoFromSubscription;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.NEW_VIDEO_FROM_SUBSCRIPTION,
                        userId: user.id,
                        videoId: video.id
                    });
                    notification.Video = video;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addNewVideoFromSubscriberNotification(emails, video);
            }
            return this.notify({ users, settingGetter, notificationCreator, emailSender });
        });
    }
    notifyVideoOwnerOfNewComment(comment) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (comment.Video.isOwned() === false)
                return;
            const user = yield user_1.UserModel.loadByVideoId(comment.videoId);
            if (!user || comment.Account.userId === user.id)
                return;
            if (yield this.isBlockedByServerOrUser(comment.Account, user))
                return;
            logger_1.logger.info('Notifying user %s of new comment %s.', user.username, comment.url);
            function settingGetter(user) {
                return user.NotificationSetting.newCommentOnMyVideo;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.NEW_COMMENT_ON_MY_VIDEO,
                        userId: user.id,
                        commentId: comment.id
                    });
                    notification.Comment = comment;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addNewCommentOnMyVideoNotification(emails, comment);
            }
            return this.notify({ users: [user], settingGetter, notificationCreator, emailSender });
        });
    }
    notifyOfCommentMention(comment) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const extractedUsernames = comment.extractMentions();
            logger_1.logger.debug('Extracted %d username from comment %s.', extractedUsernames.length, comment.url, { usernames: extractedUsernames, text: comment.text });
            let users = yield user_1.UserModel.listByUsernames(extractedUsernames);
            if (comment.Video.isOwned()) {
                const userException = yield user_1.UserModel.loadByVideoId(comment.videoId);
                users = users.filter(u => u.id !== userException.id);
            }
            users = users.filter(u => u.Account.id !== comment.accountId);
            if (users.length === 0)
                return;
            const serverAccountId = (yield application_1.getServerActor()).Account.id;
            const sourceAccounts = users.map(u => u.Account.id).concat([serverAccountId]);
            const accountMutedHash = yield account_blocklist_1.AccountBlocklistModel.isAccountMutedByMulti(sourceAccounts, comment.accountId);
            const instanceMutedHash = yield server_blocklist_1.ServerBlocklistModel.isServerMutedByMulti(sourceAccounts, comment.Account.Actor.serverId);
            logger_1.logger.info('Notifying %d users of new comment %s.', users.length, comment.url);
            function settingGetter(user) {
                const accountId = user.Account.id;
                if (accountMutedHash[accountId] === true || instanceMutedHash[accountId] === true ||
                    accountMutedHash[serverAccountId] === true || instanceMutedHash[serverAccountId] === true) {
                    return users_1.UserNotificationSettingValue.NONE;
                }
                return user.NotificationSetting.commentMention;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.COMMENT_MENTION,
                        userId: user.id,
                        commentId: comment.id
                    });
                    notification.Comment = comment;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addNewCommentMentionNotification(emails, comment);
            }
            return this.notify({ users, settingGetter, notificationCreator, emailSender });
        });
    }
    notifyUserOfNewActorFollow(actorFollow) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (actorFollow.ActorFollowing.isOwned() === false)
                return;
            let followType = 'channel';
            let user = yield user_1.UserModel.loadByChannelActorId(actorFollow.ActorFollowing.id);
            if (!user) {
                user = yield user_1.UserModel.loadByAccountActorId(actorFollow.ActorFollowing.id);
                followType = 'account';
            }
            if (!user)
                return;
            const followerAccount = actorFollow.ActorFollower.Account;
            const followerAccountWithActor = Object.assign(followerAccount, { Actor: actorFollow.ActorFollower });
            if (yield this.isBlockedByServerOrUser(followerAccountWithActor, user))
                return;
            logger_1.logger.info('Notifying user %s of new follower: %s.', user.username, followerAccount.getDisplayName());
            function settingGetter(user) {
                return user.NotificationSetting.newFollow;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.NEW_FOLLOW,
                        userId: user.id,
                        actorFollowId: actorFollow.id
                    });
                    notification.ActorFollow = actorFollow;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addNewFollowNotification(emails, actorFollow, followType);
            }
            return this.notify({ users: [user], settingGetter, notificationCreator, emailSender });
        });
    }
    notifyAdminsOfNewInstanceFollow(actorFollow) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const admins = yield user_1.UserModel.listWithRight(users_1.UserRight.MANAGE_SERVER_FOLLOW);
            const follower = Object.assign(actorFollow.ActorFollower.Account, { Actor: actorFollow.ActorFollower });
            if (yield this.isBlockedByServerOrUser(follower))
                return;
            logger_1.logger.info('Notifying %d administrators of new instance follower: %s.', admins.length, actorFollow.ActorFollower.url);
            function settingGetter(user) {
                return user.NotificationSetting.newInstanceFollower;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.NEW_INSTANCE_FOLLOWER,
                        userId: user.id,
                        actorFollowId: actorFollow.id
                    });
                    notification.ActorFollow = actorFollow;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addNewInstanceFollowerNotification(emails, actorFollow);
            }
            return this.notify({ users: admins, settingGetter, notificationCreator, emailSender });
        });
    }
    notifyAdminsOfAutoInstanceFollowing(actorFollow) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const admins = yield user_1.UserModel.listWithRight(users_1.UserRight.MANAGE_SERVER_FOLLOW);
            logger_1.logger.info('Notifying %d administrators of auto instance following: %s.', admins.length, actorFollow.ActorFollowing.url);
            function settingGetter(user) {
                return user.NotificationSetting.autoInstanceFollowing;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.AUTO_INSTANCE_FOLLOWING,
                        userId: user.id,
                        actorFollowId: actorFollow.id
                    });
                    notification.ActorFollow = actorFollow;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addAutoInstanceFollowingNotification(emails, actorFollow);
            }
            return this.notify({ users: admins, settingGetter, notificationCreator, emailSender });
        });
    }
    notifyModeratorsOfNewVideoAbuse(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const moderators = yield user_1.UserModel.listWithRight(users_1.UserRight.MANAGE_VIDEO_ABUSES);
            if (moderators.length === 0)
                return;
            logger_1.logger.info('Notifying %s user/moderators of new video abuse %s.', moderators.length, parameters.videoAbuseInstance.Video.url);
            function settingGetter(user) {
                return user.NotificationSetting.videoAbuseAsModerator;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.NEW_VIDEO_ABUSE_FOR_MODERATORS,
                        userId: user.id,
                        videoAbuseId: parameters.videoAbuse.id
                    });
                    notification.VideoAbuse = parameters.videoAbuseInstance;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addVideoAbuseModeratorsNotification(emails, parameters);
            }
            return this.notify({ users: moderators, settingGetter, notificationCreator, emailSender });
        });
    }
    notifyModeratorsOfVideoAutoBlacklist(videoBlacklist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const moderators = yield user_1.UserModel.listWithRight(users_1.UserRight.MANAGE_VIDEO_BLACKLIST);
            if (moderators.length === 0)
                return;
            logger_1.logger.info('Notifying %s moderators of video auto-blacklist %s.', moderators.length, videoBlacklist.Video.url);
            function settingGetter(user) {
                return user.NotificationSetting.videoAutoBlacklistAsModerator;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.VIDEO_AUTO_BLACKLIST_FOR_MODERATORS,
                        userId: user.id,
                        videoBlacklistId: videoBlacklist.id
                    });
                    notification.VideoBlacklist = videoBlacklist;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addVideoAutoBlacklistModeratorsNotification(emails, videoBlacklist);
            }
            return this.notify({ users: moderators, settingGetter, notificationCreator, emailSender });
        });
    }
    notifyVideoOwnerOfBlacklist(videoBlacklist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const user = yield user_1.UserModel.loadByVideoId(videoBlacklist.videoId);
            if (!user)
                return;
            logger_1.logger.info('Notifying user %s that its video %s has been blacklisted.', user.username, videoBlacklist.Video.url);
            function settingGetter(user) {
                return user.NotificationSetting.blacklistOnMyVideo;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.BLACKLIST_ON_MY_VIDEO,
                        userId: user.id,
                        videoBlacklistId: videoBlacklist.id
                    });
                    notification.VideoBlacklist = videoBlacklist;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addVideoBlacklistNotification(emails, videoBlacklist);
            }
            return this.notify({ users: [user], settingGetter, notificationCreator, emailSender });
        });
    }
    notifyVideoOwnerOfUnblacklist(video) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const user = yield user_1.UserModel.loadByVideoId(video.id);
            if (!user)
                return;
            logger_1.logger.info('Notifying user %s that its video %s has been unblacklisted.', user.username, video.url);
            function settingGetter(user) {
                return user.NotificationSetting.blacklistOnMyVideo;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.UNBLACKLIST_ON_MY_VIDEO,
                        userId: user.id,
                        videoId: video.id
                    });
                    notification.Video = video;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addVideoUnblacklistNotification(emails, video);
            }
            return this.notify({ users: [user], settingGetter, notificationCreator, emailSender });
        });
    }
    notifyOwnedVideoHasBeenPublished(video) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const user = yield user_1.UserModel.loadByVideoId(video.id);
            if (!user)
                return;
            logger_1.logger.info('Notifying user %s of the publication of its video %s.', user.username, video.url);
            function settingGetter(user) {
                return user.NotificationSetting.myVideoPublished;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.MY_VIDEO_PUBLISHED,
                        userId: user.id,
                        videoId: video.id
                    });
                    notification.Video = video;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.myVideoPublishedNotification(emails, video);
            }
            return this.notify({ users: [user], settingGetter, notificationCreator, emailSender });
        });
    }
    notifyOwnerVideoImportIsFinished(videoImport, success) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const user = yield user_1.UserModel.loadByVideoImportId(videoImport.id);
            if (!user)
                return;
            logger_1.logger.info('Notifying user %s its video import %s is finished.', user.username, videoImport.getTargetIdentifier());
            function settingGetter(user) {
                return user.NotificationSetting.myVideoImportFinished;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: success ? users_1.UserNotificationType.MY_VIDEO_IMPORT_SUCCESS : users_1.UserNotificationType.MY_VIDEO_IMPORT_ERROR,
                        userId: user.id,
                        videoImportId: videoImport.id
                    });
                    notification.VideoImport = videoImport;
                    return notification;
                });
            }
            function emailSender(emails) {
                return success
                    ? emailer_1.Emailer.Instance.myVideoImportSuccessNotification(emails, videoImport)
                    : emailer_1.Emailer.Instance.myVideoImportErrorNotification(emails, videoImport);
            }
            return this.notify({ users: [user], settingGetter, notificationCreator, emailSender });
        });
    }
    notifyModeratorsOfNewUserRegistration(registeredUser) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const moderators = yield user_1.UserModel.listWithRight(users_1.UserRight.MANAGE_USERS);
            if (moderators.length === 0)
                return;
            logger_1.logger.info('Notifying %s moderators of new user registration of %s.', moderators.length, registeredUser.username);
            function settingGetter(user) {
                return user.NotificationSetting.newUserRegistration;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.NEW_USER_REGISTRATION,
                        userId: user.id,
                        accountId: registeredUser.Account.id
                    });
                    notification.Account = registeredUser.Account;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addNewUserRegistrationNotification(emails, registeredUser);
            }
            return this.notify({ users: moderators, settingGetter, notificationCreator, emailSender });
        });
    }
    notify(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const emails = [];
            for (const user of options.users) {
                if (this.isWebNotificationEnabled(options.settingGetter(user))) {
                    const notification = yield options.notificationCreator(user);
                    peertube_socket_1.PeerTubeSocket.Instance.sendNotification(user.id, notification);
                }
                if (this.isEmailEnabled(user, options.settingGetter(user))) {
                    emails.push(user.email);
                }
            }
            if (emails.length !== 0) {
                options.emailSender(emails);
            }
        });
    }
    isEmailEnabled(user, value) {
        if (config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION === true && user.emailVerified === false)
            return false;
        return value & users_1.UserNotificationSettingValue.EMAIL;
    }
    isWebNotificationEnabled(value) {
        return value & users_1.UserNotificationSettingValue.WEB;
    }
    isBlockedByServerOrUser(targetAccount, user) {
        return blocklist_1.isBlockedByServerOrAccount(targetAccount, user === null || user === void 0 ? void 0 : user.Account);
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.Notifier = Notifier;
