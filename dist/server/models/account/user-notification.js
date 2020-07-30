"use strict";
var UserNotificationModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotificationModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const shared_1 = require("../../../shared");
const utils_1 = require("../utils");
const misc_1 = require("../../helpers/custom-validators/misc");
const user_notifications_1 = require("../../helpers/custom-validators/user-notifications");
const user_1 = require("./user");
const video_1 = require("../video/video");
const video_comment_1 = require("../video/video-comment");
const sequelize_1 = require("sequelize");
const video_channel_1 = require("../video/video-channel");
const account_1 = require("./account");
const video_abuse_1 = require("../video/video-abuse");
const video_blacklist_1 = require("../video/video-blacklist");
const video_import_1 = require("../video/video-import");
const actor_1 = require("../activitypub/actor");
const actor_follow_1 = require("../activitypub/actor-follow");
const avatar_1 = require("../avatar/avatar");
const server_1 = require("../server/server");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_ALL"] = "WITH_ALL";
})(ScopeNames || (ScopeNames = {}));
function buildActorWithAvatarInclude() {
    return {
        attributes: ['preferredUsername'],
        model: actor_1.ActorModel.unscoped(),
        required: true,
        include: [
            {
                attributes: ['filename'],
                model: avatar_1.AvatarModel.unscoped(),
                required: false
            },
            {
                attributes: ['host'],
                model: server_1.ServerModel.unscoped(),
                required: false
            }
        ]
    };
}
function buildVideoInclude(required) {
    return {
        attributes: ['id', 'uuid', 'name'],
        model: video_1.VideoModel.unscoped(),
        required
    };
}
function buildChannelInclude(required, withActor = false) {
    return {
        required,
        attributes: ['id', 'name'],
        model: video_channel_1.VideoChannelModel.unscoped(),
        include: withActor === true ? [buildActorWithAvatarInclude()] : []
    };
}
function buildAccountInclude(required, withActor = false) {
    return {
        required,
        attributes: ['id', 'name'],
        model: account_1.AccountModel.unscoped(),
        include: withActor === true ? [buildActorWithAvatarInclude()] : []
    };
}
let UserNotificationModel = UserNotificationModel_1 = class UserNotificationModel extends sequelize_typescript_1.Model {
    static listForApi(userId, start, count, sort, unread) {
        const where = { userId };
        const query = {
            offset: start,
            limit: count,
            order: utils_1.getSort(sort),
            where
        };
        if (unread !== undefined)
            query.where['read'] = !unread;
        return Promise.all([
            UserNotificationModel_1.count({ where })
                .then(count => count || 0),
            count === 0
                ? []
                : UserNotificationModel_1.scope(ScopeNames.WITH_ALL).findAll(query)
        ]).then(([total, data]) => ({ total, data }));
    }
    static markAsRead(userId, notificationIds) {
        const query = {
            where: {
                userId,
                id: {
                    [sequelize_1.Op.in]: notificationIds
                }
            }
        };
        return UserNotificationModel_1.update({ read: true }, query);
    }
    static markAllAsRead(userId) {
        const query = { where: { userId } };
        return UserNotificationModel_1.update({ read: true }, query);
    }
    toFormattedJSON() {
        const video = this.Video
            ? Object.assign(this.formatVideo(this.Video), { channel: this.formatActor(this.Video.VideoChannel) })
            : undefined;
        const videoImport = this.VideoImport ? {
            id: this.VideoImport.id,
            video: this.VideoImport.Video ? this.formatVideo(this.VideoImport.Video) : undefined,
            torrentName: this.VideoImport.torrentName,
            magnetUri: this.VideoImport.magnetUri,
            targetUrl: this.VideoImport.targetUrl
        } : undefined;
        const comment = this.Comment ? {
            id: this.Comment.id,
            threadId: this.Comment.getThreadId(),
            account: this.formatActor(this.Comment.Account),
            video: this.formatVideo(this.Comment.Video)
        } : undefined;
        const videoAbuse = this.VideoAbuse ? {
            id: this.VideoAbuse.id,
            video: this.formatVideo(this.VideoAbuse.Video)
        } : undefined;
        const videoBlacklist = this.VideoBlacklist ? {
            id: this.VideoBlacklist.id,
            video: this.formatVideo(this.VideoBlacklist.Video)
        } : undefined;
        const account = this.Account ? this.formatActor(this.Account) : undefined;
        const actorFollowingType = {
            Application: 'instance',
            Group: 'channel',
            Person: 'account'
        };
        const actorFollow = this.ActorFollow ? {
            id: this.ActorFollow.id,
            state: this.ActorFollow.state,
            follower: {
                id: this.ActorFollow.ActorFollower.Account.id,
                displayName: this.ActorFollow.ActorFollower.Account.getDisplayName(),
                name: this.ActorFollow.ActorFollower.preferredUsername,
                avatar: this.ActorFollow.ActorFollower.Avatar ? { path: this.ActorFollow.ActorFollower.Avatar.getStaticPath() } : undefined,
                host: this.ActorFollow.ActorFollower.getHost()
            },
            following: {
                type: actorFollowingType[this.ActorFollow.ActorFollowing.type],
                displayName: (this.ActorFollow.ActorFollowing.VideoChannel || this.ActorFollow.ActorFollowing.Account).getDisplayName(),
                name: this.ActorFollow.ActorFollowing.preferredUsername,
                host: this.ActorFollow.ActorFollowing.getHost()
            }
        } : undefined;
        return {
            id: this.id,
            type: this.type,
            read: this.read,
            video,
            videoImport,
            comment,
            videoAbuse,
            videoBlacklist,
            account,
            actorFollow,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }
    formatVideo(video) {
        return {
            id: video.id,
            uuid: video.uuid,
            name: video.name
        };
    }
    formatActor(accountOrChannel) {
        const avatar = accountOrChannel.Actor.Avatar
            ? { path: accountOrChannel.Actor.Avatar.getStaticPath() }
            : undefined;
        return {
            id: accountOrChannel.id,
            displayName: accountOrChannel.getDisplayName(),
            name: accountOrChannel.Actor.preferredUsername,
            host: accountOrChannel.Actor.getHost(),
            avatar
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserNotificationType', value => utils_1.throwIfNotValid(value, user_notifications_1.isUserNotificationTypeValid, 'type')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "type", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Is('UserNotificationRead', value => utils_1.throwIfNotValid(value, misc_1.isBooleanValid, 'read')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], UserNotificationModel.prototype, "read", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], UserNotificationModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], UserNotificationModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "userId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", user_1.UserModel)
], UserNotificationModel.prototype, "User", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], UserNotificationModel.prototype, "Video", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_comment_1.VideoCommentModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "commentId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_comment_1.VideoCommentModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_comment_1.VideoCommentModel)
], UserNotificationModel.prototype, "Comment", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_abuse_1.VideoAbuseModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "videoAbuseId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_abuse_1.VideoAbuseModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_abuse_1.VideoAbuseModel)
], UserNotificationModel.prototype, "VideoAbuse", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_blacklist_1.VideoBlacklistModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "videoBlacklistId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_blacklist_1.VideoBlacklistModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_blacklist_1.VideoBlacklistModel)
], UserNotificationModel.prototype, "VideoBlacklist", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_import_1.VideoImportModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "videoImportId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_import_1.VideoImportModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_import_1.VideoImportModel)
], UserNotificationModel.prototype, "VideoImport", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "accountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], UserNotificationModel.prototype, "Account", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => actor_follow_1.ActorFollowModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], UserNotificationModel.prototype, "actorFollowId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => actor_follow_1.ActorFollowModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", actor_follow_1.ActorFollowModel)
], UserNotificationModel.prototype, "ActorFollow", void 0);
UserNotificationModel = UserNotificationModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_ALL]: {
            include: [
                Object.assign(buildVideoInclude(false), {
                    include: [buildChannelInclude(true, true)]
                }),
                {
                    attributes: ['id', 'originCommentId'],
                    model: video_comment_1.VideoCommentModel.unscoped(),
                    required: false,
                    include: [
                        buildAccountInclude(true, true),
                        buildVideoInclude(true)
                    ]
                },
                {
                    attributes: ['id'],
                    model: video_abuse_1.VideoAbuseModel.unscoped(),
                    required: false,
                    include: [buildVideoInclude(true)]
                },
                {
                    attributes: ['id'],
                    model: video_blacklist_1.VideoBlacklistModel.unscoped(),
                    required: false,
                    include: [buildVideoInclude(true)]
                },
                {
                    attributes: ['id', 'magnetUri', 'targetUrl', 'torrentName'],
                    model: video_import_1.VideoImportModel.unscoped(),
                    required: false,
                    include: [buildVideoInclude(false)]
                },
                {
                    attributes: ['id', 'state'],
                    model: actor_follow_1.ActorFollowModel.unscoped(),
                    required: false,
                    include: [
                        {
                            attributes: ['preferredUsername'],
                            model: actor_1.ActorModel.unscoped(),
                            required: true,
                            as: 'ActorFollower',
                            include: [
                                {
                                    attributes: ['id', 'name'],
                                    model: account_1.AccountModel.unscoped(),
                                    required: true
                                },
                                {
                                    attributes: ['filename'],
                                    model: avatar_1.AvatarModel.unscoped(),
                                    required: false
                                },
                                {
                                    attributes: ['host'],
                                    model: server_1.ServerModel.unscoped(),
                                    required: false
                                }
                            ]
                        },
                        {
                            attributes: ['preferredUsername', 'type'],
                            model: actor_1.ActorModel.unscoped(),
                            required: true,
                            as: 'ActorFollowing',
                            include: [
                                buildChannelInclude(false),
                                buildAccountInclude(false),
                                {
                                    attributes: ['host'],
                                    model: server_1.ServerModel.unscoped(),
                                    required: false
                                }
                            ]
                        }
                    ]
                },
                buildAccountInclude(false, true)
            ]
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'userNotification',
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['videoId'],
                where: {
                    videoId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['commentId'],
                where: {
                    commentId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['videoAbuseId'],
                where: {
                    videoAbuseId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['videoBlacklistId'],
                where: {
                    videoBlacklistId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['videoImportId'],
                where: {
                    videoImportId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['accountId'],
                where: {
                    accountId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['actorFollowId'],
                where: {
                    actorFollowId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            }
        ]
    })
], UserNotificationModel);
exports.UserNotificationModel = UserNotificationModel;
