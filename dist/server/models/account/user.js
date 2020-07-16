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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var UserModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const shared_1 = require("../../../shared");
const users_1 = require("../../helpers/custom-validators/users");
const peertube_crypto_1 = require("../../helpers/peertube-crypto");
const oauth_token_1 = require("../oauth/oauth-token");
const utils_1 = require("../utils");
const video_channel_1 = require("../video/video-channel");
const video_playlist_1 = require("../video/video-playlist");
const account_1 = require("./account");
const lodash_1 = require("lodash");
const constants_1 = require("../../initializers/constants");
const oauth_model_1 = require("../../lib/oauth-model");
const user_notification_setting_1 = require("./user-notification-setting");
const video_1 = require("../video/video");
const actor_1 = require("../activitypub/actor");
const actor_follow_1 = require("../activitypub/actor-follow");
const video_import_1 = require("../video/video-import");
const user_flag_model_1 = require("../../../shared/models/users/user-flag.model");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const theme_utils_1 = require("../../lib/plugins/theme-utils");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["FOR_ME_API"] = "FOR_ME_API";
    ScopeNames["WITH_VIDEOCHANNELS"] = "WITH_VIDEOCHANNELS";
    ScopeNames["WITH_STATS"] = "WITH_STATS";
})(ScopeNames || (ScopeNames = {}));
let UserModel = UserModel_1 = class UserModel extends sequelize_typescript_1.Model {
    static cryptPasswordIfNeeded(instance) {
        if (instance.changed('password') && instance.password) {
            return peertube_crypto_1.cryptPassword(instance.password)
                .then(hash => {
                instance.password = hash;
                return undefined;
            });
        }
    }
    static removeTokenCache(instance) {
        return oauth_model_1.clearCacheByUserId(instance.id);
    }
    static countTotal() {
        return this.count();
    }
    static listForApi(start, count, sort, search) {
        let where;
        if (search) {
            where = {
                [sequelize_1.Op.or]: [
                    {
                        email: {
                            [sequelize_1.Op.iLike]: '%' + search + '%'
                        }
                    },
                    {
                        username: {
                            [sequelize_1.Op.iLike]: '%' + search + '%'
                        }
                    }
                ]
            };
        }
        const query = {
            attributes: {
                include: [
                    [
                        sequelize_1.literal('(' +
                            UserModel_1.generateUserQuotaBaseSQL({
                                withSelect: false,
                                whereUserId: '"UserModel"."id"'
                            }) +
                            ')'),
                        'videoQuotaUsed'
                    ]
                ]
            },
            offset: start,
            limit: count,
            order: utils_1.getSort(sort),
            where
        };
        return UserModel_1.findAndCountAll(query)
            .then(({ rows, count }) => {
            return {
                data: rows,
                total: count
            };
        });
    }
    static listWithRight(right) {
        const roles = Object.keys(shared_1.USER_ROLE_LABELS)
            .map(k => parseInt(k, 10))
            .filter(role => shared_1.hasUserRight(role, right));
        const query = {
            where: {
                role: {
                    [sequelize_1.Op.in]: roles
                }
            }
        };
        return UserModel_1.findAll(query);
    }
    static listUserSubscribersOf(actorId) {
        const query = {
            include: [
                {
                    model: user_notification_setting_1.UserNotificationSettingModel.unscoped(),
                    required: true
                },
                {
                    attributes: ['userId'],
                    model: account_1.AccountModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: [],
                            model: actor_1.ActorModel.unscoped(),
                            required: true,
                            where: {
                                serverId: null
                            },
                            include: [
                                {
                                    attributes: [],
                                    as: 'ActorFollowings',
                                    model: actor_follow_1.ActorFollowModel.unscoped(),
                                    required: true,
                                    where: {
                                        targetActorId: actorId
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        return UserModel_1.unscoped().findAll(query);
    }
    static listByUsernames(usernames) {
        const query = {
            where: {
                username: usernames
            }
        };
        return UserModel_1.findAll(query);
    }
    static loadById(id, withStats = false) {
        const scopes = [
            ScopeNames.WITH_VIDEOCHANNELS
        ];
        if (withStats)
            scopes.push(ScopeNames.WITH_STATS);
        return UserModel_1.scope(scopes).findByPk(id);
    }
    static loadByUsername(username) {
        const query = {
            where: {
                username: { [sequelize_1.Op.iLike]: username }
            }
        };
        return UserModel_1.findOne(query);
    }
    static loadForMeAPI(username) {
        const query = {
            where: {
                username: { [sequelize_1.Op.iLike]: username }
            }
        };
        return UserModel_1.scope(ScopeNames.FOR_ME_API).findOne(query);
    }
    static loadByEmail(email) {
        const query = {
            where: {
                email
            }
        };
        return UserModel_1.findOne(query);
    }
    static loadByUsernameOrEmail(username, email) {
        if (!email)
            email = username;
        const query = {
            where: {
                [sequelize_1.Op.or]: [
                    sequelize_1.where(sequelize_1.fn('lower', sequelize_1.col('username')), sequelize_1.fn('lower', username)),
                    { email }
                ]
            }
        };
        return UserModel_1.findOne(query);
    }
    static loadByVideoId(videoId) {
        const query = {
            include: [
                {
                    required: true,
                    attributes: ['id'],
                    model: account_1.AccountModel.unscoped(),
                    include: [
                        {
                            required: true,
                            attributes: ['id'],
                            model: video_channel_1.VideoChannelModel.unscoped(),
                            include: [
                                {
                                    required: true,
                                    attributes: ['id'],
                                    model: video_1.VideoModel.unscoped(),
                                    where: {
                                        id: videoId
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        return UserModel_1.findOne(query);
    }
    static loadByVideoImportId(videoImportId) {
        const query = {
            include: [
                {
                    required: true,
                    attributes: ['id'],
                    model: video_import_1.VideoImportModel.unscoped(),
                    where: {
                        id: videoImportId
                    }
                }
            ]
        };
        return UserModel_1.findOne(query);
    }
    static loadByChannelActorId(videoChannelActorId) {
        const query = {
            include: [
                {
                    required: true,
                    attributes: ['id'],
                    model: account_1.AccountModel.unscoped(),
                    include: [
                        {
                            required: true,
                            attributes: ['id'],
                            model: video_channel_1.VideoChannelModel.unscoped(),
                            where: {
                                actorId: videoChannelActorId
                            }
                        }
                    ]
                }
            ]
        };
        return UserModel_1.findOne(query);
    }
    static loadByAccountActorId(accountActorId) {
        const query = {
            include: [
                {
                    required: true,
                    attributes: ['id'],
                    model: account_1.AccountModel.unscoped(),
                    where: {
                        actorId: accountActorId
                    }
                }
            ]
        };
        return UserModel_1.findOne(query);
    }
    static getOriginalVideoFileTotalFromUser(user) {
        const query = UserModel_1.generateUserQuotaBaseSQL({
            withSelect: true,
            whereUserId: '$userId'
        });
        return UserModel_1.getTotalRawQuery(query, user.id);
    }
    static getOriginalVideoFileTotalDailyFromUser(user) {
        const query = UserModel_1.generateUserQuotaBaseSQL({
            withSelect: true,
            whereUserId: '$userId',
            where: '"video"."createdAt" > now() - interval \'24 hours\''
        });
        return UserModel_1.getTotalRawQuery(query, user.id);
    }
    static getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            function getActiveUsers(days) {
                const query = {
                    where: {
                        [sequelize_1.Op.and]: [
                            sequelize_1.literal(`"lastLoginDate" > NOW() - INTERVAL '${days}d'`)
                        ]
                    }
                };
                return UserModel_1.count(query);
            }
            const totalUsers = yield UserModel_1.count();
            const totalDailyActiveUsers = yield getActiveUsers(1);
            const totalWeeklyActiveUsers = yield getActiveUsers(7);
            const totalMonthlyActiveUsers = yield getActiveUsers(30);
            return {
                totalUsers,
                totalDailyActiveUsers,
                totalWeeklyActiveUsers,
                totalMonthlyActiveUsers
            };
        });
    }
    static autoComplete(search) {
        const query = {
            where: {
                username: {
                    [sequelize_1.Op.like]: `%${search}%`
                }
            },
            limit: 10
        };
        return UserModel_1.findAll(query)
            .then(u => u.map(u => u.username));
    }
    canGetVideo(video) {
        const videoUserId = video.VideoChannel.Account.userId;
        if (video.isBlacklisted()) {
            return videoUserId === this.id || this.hasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST);
        }
        if (video.privacy === shared_1.VideoPrivacy.PRIVATE) {
            return video.VideoChannel && videoUserId === this.id || this.hasRight(shared_1.UserRight.MANAGE_VIDEO_BLACKLIST);
        }
        if (video.privacy === shared_1.VideoPrivacy.INTERNAL)
            return true;
        return false;
    }
    hasRight(right) {
        return shared_1.hasUserRight(this.role, right);
    }
    hasAdminFlag(flag) {
        return this.adminFlags & flag;
    }
    isPasswordMatch(password) {
        return peertube_crypto_1.comparePassword(password, this.password);
    }
    toFormattedJSON(parameters = {}) {
        const videoQuotaUsed = this.get('videoQuotaUsed');
        const videoQuotaUsedDaily = this.get('videoQuotaUsedDaily');
        const videosCount = this.get('videosCount');
        const [videoAbusesCount, videoAbusesAcceptedCount] = (this.get('videoAbusesCount') || ':').split(':');
        const videoAbusesCreatedCount = this.get('videoAbusesCreatedCount');
        const videoCommentsCount = this.get('videoCommentsCount');
        const json = {
            id: this.id,
            username: this.username,
            email: this.email,
            theme: theme_utils_1.getThemeOrDefault(this.theme, constants_1.DEFAULT_USER_THEME_NAME),
            pendingEmail: this.pendingEmail,
            emailVerified: this.emailVerified,
            nsfwPolicy: this.nsfwPolicy,
            webTorrentEnabled: this.webTorrentEnabled,
            videosHistoryEnabled: this.videosHistoryEnabled,
            autoPlayVideo: this.autoPlayVideo,
            autoPlayNextVideo: this.autoPlayNextVideo,
            autoPlayNextVideoPlaylist: this.autoPlayNextVideoPlaylist,
            videoLanguages: this.videoLanguages,
            role: this.role,
            roleLabel: shared_1.USER_ROLE_LABELS[this.role],
            videoQuota: this.videoQuota,
            videoQuotaDaily: this.videoQuotaDaily,
            videoQuotaUsed: videoQuotaUsed !== undefined
                ? parseInt(videoQuotaUsed + '', 10)
                : undefined,
            videoQuotaUsedDaily: videoQuotaUsedDaily !== undefined
                ? parseInt(videoQuotaUsedDaily + '', 10)
                : undefined,
            premiumStorageActive: this.premiumStorageActive !== undefined
                ? this.premiumStorageActive
                : false,
            videosCount: videosCount !== undefined
                ? parseInt(videosCount + '', 10)
                : undefined,
            videoAbusesCount: videoAbusesCount
                ? parseInt(videoAbusesCount, 10)
                : undefined,
            videoAbusesAcceptedCount: videoAbusesAcceptedCount
                ? parseInt(videoAbusesAcceptedCount, 10)
                : undefined,
            videoAbusesCreatedCount: videoAbusesCreatedCount !== undefined
                ? parseInt(videoAbusesCreatedCount + '', 10)
                : undefined,
            videoCommentsCount: videoCommentsCount !== undefined
                ? parseInt(videoCommentsCount + '', 10)
                : undefined,
            noInstanceConfigWarningModal: this.noInstanceConfigWarningModal,
            noWelcomeModal: this.noWelcomeModal,
            blocked: this.blocked,
            blockedReason: this.blockedReason,
            account: this.Account.toFormattedJSON(),
            notificationSettings: this.NotificationSetting
                ? this.NotificationSetting.toFormattedJSON()
                : undefined,
            videoChannels: [],
            createdAt: this.createdAt,
            pluginAuth: this.pluginAuth,
            lastLoginDate: this.lastLoginDate
        };
        if (parameters.withAdminFlags) {
            Object.assign(json, { adminFlags: this.adminFlags });
        }
        if (Array.isArray(this.Account.VideoChannels) === true) {
            json.videoChannels = this.Account.VideoChannels
                .map(c => c.toFormattedJSON())
                .sort((v1, v2) => {
                if (v1.createdAt < v2.createdAt)
                    return -1;
                if (v1.createdAt === v2.createdAt)
                    return 0;
                return 1;
            });
        }
        return json;
    }
    toMeFormattedJSON() {
        const formatted = this.toFormattedJSON();
        const specialPlaylists = this.Account.VideoPlaylists
            .map(p => ({ id: p.id, name: p.name, type: p.type }));
        return Object.assign(formatted, { specialPlaylists });
    }
    isAbleToUploadVideo(videoFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.videoQuota === -1 && this.videoQuotaDaily === -1)
                return Promise.resolve(true);
            const [totalBytes, totalBytesDaily] = yield Promise.all([
                UserModel_1.getOriginalVideoFileTotalFromUser(this),
                UserModel_1.getOriginalVideoFileTotalDailyFromUser(this)
            ]);
            const uploadedTotal = videoFile.size + totalBytes;
            const uploadedDaily = videoFile.size + totalBytesDaily;
            if (this.videoQuotaDaily === -1)
                return uploadedTotal < this.videoQuota;
            if (this.videoQuota === -1)
                return uploadedDaily < this.videoQuotaDaily;
            return uploadedTotal < this.videoQuota && uploadedDaily < this.videoQuotaDaily;
        });
    }
    static generateUserQuotaBaseSQL(options) {
        const andWhere = options.where
            ? 'AND ' + options.where
            : '';
        const videoChannelJoin = 'INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId" ' +
            'INNER JOIN "account" ON "videoChannel"."accountId" = "account"."id" ' +
            `WHERE "account"."userId" = ${options.whereUserId} ${andWhere}`;
        const webtorrentFiles = 'SELECT "videoFile"."size" AS "size", "video"."id" AS "videoId" FROM "videoFile" ' +
            'INNER JOIN "video" ON "videoFile"."videoId" = "video"."id" ' +
            videoChannelJoin;
        const hlsFiles = 'SELECT "videoFile"."size" AS "size", "video"."id" AS "videoId" FROM "videoFile" ' +
            'INNER JOIN "videoStreamingPlaylist" ON "videoFile"."videoStreamingPlaylistId" = "videoStreamingPlaylist".id ' +
            'INNER JOIN "video" ON "videoStreamingPlaylist"."videoId" = "video"."id" ' +
            videoChannelJoin;
        return 'SELECT COALESCE(SUM("size"), 0) AS "total" ' +
            'FROM (' +
            `SELECT MAX("t1"."size") AS "size" FROM (${webtorrentFiles} UNION ${hlsFiles}) t1 ` +
            'GROUP BY "t1"."videoId"' +
            ') t2';
    }
    static getTotalRawQuery(query, userId) {
        const options = {
            bind: { userId },
            type: sequelize_1.QueryTypes.SELECT
        };
        return UserModel_1.sequelize.query(query, options)
            .then(([{ total }]) => {
            if (total === null)
                return 0;
            return parseInt(total, 10);
        });
    }
};
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('UserPassword', value => utils_1.throwIfNotValid(value, users_1.isUserPasswordValid, 'user password', true)),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], UserModel.prototype, "password", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('UserUsername', value => utils_1.throwIfNotValid(value, users_1.isUserUsernameValid, 'user name')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], UserModel.prototype, "username", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.IsEmail,
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(400)),
    __metadata("design:type", String)
], UserModel.prototype, "email", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.IsEmail,
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(400)),
    __metadata("design:type", String)
], UserModel.prototype, "pendingEmail", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserEmailVerified', value => utils_1.throwIfNotValid(value, users_1.isUserEmailVerifiedValid, 'email verified boolean', true)),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "emailVerified", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('UserNSFWPolicy', value => utils_1.throwIfNotValid(value, users_1.isUserNSFWPolicyValid, 'NSFW policy')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.ENUM(...lodash_1.values(constants_1.NSFW_POLICY_TYPES))),
    __metadata("design:type", String)
], UserModel.prototype, "nsfwPolicy", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Is('UserWebTorrentEnabled', value => utils_1.throwIfNotValid(value, users_1.isUserWebTorrentEnabledValid, 'WebTorrent enabled')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "webTorrentEnabled", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Is('UserVideosHistoryEnabled', value => utils_1.throwIfNotValid(value, users_1.isUserVideosHistoryEnabledValid, 'Videos history enabled')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "videosHistoryEnabled", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Is('UserAutoPlayVideo', value => utils_1.throwIfNotValid(value, users_1.isUserAutoPlayVideoValid, 'auto play video boolean')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "autoPlayVideo", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Is('UserAutoPlayNextVideo', value => utils_1.throwIfNotValid(value, users_1.isUserAutoPlayNextVideoValid, 'auto play next video boolean')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "autoPlayNextVideo", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(true),
    sequelize_typescript_1.Is('UserAutoPlayNextVideoPlaylist', value => utils_1.throwIfNotValid(value, users_1.isUserAutoPlayNextVideoPlaylistValid, 'auto play next video for playlists boolean')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "autoPlayNextVideoPlaylist", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserVideoLanguages', value => utils_1.throwIfNotValid(value, users_1.isUserVideoLanguages, 'video languages')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING)),
    __metadata("design:type", Array)
], UserModel.prototype, "videoLanguages", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(user_flag_model_1.UserAdminFlag.NONE),
    sequelize_typescript_1.Is('UserAdminFlags', value => utils_1.throwIfNotValid(value, users_1.isUserAdminFlagsValid, 'user admin flags')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserModel.prototype, "adminFlags", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Is('UserBlocked', value => utils_1.throwIfNotValid(value, users_1.isUserBlockedValid, 'blocked boolean')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "blocked", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('UserBlockedReason', value => utils_1.throwIfNotValid(value, users_1.isUserBlockedReasonValid, 'blocked reason', true)),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], UserModel.prototype, "blockedReason", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('UserRole', value => utils_1.throwIfNotValid(value, users_1.isUserRoleValid, 'role')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], UserModel.prototype, "role", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('UserVideoQuota', value => utils_1.throwIfNotValid(value, users_1.isUserVideoQuotaValid, 'video quota')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], UserModel.prototype, "videoQuota", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('UserVideoQuotaDaily', value => utils_1.throwIfNotValid(value, users_1.isUserVideoQuotaDailyValid, 'video quota daily')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], UserModel.prototype, "videoQuotaDaily", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('premiumStorageActive', value => utils_1.throwIfNotValid(value, users_1.isUserPremiumStorageActiveValid, 'user premium storafe active')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BOOLEAN),
    __metadata("design:type", Boolean)
], UserModel.prototype, "premiumStorageActive", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(constants_1.DEFAULT_USER_THEME_NAME),
    sequelize_typescript_1.Is('UserTheme', value => utils_1.throwIfNotValid(value, plugins_1.isThemeNameValid, 'theme')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], UserModel.prototype, "theme", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Is('UserNoInstanceConfigWarningModal', value => utils_1.throwIfNotValid(value, users_1.isNoInstanceConfigWarningModal, 'no instance config warning modal')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "noInstanceConfigWarningModal", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(false),
    sequelize_typescript_1.Is('UserNoInstanceConfigWarningModal', value => utils_1.throwIfNotValid(value, users_1.isNoWelcomeModal, 'no welcome modal')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], UserModel.prototype, "noWelcomeModal", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], UserModel.prototype, "pluginAuth", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], UserModel.prototype, "lastLoginDate", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], UserModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], UserModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => account_1.AccountModel, {
        foreignKey: 'userId',
        onDelete: 'cascade',
        hooks: true
    }),
    __metadata("design:type", account_1.AccountModel)
], UserModel.prototype, "Account", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => user_notification_setting_1.UserNotificationSettingModel, {
        foreignKey: 'userId',
        onDelete: 'cascade',
        hooks: true
    }),
    __metadata("design:type", user_notification_setting_1.UserNotificationSettingModel)
], UserModel.prototype, "NotificationSetting", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_import_1.VideoImportModel, {
        foreignKey: 'userId',
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], UserModel.prototype, "VideoImports", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => oauth_token_1.OAuthTokenModel, {
        foreignKey: 'userId',
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], UserModel.prototype, "OAuthTokens", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    sequelize_typescript_1.BeforeUpdate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel]),
    __metadata("design:returntype", void 0)
], UserModel, "cryptPasswordIfNeeded", null);
__decorate([
    sequelize_typescript_1.AfterUpdate,
    sequelize_typescript_1.AfterDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel]),
    __metadata("design:returntype", void 0)
], UserModel, "removeTokenCache", null);
UserModel = UserModel_1 = __decorate([
    sequelize_typescript_1.DefaultScope(() => ({
        include: [
            {
                model: account_1.AccountModel,
                required: true
            },
            {
                model: user_notification_setting_1.UserNotificationSettingModel,
                required: true
            }
        ]
    })),
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.FOR_ME_API]: {
            include: [
                {
                    model: account_1.AccountModel,
                    include: [
                        {
                            model: video_channel_1.VideoChannelModel
                        },
                        {
                            attributes: ['id', 'name', 'type'],
                            model: video_playlist_1.VideoPlaylistModel.unscoped(),
                            required: true,
                            where: {
                                type: {
                                    [sequelize_1.Op.ne]: shared_1.VideoPlaylistType.REGULAR
                                }
                            }
                        }
                    ]
                },
                {
                    model: user_notification_setting_1.UserNotificationSettingModel,
                    required: true
                }
            ]
        },
        [ScopeNames.WITH_VIDEOCHANNELS]: {
            include: [
                {
                    model: account_1.AccountModel,
                    include: [
                        {
                            model: video_channel_1.VideoChannelModel
                        },
                        {
                            attributes: ['id', 'name', 'type'],
                            model: video_playlist_1.VideoPlaylistModel.unscoped(),
                            required: true,
                            where: {
                                type: {
                                    [sequelize_1.Op.ne]: shared_1.VideoPlaylistType.REGULAR
                                }
                            }
                        }
                    ]
                }
            ]
        },
        [ScopeNames.WITH_STATS]: {
            attributes: {
                include: [
                    [
                        sequelize_1.literal('(' +
                            UserModel_1.generateUserQuotaBaseSQL({
                                withSelect: false,
                                whereUserId: '"UserModel"."id"'
                            }) +
                            ')'),
                        'videoQuotaUsed'
                    ],
                    [
                        sequelize_1.literal('(' +
                            'SELECT COUNT("video"."id") ' +
                            'FROM "video" ' +
                            'INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId" ' +
                            'INNER JOIN "account" ON "account"."id" = "videoChannel"."accountId" ' +
                            'WHERE "account"."userId" = "UserModel"."id"' +
                            ')'),
                        'videosCount'
                    ],
                    [
                        sequelize_1.literal('(' +
                            `SELECT concat_ws(':', "abuses", "acceptedAbuses") ` +
                            'FROM (' +
                            'SELECT COUNT("videoAbuse"."id") AS "abuses", ' +
                            `COUNT("videoAbuse"."id") FILTER (WHERE "videoAbuse"."state" = ${shared_1.VideoAbuseState.ACCEPTED}) AS "acceptedAbuses" ` +
                            'FROM "videoAbuse" ' +
                            'INNER JOIN "video" ON "videoAbuse"."videoId" = "video"."id" ' +
                            'INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId" ' +
                            'INNER JOIN "account" ON "account"."id" = "videoChannel"."accountId" ' +
                            'WHERE "account"."userId" = "UserModel"."id"' +
                            ') t' +
                            ')'),
                        'videoAbusesCount'
                    ],
                    [
                        sequelize_1.literal('(' +
                            'SELECT COUNT("videoAbuse"."id") ' +
                            'FROM "videoAbuse" ' +
                            'INNER JOIN "account" ON "account"."id" = "videoAbuse"."reporterAccountId" ' +
                            'WHERE "account"."userId" = "UserModel"."id"' +
                            ')'),
                        'videoAbusesCreatedCount'
                    ],
                    [
                        sequelize_1.literal('(' +
                            'SELECT COUNT("videoComment"."id") ' +
                            'FROM "videoComment" ' +
                            'INNER JOIN "account" ON "account"."id" = "videoComment"."accountId" ' +
                            'WHERE "account"."userId" = "UserModel"."id"' +
                            ')'),
                        'videoCommentsCount'
                    ]
                ]
            }
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'user',
        indexes: [
            {
                fields: ['username'],
                unique: true
            },
            {
                fields: ['email'],
                unique: true
            }
        ]
    })
], UserModel);
exports.UserModel = UserModel;
