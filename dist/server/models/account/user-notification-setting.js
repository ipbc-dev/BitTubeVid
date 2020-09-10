"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotificationSettingModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const user_notifications_1 = require("../../helpers/custom-validators/user-notifications");
const oauth_model_1 = require("../../lib/oauth-model");
const utils_1 = require("../utils");
const user_1 = require("./user");
let UserNotificationSettingModel = class UserNotificationSettingModel extends sequelize_typescript_1.Model {
    static removeTokenCache(instance) {
        return oauth_model_1.clearCacheByUserId(instance.userId);
    }
    toFormattedJSON() {
        return {
            newCommentOnMyVideo: this.newCommentOnMyVideo,
            newVideoFromSubscription: this.newVideoFromSubscription,
            abuseAsModerator: this.abuseAsModerator,
            videoAutoBlacklistAsModerator: this.videoAutoBlacklistAsModerator,
            blacklistOnMyVideo: this.blacklistOnMyVideo,
            myVideoPublished: this.myVideoPublished,
            myVideoImportFinished: this.myVideoImportFinished,
            newUserRegistration: this.newUserRegistration,
            commentMention: this.commentMention,
            newFollow: this.newFollow,
            newInstanceFollower: this.newInstanceFollower,
            autoInstanceFollowing: this.autoInstanceFollowing,
            abuseNewMessage: this.abuseNewMessage,
            abuseStateChange: this.abuseStateChange
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewVideoFromSubscription', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newVideoFromSubscription')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newVideoFromSubscription", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewCommentOnMyVideo', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newCommentOnMyVideo')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newCommentOnMyVideo", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingAbuseAsModerator', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'abuseAsModerator')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "abuseAsModerator", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingVideoAutoBlacklistAsModerator', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'videoAutoBlacklistAsModerator')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "videoAutoBlacklistAsModerator", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingBlacklistOnMyVideo', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'blacklistOnMyVideo')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "blacklistOnMyVideo", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingMyVideoPublished', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'myVideoPublished')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "myVideoPublished", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingMyVideoImportFinished', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'myVideoImportFinished')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "myVideoImportFinished", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewUserRegistration', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newUserRegistration')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newUserRegistration", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewInstanceFollower', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newInstanceFollower')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newInstanceFollower", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewInstanceFollower', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'autoInstanceFollowing')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "autoInstanceFollowing", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewFollow', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newFollow')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newFollow", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingCommentMention', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'commentMention')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "commentMention", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingAbuseStateChange', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'abuseStateChange')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "abuseStateChange", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingAbuseNewMessage', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'abuseNewMessage')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "abuseNewMessage", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "userId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", user_1.UserModel)
], UserNotificationSettingModel.prototype, "User", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], UserNotificationSettingModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], UserNotificationSettingModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AfterUpdate,
    sequelize_typescript_1.AfterDestroy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [UserNotificationSettingModel]),
    tslib_1.__metadata("design:returntype", void 0)
], UserNotificationSettingModel, "removeTokenCache", null);
UserNotificationSettingModel = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'userNotificationSetting',
        indexes: [
            {
                fields: ['userId'],
                unique: true
            }
        ]
    })
], UserNotificationSettingModel);
exports.UserNotificationSettingModel = UserNotificationSettingModel;
