"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifier = void 0;
const tslib_1 = require("tslib");
const account_1 = require("@server/models/account/account");
const application_1 = require("@server/models/application/application");
const server_blocklist_1 = require("@server/models/server/server-blocklist");
const users_1 = require("../../shared/models/users");
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
        if (video.privacy !== 1 || video.state !== 1 || video.isBlacklisted())
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
        if (video.VideoBlacklist || (video.waitTranscoding && video.state !== 1))
            return;
        this.notifyOwnedVideoHasBeenPublished(video)
            .catch(err => logger_1.logger.error('Cannot notify owner that its video %s has been published after scheduled update.', video.url, { err }));
    }
    notifyOnVideoPublishedAfterRemovedFromAutoBlacklist(video) {
        if (video.ScheduleVideoUpdate || (video.waitTranscoding && video.state !== 1))
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
    notifyOnNewAbuse(parameters) {
        this.notifyModeratorsOfNewAbuse(parameters)
            .catch(err => logger_1.logger.error('Cannot notify of new abuse %d.', parameters.abuseInstance.id, { err }));
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
    notifyOnAbuseStateChange(abuse) {
        this.notifyReporterOfAbuseStateChange(abuse)
            .catch(err => {
            logger_1.logger.error('Cannot notify reporter of abuse %d state change.', abuse.id, { err });
        });
    }
    notifyOnAbuseMessage(abuse, message) {
        this.notifyOfNewAbuseMessage(abuse, message)
            .catch(err => {
            logger_1.logger.error('Cannot notify on new abuse %d message.', abuse.id, { err });
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
                    return 0;
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
            const admins = yield user_1.UserModel.listWithRight(2);
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
            const admins = yield user_1.UserModel.listWithRight(2);
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
    notifyModeratorsOfNewAbuse(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { abuse, abuseInstance } = parameters;
            const moderators = yield user_1.UserModel.listWithRight(6);
            if (moderators.length === 0)
                return;
            const url = this.getAbuseUrl(abuseInstance);
            logger_1.logger.info('Notifying %s user/moderators of new abuse %s.', moderators.length, url);
            function settingGetter(user) {
                return user.NotificationSetting.abuseAsModerator;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.NEW_ABUSE_FOR_MODERATORS,
                        userId: user.id,
                        abuseId: abuse.id
                    });
                    notification.Abuse = abuseInstance;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addAbuseModeratorsNotification(emails, parameters);
            }
            return this.notify({ users: moderators, settingGetter, notificationCreator, emailSender });
        });
    }
    notifyReporterOfAbuseStateChange(abuse) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (abuse.ReporterAccount.isOwned() !== true)
                return;
            const url = this.getAbuseUrl(abuse);
            logger_1.logger.info('Notifying reporter of abuse % of state change.', url);
            const reporter = yield user_1.UserModel.loadByAccountActorId(abuse.ReporterAccount.actorId);
            function settingGetter(user) {
                return user.NotificationSetting.abuseStateChange;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.ABUSE_STATE_CHANGE,
                        userId: user.id,
                        abuseId: abuse.id
                    });
                    notification.Abuse = abuse;
                    return notification;
                });
            }
            function emailSender(emails) {
                return emailer_1.Emailer.Instance.addAbuseStateChangeNotification(emails, abuse);
            }
            return this.notify({ users: [reporter], settingGetter, notificationCreator, emailSender });
        });
    }
    notifyOfNewAbuseMessage(abuse, message) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const url = this.getAbuseUrl(abuse);
            logger_1.logger.info('Notifying reporter and moderators of new abuse message on %s.', url);
            const accountMessage = yield account_1.AccountModel.load(message.accountId);
            function settingGetter(user) {
                return user.NotificationSetting.abuseNewMessage;
            }
            function notificationCreator(user) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const notification = yield user_notification_1.UserNotificationModel.create({
                        type: users_1.UserNotificationType.ABUSE_NEW_MESSAGE,
                        userId: user.id,
                        abuseId: abuse.id
                    });
                    notification.Abuse = abuse;
                    return notification;
                });
            }
            function emailSenderReporter(emails) {
                return emailer_1.Emailer.Instance.addAbuseNewMessageNotification(emails, { target: 'reporter', abuse, message, accountMessage });
            }
            function emailSenderModerators(emails) {
                return emailer_1.Emailer.Instance.addAbuseNewMessageNotification(emails, { target: 'moderator', abuse, message, accountMessage });
            }
            function buildReporterOptions() {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (abuse.ReporterAccount.isOwned() !== true)
                        return;
                    const reporter = yield user_1.UserModel.loadByAccountActorId(abuse.ReporterAccount.actorId);
                    if (reporter.Account.id === message.accountId)
                        return;
                    return { users: [reporter], settingGetter, notificationCreator, emailSender: emailSenderReporter };
                });
            }
            function buildModeratorsOptions() {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    let moderators = yield user_1.UserModel.listWithRight(6);
                    moderators = moderators.filter(m => m.Account.id !== message.accountId);
                    if (moderators.length === 0)
                        return;
                    return { users: moderators, settingGetter, notificationCreator, emailSender: emailSenderModerators };
                });
            }
            const [reporterOptions, moderatorsOptions] = yield Promise.all([
                buildReporterOptions(),
                buildModeratorsOptions()
            ]);
            return Promise.all([
                this.notify(reporterOptions),
                this.notify(moderatorsOptions)
            ]);
        });
    }
    notifyModeratorsOfVideoAutoBlacklist(videoBlacklist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const moderators = yield user_1.UserModel.listWithRight(11);
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
            const moderators = yield user_1.UserModel.listWithRight(1);
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
        return value & 2;
    }
    isWebNotificationEnabled(value) {
        return value & 1;
    }
    isBlockedByServerOrUser(targetAccount, user) {
        return blocklist_1.isBlockedByServerOrAccount(targetAccount, user === null || user === void 0 ? void 0 : user.Account);
    }
    getAbuseUrl(abuse) {
        var _a, _b, _c, _d;
        return ((_b = (_a = abuse.VideoAbuse) === null || _a === void 0 ? void 0 : _a.Video) === null || _b === void 0 ? void 0 : _b.url) || ((_d = (_c = abuse.VideoCommentAbuse) === null || _c === void 0 ? void 0 : _c.VideoComment) === null || _d === void 0 ? void 0 : _d.url) ||
            abuse.FlaggedAccount.Actor.url;
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.Notifier = Notifier;
