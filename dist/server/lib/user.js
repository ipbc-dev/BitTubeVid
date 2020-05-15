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
const uuidv4 = require("uuid/v4");
const constants_1 = require("../initializers/constants");
const account_1 = require("../models/account/account");
const activitypub_1 = require("./activitypub");
const video_channel_1 = require("./video-channel");
const actor_1 = require("../models/activitypub/actor");
const user_notification_setting_1 = require("../models/account/user-notification-setting");
const users_1 = require("../../shared/models/users");
const video_playlist_1 = require("./video-playlist");
const database_1 = require("../initializers/database");
const redis_1 = require("./redis");
const emailer_1 = require("./emailer");
function createUserAccountAndChannelAndPlaylist(parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userToCreate, userDisplayName, channelNames, validateUser = true } = parameters;
        const { user, account, videoChannel } = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
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
            activitypub_1.setAsyncActorKeys(account.Actor),
            activitypub_1.setAsyncActorKeys(videoChannel.Actor)
        ]);
        account.Actor = accountActorWithKeys;
        videoChannel.Actor = channelActorWithKeys;
        return { user, account, videoChannel };
    });
}
exports.createUserAccountAndChannelAndPlaylist = createUserAccountAndChannelAndPlaylist;
function createLocalAccountWithoutKeys(parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, displayName, userId, applicationId, t, type = 'Person' } = parameters;
        const url = activitypub_1.getAccountActivityPubUrl(name);
        const actorInstance = activitypub_1.buildActorInstance(type, url, name);
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
    return __awaiter(this, void 0, void 0, function* () {
        const accountCreated = yield createLocalAccountWithoutKeys({
            name: constants_1.SERVER_ACTOR_NAME,
            userId: null,
            applicationId: applicationId,
            t: undefined,
            type: 'Application'
        });
        accountCreated.Actor = yield activitypub_1.setAsyncActorKeys(accountCreated.Actor);
        return accountCreated;
    });
}
exports.createApplicationActor = createApplicationActor;
function sendVerifyUserEmail(user, isPendingEmail = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const verificationString = yield redis_1.Redis.Instance.setVerifyEmailVerificationString(user.id);
        let url = constants_1.WEBSERVER.URL + '/verify-account/email?userId=' + user.id + '&verificationString=' + verificationString;
        if (isPendingEmail)
            url += '&isPendingEmail=true';
        const email = isPendingEmail ? user.pendingEmail : user.email;
        yield emailer_1.Emailer.Instance.addVerifyEmailJob(email, url);
    });
}
exports.sendVerifyUserEmail = sendVerifyUserEmail;
function createDefaultUserNotificationSettings(user, t) {
    const values = {
        userId: user.id,
        newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB,
        newCommentOnMyVideo: users_1.UserNotificationSettingValue.WEB,
        myVideoImportFinished: users_1.UserNotificationSettingValue.WEB,
        myVideoPublished: users_1.UserNotificationSettingValue.WEB,
        videoAbuseAsModerator: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        videoAutoBlacklistAsModerator: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        blacklistOnMyVideo: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        newUserRegistration: users_1.UserNotificationSettingValue.WEB,
        commentMention: users_1.UserNotificationSettingValue.WEB,
        newFollow: users_1.UserNotificationSettingValue.WEB,
        newInstanceFollower: users_1.UserNotificationSettingValue.WEB,
        autoInstanceFollowing: users_1.UserNotificationSettingValue.WEB
    };
    return user_notification_setting_1.UserNotificationSettingModel.create(values, { transaction: t });
}
function buildChannelAttributes(user, channelNames) {
    return __awaiter(this, void 0, void 0, function* () {
        if (channelNames)
            return channelNames;
        let channelName = user.username + '_channel';
        const actor = yield actor_1.ActorModel.loadLocalByName(channelName);
        if (actor)
            channelName = uuidv4();
        const videoChannelDisplayName = `Main ${user.username} channel`;
        return {
            name: channelName,
            displayName: videoChannelDisplayName
        };
    });
}
