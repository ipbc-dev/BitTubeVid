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
var VideoAbuseModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const shared_1 = require("../../../shared");
const video_abuses_1 = require("../../helpers/custom-validators/video-abuses");
const constants_1 = require("../../initializers/constants");
const account_1 = require("../account/account");
const utils_1 = require("../utils");
const thumbnail_1 = require("./thumbnail");
const video_1 = require("./video");
const video_blacklist_1 = require("./video-blacklist");
const video_channel_1 = require("./video-channel");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["FOR_API"] = "FOR_API";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let VideoAbuseModel = VideoAbuseModel_1 = class VideoAbuseModel extends sequelize_typescript_1.Model {
    static loadByIdAndVideoId(id, videoId, uuid) {
        const videoAttributes = {};
        if (videoId)
            videoAttributes['videoId'] = videoId;
        if (uuid)
            videoAttributes['deletedVideo'] = { uuid };
        const query = {
            where: Object.assign({ id }, videoAttributes)
        };
        return VideoAbuseModel_1.findOne(query);
    }
    static listForApi(parameters) {
        const { start, count, sort, search, user, serverAccountId, state, videoIs, searchReportee, searchVideo, searchVideoChannel, searchReporter, id } = parameters;
        const userAccountId = user ? user.Account.id : undefined;
        const query = {
            offset: start,
            limit: count,
            order: utils_1.getSort(sort),
            col: 'VideoAbuseModel.id',
            distinct: true
        };
        const filters = {
            id,
            search,
            state,
            videoIs,
            searchReportee,
            searchVideo,
            searchVideoChannel,
            searchReporter,
            serverAccountId,
            userAccountId
        };
        return VideoAbuseModel_1
            .scope({ method: [ScopeNames.FOR_API, filters] })
            .findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows };
        });
    }
    toFormattedJSON() {
        var _a, _b, _c;
        const countReportsForVideo = this.get('countReportsForVideo');
        const nthReportForVideo = this.get('nthReportForVideo');
        const countReportsForReporterVideo = this.get('countReportsForReporter__video');
        const countReportsForReporterDeletedVideo = this.get('countReportsForReporter__deletedVideo');
        const countReportsForReporteeVideo = this.get('countReportsForReportee__video');
        const countReportsForReporteeDeletedVideo = this.get('countReportsForReportee__deletedVideo');
        const video = this.Video
            ? this.Video
            : this.deletedVideo;
        return {
            id: this.id,
            reason: this.reason,
            reporterAccount: this.Account.toFormattedJSON(),
            state: {
                id: this.state,
                label: VideoAbuseModel_1.getStateLabel(this.state)
            },
            moderationComment: this.moderationComment,
            video: {
                id: video.id,
                uuid: video.uuid,
                name: video.name,
                nsfw: video.nsfw,
                deleted: !this.Video,
                blacklisted: this.Video && this.Video.isBlacklisted(),
                thumbnailPath: (_a = this.Video) === null || _a === void 0 ? void 0 : _a.getMiniatureStaticPath(),
                channel: ((_b = this.Video) === null || _b === void 0 ? void 0 : _b.VideoChannel.toFormattedJSON()) || ((_c = this.deletedVideo) === null || _c === void 0 ? void 0 : _c.channel)
            },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            count: countReportsForVideo || 0,
            nth: nthReportForVideo || 0,
            countReportsForReporter: (countReportsForReporterVideo || 0) + (countReportsForReporterDeletedVideo || 0),
            countReportsForReportee: (countReportsForReporteeVideo || 0) + (countReportsForReporteeDeletedVideo || 0)
        };
    }
    toActivityPubObject() {
        return {
            type: 'Flag',
            content: this.reason,
            object: this.Video.url
        };
    }
    static getStateLabel(id) {
        return constants_1.VIDEO_ABUSE_STATES[id] || 'Unknown';
    }
};
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoAbuseReason', value => utils_1.throwIfNotValid(value, video_abuses_1.isVideoAbuseReasonValid, 'reason')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_ABUSES.REASON.max)),
    __metadata("design:type", String)
], VideoAbuseModel.prototype, "reason", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoAbuseState', value => utils_1.throwIfNotValid(value, video_abuses_1.isVideoAbuseStateValid, 'state')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoAbuseModel.prototype, "state", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoAbuseModerationComment', value => utils_1.throwIfNotValid(value, video_abuses_1.isVideoAbuseModerationCommentValid, 'moderationComment', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_ABUSES.MODERATION_COMMENT.max)),
    __metadata("design:type", String)
], VideoAbuseModel.prototype, "moderationComment", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.JSONB),
    __metadata("design:type", Object)
], VideoAbuseModel.prototype, "deletedVideo", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoAbuseModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoAbuseModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoAbuseModel.prototype, "reporterAccountId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'set null'
    }),
    __metadata("design:type", account_1.AccountModel)
], VideoAbuseModel.prototype, "Account", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoAbuseModel.prototype, "videoId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'set null'
    }),
    __metadata("design:type", video_1.VideoModel)
], VideoAbuseModel.prototype, "Video", void 0);
VideoAbuseModel = VideoAbuseModel_1 = __decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.FOR_API]: (options) => {
            const where = {
                reporterAccountId: {
                    [sequelize_1.Op.notIn]: sequelize_1.literal('(' + utils_1.buildBlockedAccountSQL(options.serverAccountId, options.userAccountId) + ')')
                }
            };
            if (options.search) {
                Object.assign(where, {
                    [sequelize_1.Op.or]: [
                        {
                            [sequelize_1.Op.and]: [
                                { videoId: { [sequelize_1.Op.not]: null } },
                                utils_1.searchAttribute(options.search, '$Video.name$')
                            ]
                        },
                        {
                            [sequelize_1.Op.and]: [
                                { videoId: { [sequelize_1.Op.not]: null } },
                                utils_1.searchAttribute(options.search, '$Video.VideoChannel.name$')
                            ]
                        },
                        {
                            [sequelize_1.Op.and]: [
                                { deletedVideo: { [sequelize_1.Op.not]: null } },
                                { deletedVideo: utils_1.searchAttribute(options.search, 'name') }
                            ]
                        },
                        {
                            [sequelize_1.Op.and]: [
                                { deletedVideo: { [sequelize_1.Op.not]: null } },
                                { deletedVideo: { channel: utils_1.searchAttribute(options.search, 'displayName') } }
                            ]
                        },
                        utils_1.searchAttribute(options.search, '$Account.name$')
                    ]
                });
            }
            if (options.id)
                Object.assign(where, { id: options.id });
            if (options.state)
                Object.assign(where, { state: options.state });
            if (options.videoIs === 'deleted') {
                Object.assign(where, {
                    deletedVideo: {
                        [sequelize_1.Op.not]: null
                    }
                });
            }
            const onlyBlacklisted = options.videoIs === 'blacklisted';
            return {
                attributes: {
                    include: [
                        [
                            sequelize_1.literal('(' +
                                'SELECT count(*) ' +
                                'FROM "videoAbuse" ' +
                                'WHERE "videoId" = "VideoAbuseModel"."videoId" ' +
                                ')'),
                            'countReportsForVideo'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT t.nth ' +
                                'FROM ( ' +
                                'SELECT id, ' +
                                'row_number() OVER (PARTITION BY "videoId" ORDER BY "createdAt") AS nth ' +
                                'FROM "videoAbuse" ' +
                                ') t ' +
                                'WHERE t.id = "VideoAbuseModel".id ' +
                                ')'),
                            'nthReportForVideo'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT count("videoAbuse"."id") ' +
                                'FROM "videoAbuse" ' +
                                'INNER JOIN "video" ON "video"."id" = "videoAbuse"."videoId" ' +
                                'INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId" ' +
                                'INNER JOIN "account" ON "videoChannel"."accountId" = "account"."id" ' +
                                'WHERE "account"."id" = "VideoAbuseModel"."reporterAccountId" ' +
                                ')'),
                            'countReportsForReporter__video'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT count(DISTINCT "videoAbuse"."id") ' +
                                'FROM "videoAbuse" ' +
                                `WHERE CAST("deletedVideo"->'channel'->'ownerAccount'->>'id' AS INTEGER) = "VideoAbuseModel"."reporterAccountId" ` +
                                ')'),
                            'countReportsForReporter__deletedVideo'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT count(DISTINCT "videoAbuse"."id") ' +
                                'FROM "videoAbuse" ' +
                                'INNER JOIN "video" ON "video"."id" = "videoAbuse"."videoId" ' +
                                'INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId" ' +
                                'INNER JOIN "account" ON ' +
                                '"videoChannel"."accountId" = "Video->VideoChannel"."accountId" ' +
                                `OR "videoChannel"."accountId" = CAST("VideoAbuseModel"."deletedVideo"->'channel'->'ownerAccount'->>'id' AS INTEGER) ` +
                                ')'),
                            'countReportsForReportee__video'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT count(DISTINCT "videoAbuse"."id") ' +
                                'FROM "videoAbuse" ' +
                                `WHERE CAST("deletedVideo"->'channel'->'ownerAccount'->>'id' AS INTEGER) = "Video->VideoChannel"."accountId" ` +
                                `OR CAST("deletedVideo"->'channel'->'ownerAccount'->>'id' AS INTEGER) = ` +
                                `CAST("VideoAbuseModel"."deletedVideo"->'channel'->'ownerAccount'->>'id' AS INTEGER) ` +
                                ')'),
                            'countReportsForReportee__deletedVideo'
                        ]
                    ]
                },
                include: [
                    {
                        model: account_1.AccountModel,
                        required: true,
                        where: utils_1.searchAttribute(options.searchReporter, 'name')
                    },
                    {
                        model: video_1.VideoModel,
                        required: !!(onlyBlacklisted || options.searchVideo || options.searchReportee || options.searchVideoChannel),
                        where: utils_1.searchAttribute(options.searchVideo, 'name'),
                        include: [
                            {
                                model: thumbnail_1.ThumbnailModel
                            },
                            {
                                model: video_channel_1.VideoChannelModel.scope({ method: [video_channel_1.ScopeNames.SUMMARY, { withAccount: true }] }),
                                where: utils_1.searchAttribute(options.searchVideoChannel, 'name'),
                                include: [
                                    {
                                        model: account_1.AccountModel,
                                        where: utils_1.searchAttribute(options.searchReportee, 'name')
                                    }
                                ]
                            },
                            {
                                attributes: ['id', 'reason', 'unfederated'],
                                model: video_blacklist_1.VideoBlacklistModel,
                                required: onlyBlacklisted
                            }
                        ]
                    }
                ],
                where
            };
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoAbuse',
        indexes: [
            {
                fields: ['videoId']
            },
            {
                fields: ['reporterAccountId']
            }
        ]
    })
], VideoAbuseModel);
exports.VideoAbuseModel = VideoAbuseModel;
