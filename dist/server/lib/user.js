"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAbleToUploadVideo = exports.sendVerifyUserEmail = exports.createLocalAccountWithoutKeys = exports.createUserAccountAndChannelAndPlaylist = exports.createApplicationActor = exports.getOriginalVideoFileTotalDailyFromUser = exports.getOriginalVideoFileTotalFromUser = void 0;
const tslib_1 = require("tslib");
const uuid_1 = require("uuid");
const user_1 = require("@server/models/account/user");
const constants_1 = require("../initializers/constants");
const database_1 = require("../initializers/database");
const account_1 = require("../models/account/account");
const user_notification_setting_1 = require("../models/account/user-notification-setting");
const actor_1 = require("../models/activitypub/actor");
const actor_2 = require("./activitypub/actor");
const url_1 = require("./activitypub/url");
const emailer_1 = require("./emailer");
const live_manager_1 = require("./live-manager");
const redis_1 = require("./redis");
const video_channel_1 = require("./video-channel");
const video_playlist_1 = require("./video-playlist");
function createUserAccountAndChannelAndPlaylist(parameters) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { userToCreate, userDisplayName, channelNames, validateUser = true } = parameters;
        const { user, account, videoChannel } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const userOptions = {
                transaction: t,
                validate: validateUser
            };
            const userCreated = yield userToCreate.save(userOptions);
            userCreated.NotificationSetting = yield createDefaultUserNotificationSettings(userCreated, t);
            const accountCreated = yield createLocalAccountWithoutKeys({
                name: userCreated.username,
                displayName: userDisplayName,
                userId: userCreated.id,
                applicationId: null,
                t: t
            });
            userCreated.Account = accountCreated;
            const channelAttributes = yield buildChannelAttributes(userCreated, channelNames);
            const videoChannel = yield video_channel_1.createLocalVideoChannel(channelAttributes, accountCreated, t);
            const videoPlaylist = yield video_playlist_1.createWatchLaterPlaylist(accountCreated, t);
            return { user: userCreated, account: accountCreated, videoChannel, videoPlaylist };
        }));
        const [accountActorWithKeys, channelActorWithKeys] = yield Promise.all([
            actor_2.generateAndSaveActorKeys(account.Actor),
            actor_2.generateAndSaveActorKeys(videoChannel.Actor)
        ]);
        account.Actor = accountActorWithKeys;
        videoChannel.Actor = channelActorWithKeys;
        return { user, account, videoChannel };
    });
}
exports.createUserAccountAndChannelAndPlaylist = createUserAccountAndChannelAndPlaylist;
function createLocalAccountWithoutKeys(parameters) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { name, displayName, userId, applicationId, t, type = 'Person' } = parameters;
        const url = url_1.getLocalAccountActivityPubUrl(name);
        const actorInstance = actor_2.buildActorInstance(type, url, name);
        const actorInstanceCreated = yield actorInstance.save({ transaction: t });
        const accountInstance = new account_1.AccountModel({
            name: displayName || name,
            userId,
            applicationId,
            actorId: actorInstanceCreated.id
        });
        const accountInstanceCreated = yield accountInstance.save({ transaction: t });
        accountInstanceCreated.Actor = actorInstanceCreated;
        return accountInstanceCreated;
    });
}
exports.createLocalAccountWithoutKeys = createLocalAccountWithoutKeys;
function createApplicationActor(applicationId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const accountCreated = yield createLocalAccountWithoutKeys({
            name: constants_1.SERVER_ACTOR_NAME,
            userId: null,
            applicationId: applicationId,
            t: undefined,
            type: 'Application'
        });
        accountCreated.Actor = yield actor_2.generateAndSaveActorKeys(accountCreated.Actor);
        return accountCreated;
    });
}
exports.createApplicationActor = createApplicationActor;
function sendVerifyUserEmail(user, isPendingEmail = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const verificationString = yield redis_1.Redis.Instance.setVerifyEmailVerificationString(user.id);
        let url = constants_1.WEBSERVER.URL + '/verify-account/email?userId=' + user.id + '&verificationString=' + verificationString;
        if (isPendingEmail)
            url += '&isPendingEmail=true';
        const email = isPendingEmail ? user.pendingEmail : user.email;
        const username = user.username;
        yield emailer_1.Emailer.Instance.addVerifyEmailJob(username, email, url);
    });
}
exports.sendVerifyUserEmail = sendVerifyUserEmail;
function getOriginalVideoFileTotalFromUser(user) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const query = user_1.UserModel.generateUserQuotaBaseSQL({
            withSelect: true,
            whereUserId: '$userId'
        });
        const base = yield user_1.UserModel.getTotalRawQuery(query, user.id);
        return base + live_manager_1.LiveManager.Instance.getLiveQuotaUsedByUser(user.id);
    });
}
exports.getOriginalVideoFileTotalFromUser = getOriginalVideoFileTotalFromUser;
function getOriginalVideoFileTotalDailyFromUser(user) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const query = user_1.UserModel.generateUserQuotaBaseSQL({
            withSelect: true,
            whereUserId: '$userId',
            where: '"video"."createdAt" > now() - interval \'24 hours\''
        });
        const base = yield user_1.UserModel.getTotalRawQuery(query, user.id);
        return base + live_manager_1.LiveManager.Instance.getLiveQuotaUsedByUser(user.id);
    });
}
exports.getOriginalVideoFileTotalDailyFromUser = getOriginalVideoFileTotalDailyFromUser;
function isAbleToUploadVideo(userId, size) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = yield user_1.UserModel.loadById(userId);
        if (user.videoQuota === -1 && user.videoQuotaDaily === -1)
            return Promise.resolve(true);
        const [totalBytes, totalBytesDaily] = yield Promise.all([
            getOriginalVideoFileTotalFromUser(user),
            getOriginalVideoFileTotalDailyFromUser(user)
        ]);
        const uploadedTotal = size + totalBytes;
        const uploadedDaily = size + totalBytesDaily;
        if (user.videoQuotaDaily === -1)
            return uploadedTotal < user.videoQuota;
        if (user.videoQuota === -1)
            return uploadedDaily < user.videoQuotaDaily;
        return uploadedTotal < user.videoQuota && uploadedDaily < user.videoQuotaDaily;
    });
}
exports.isAbleToUploadVideo = isAbleToUploadVideo;
function createDefaultUserNotificationSettings(user, t) {
    const values = {
        userId: user.id,
        newVideoFromSubscription: 1,
        newCommentOnMyVideo: 1,
        myVideoImportFinished: 1,
        myVideoPublished: 1,
        abuseAsModerator: 1 | 2,
        videoAutoBlacklistAsModerator: 1 | 2,
        blacklistOnMyVideo: 1 | 2,
        newUserRegistration: 1,
        commentMention: 1,
        newFollow: 1,
        newInstanceFollower: 1,
        abuseNewMessage: 1 | 2,
        abuseStateChange: 1 | 2,
        autoInstanceFollowing: 1
    };
    return user_notification_setting_1.UserNotificationSettingModel.create(values, { transaction: t });
}
function buildChannelAttributes(user, channelNames) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (channelNames)
            return channelNames;
        let channelName = user.username + '_channel';
        const actor = yield actor_1.ActorModel.loadLocalByName(channelName);
        if (actor)
            channelName = uuid_1.v4();
        const videoChannelDisplayName = `Main ${user.username} channel`;
        return {
            name: channelName,
            displayName: videoChannelDisplayName
        };
    });
}
