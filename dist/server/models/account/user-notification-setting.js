"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const utils_1 = require("../utils");
const user_1 = require("./user");
const user_notifications_1 = require("../../helpers/custom-validators/user-notifications");
const user_notification_setting_model_1 = require("../../../shared/models/users/user-notification-setting.model");
const oauth_model_1 = require("../../lib/oauth-model");
let UserNotificationSettingModel = class UserNotificationSettingModel extends sequelize_typescript_1.Model {
    static removeTokenCache(instance) {
        return oauth_model_1.clearCacheByUserId(instance.userId);
    }
    toFormattedJSON() {
        return {
            newCommentOnMyVideo: this.newCommentOnMyVideo,
            newVideoFromSubscription: this.newVideoFromSubscription,
            videoAbuseAsModerator: this.videoAbuseAsModerator,
            videoAutoBlacklistAsModerator: this.videoAutoBlacklistAsModerator,
            blacklistOnMyVideo: this.blacklistOnMyVideo,
            myVideoPublished: this.myVideoPublished,
            myVideoImportFinished: this.myVideoImportFinished,
            newUserRegistration: this.newUserRegistration,
            commentMention: this.commentMention,
            newFollow: this.newFollow,
            newInstanceFollower: this.newInstanceFollower,
            autoInstanceFollowing: this.autoInstanceFollowing
        };
    }
};
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewVideoFromSubscription', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newVideoFromSubscription')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newVideoFromSubscription", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewCommentOnMyVideo', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newCommentOnMyVideo')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newCommentOnMyVideo", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingVideoAbuseAsModerator', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'videoAbuseAsModerator')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "videoAbuseAsModerator", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingVideoAutoBlacklistAsModerator', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'videoAutoBlacklistAsModerator')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "videoAutoBlacklistAsModerator", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingBlacklistOnMyVideo', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'blacklistOnMyVideo')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "blacklistOnMyVideo", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingMyVideoPublished', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'myVideoPublished')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "myVideoPublished", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingMyVideoImportFinished', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'myVideoImportFinished')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "myVideoImportFinished", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewUserRegistration', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newUserRegistration')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newUserRegistration", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewInstanceFollower', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newInstanceFollower')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newInstanceFollower", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewInstanceFollower', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'autoInstanceFollowing')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "autoInstanceFollowing", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingNewFollow', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'newFollow')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "newFollow", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationSettingCommentMention', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationSettingValid, 'commentMention')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "commentMention", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserNotificationSettingModel.prototype, "userId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", user_1.UserModel)
], UserNotificationSettingModel.prototype, "User", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], UserNotificationSettingModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], UserNotificationSettingModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AfterUpdate,
    sequelize_typescript_1.AfterDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserNotificationSettingModel]),
    __metadata("design:returntype", void 0)
], UserNotificationSettingModel, "removeTokenCache", null);
UserNotificationSettingModel = __decorate([
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
