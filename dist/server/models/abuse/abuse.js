"use strict";
var AbuseModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbuseModel = exports.ScopeNames = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const abuses_1 = require("@server/helpers/custom-validators/abuses");
const abuse_1 = require("@shared/core-utils/abuse");
const constants_1 = require("../../initializers/constants");
const account_1 = require("../account/account");
const utils_1 = require("../utils");
const thumbnail_1 = require("../video/thumbnail");
const video_1 = require("../video/video");
const video_blacklist_1 = require("../video/video-blacklist");
const video_channel_1 = require("../video/video-channel");
const video_comment_1 = require("../video/video-comment");
const abuse_query_builder_1 = require("./abuse-query-builder");
const video_abuse_1 = require("./video-abuse");
const video_comment_abuse_1 = require("./video-comment-abuse");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["FOR_API"] = "FOR_API";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let AbuseModel = AbuseModel_1 = class AbuseModel extends sequelize_typescript_1.Model {
    static loadByIdAndVideoId(id, videoId, uuid) {
        const videoWhere = {};
        if (videoId)
            videoWhere.videoId = videoId;
        if (uuid)
            videoWhere.deletedVideo = { uuid };
        const query = {
            include: [
                {
                    model: video_abuse_1.VideoAbuseModel,
                    required: true,
                    where: videoWhere
                },
                {
                    model: account_1.AccountModel,
                    as: 'ReporterAccount'
                }
            ],
            where: {
                id
            }
        };
        return AbuseModel_1.findOne(query);
    }
    static loadByIdWithReporter(id) {
        const query = {
            where: {
                id
            },
            include: [
                {
                    model: account_1.AccountModel,
                    as: 'ReporterAccount'
                }
            ]
        };
        return AbuseModel_1.findOne(query);
    }
    static loadFull(id) {
        const query = {
            where: {
                id
            },
            include: [
                {
                    model: account_1.AccountModel.scope(account_1.ScopeNames.SUMMARY),
                    required: false,
                    as: 'ReporterAccount'
                },
                {
                    model: account_1.AccountModel.scope(account_1.ScopeNames.SUMMARY),
                    as: 'FlaggedAccount'
                },
                {
                    model: video_abuse_1.VideoAbuseModel,
                    required: false,
                    include: [
                        {
                            model: video_1.VideoModel.scope([video_1.ScopeNames.WITH_ACCOUNT_DETAILS])
                        }
                    ]
                },
                {
                    model: video_comment_abuse_1.VideoCommentAbuseModel,
                    required: false,
                    include: [
                        {
                            model: video_comment_1.VideoCommentModel.scope([
                                video_comment_1.ScopeNames.WITH_ACCOUNT
                            ]),
                            include: [
                                {
                                    model: video_1.VideoModel
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        return AbuseModel_1.findOne(query);
    }
    static listForAdminApi(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { start, count, sort, search, user, serverAccountId, state, videoIs, predefinedReason, searchReportee, searchVideo, filter, searchVideoChannel, searchReporter, id } = parameters;
            const userAccountId = user ? user.Account.id : undefined;
            const predefinedReasonId = predefinedReason ? abuse_1.abusePredefinedReasonsMap[predefinedReason] : undefined;
            const queryOptions = {
                start,
                count,
                sort,
                id,
                filter,
                predefinedReasonId,
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
            const [total, data] = yield Promise.all([
                AbuseModel_1.internalCountForApi(queryOptions),
                AbuseModel_1.internalListForApi(queryOptions)
            ]);
            return { total, data };
        });
    }
    static listForUserApi(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { start, count, sort, search, user, state, id } = parameters;
            const queryOptions = {
                start,
                count,
                sort,
                id,
                search,
                state,
                reporterAccountId: user.Account.id
            };
            const [total, data] = yield Promise.all([
                AbuseModel_1.internalCountForApi(queryOptions),
                AbuseModel_1.internalListForApi(queryOptions)
            ]);
            return { total, data };
        });
    }
    buildBaseVideoCommentAbuse() {
        var _a;
        if (!this.VideoCommentAbuse)
            return null;
        const abuseModel = this.VideoCommentAbuse;
        const entity = abuseModel.VideoComment;
        if (!entity)
            return null;
        return {
            id: entity.id,
            threadId: entity.getThreadId(),
            text: (_a = entity.text) !== null && _a !== void 0 ? _a : '',
            deleted: entity.isDeleted(),
            video: {
                id: entity.Video.id,
                name: entity.Video.name,
                uuid: entity.Video.uuid
            }
        };
    }
    buildBaseVideoAbuse() {
        var _a, _b, _c, _d;
        if (!this.VideoAbuse)
            return null;
        const abuseModel = this.VideoAbuse;
        const entity = abuseModel.Video || abuseModel.deletedVideo;
        return {
            id: entity.id,
            uuid: entity.uuid,
            name: entity.name,
            nsfw: entity.nsfw,
            startAt: abuseModel.startAt,
            endAt: abuseModel.endAt,
            deleted: !abuseModel.Video,
            blacklisted: ((_a = abuseModel.Video) === null || _a === void 0 ? void 0 : _a.isBlacklisted()) || false,
            thumbnailPath: (_b = abuseModel.Video) === null || _b === void 0 ? void 0 : _b.getMiniatureStaticPath(),
            channel: ((_c = abuseModel.Video) === null || _c === void 0 ? void 0 : _c.VideoChannel.toFormattedJSON()) || ((_d = abuseModel.deletedVideo) === null || _d === void 0 ? void 0 : _d.channel)
        };
    }
    buildBaseAbuse(countMessages) {
        const predefinedReasons = AbuseModel_1.getPredefinedReasonsStrings(this.predefinedReasons);
        return {
            id: this.id,
            reason: this.reason,
            predefinedReasons,
            flaggedAccount: this.FlaggedAccount
                ? this.FlaggedAccount.toFormattedJSON()
                : null,
            state: {
                id: this.state,
                label: AbuseModel_1.getStateLabel(this.state)
            },
            countMessages,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
    toFormattedAdminJSON() {
        const countReportsForVideo = this.get('countReportsForVideo');
        const nthReportForVideo = this.get('nthReportForVideo');
        const countReportsForReporter = this.get('countReportsForReporter');
        const countReportsForReportee = this.get('countReportsForReportee');
        const countMessages = this.get('countMessages');
        const baseVideo = this.buildBaseVideoAbuse();
        const video = baseVideo
            ? Object.assign(baseVideo, {
                countReports: countReportsForVideo,
                nthReport: nthReportForVideo
            })
            : null;
        const comment = this.buildBaseVideoCommentAbuse();
        const abuse = this.buildBaseAbuse(countMessages || 0);
        return Object.assign(abuse, {
            video,
            comment,
            moderationComment: this.moderationComment,
            reporterAccount: this.ReporterAccount
                ? this.ReporterAccount.toFormattedJSON()
                : null,
            countReportsForReporter: (countReportsForReporter || 0),
            countReportsForReportee: (countReportsForReportee || 0),
            startAt: null,
            endAt: null,
            count: countReportsForVideo || 0,
            nth: nthReportForVideo || 0
        });
    }
    toFormattedUserJSON() {
        const countMessages = this.get('countMessages');
        const video = this.buildBaseVideoAbuse();
        const comment = this.buildBaseVideoCommentAbuse();
        const abuse = this.buildBaseAbuse(countMessages || 0);
        return Object.assign(abuse, {
            video,
            comment
        });
    }
    toActivityPubObject() {
        var _a, _b, _c, _d, _e, _f;
        const predefinedReasons = AbuseModel_1.getPredefinedReasonsStrings(this.predefinedReasons);
        const object = ((_b = (_a = this.VideoAbuse) === null || _a === void 0 ? void 0 : _a.Video) === null || _b === void 0 ? void 0 : _b.url) || ((_d = (_c = this.VideoCommentAbuse) === null || _c === void 0 ? void 0 : _c.VideoComment) === null || _d === void 0 ? void 0 : _d.url) || this.FlaggedAccount.Actor.url;
        const startAt = (_e = this.VideoAbuse) === null || _e === void 0 ? void 0 : _e.startAt;
        const endAt = (_f = this.VideoAbuse) === null || _f === void 0 ? void 0 : _f.endAt;
        return {
            type: 'Flag',
            content: this.reason,
            object,
            tag: predefinedReasons.map(r => ({
                type: 'Hashtag',
                name: r
            })),
            startAt,
            endAt
        };
    }
    static internalCountForApi(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { query, replacements } = abuse_query_builder_1.buildAbuseListQuery(parameters, 'count');
            const options = {
                type: sequelize_1.QueryTypes.SELECT,
                replacements
            };
            const [{ total }] = yield AbuseModel_1.sequelize.query(query, options);
            if (total === null)
                return 0;
            return parseInt(total, 10);
        });
    }
    static internalListForApi(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { query, replacements } = abuse_query_builder_1.buildAbuseListQuery(parameters, 'id');
            const options = {
                type: sequelize_1.QueryTypes.SELECT,
                replacements
            };
            const rows = yield AbuseModel_1.sequelize.query(query, options);
            const ids = rows.map(r => r.id);
            if (ids.length === 0)
                return [];
            return AbuseModel_1.scope(ScopeNames.FOR_API)
                .findAll({
                order: utils_1.getSort(parameters.sort),
                where: {
                    id: {
                        [sequelize_1.Op.in]: ids
                    }
                }
            });
        });
    }
    static getStateLabel(id) {
        return constants_1.ABUSE_STATES[id] || 'Unknown';
    }
    static getPredefinedReasonsStrings(predefinedReasons) {
        const invertedPredefinedReasons = lodash_1.invert(abuse_1.abusePredefinedReasonsMap);
        return (predefinedReasons || [])
            .map(r => invertedPredefinedReasons[r])
            .filter(v => !!v);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('AbuseReason', value => utils_1.throwIfNotValid(value, abuses_1.isAbuseReasonValid, 'reason')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.ABUSES.REASON.max)),
    tslib_1.__metadata("design:type", String)
], AbuseModel.prototype, "reason", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('AbuseState', value => utils_1.throwIfNotValid(value, abuses_1.isAbuseStateValid, 'state')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AbuseModel.prototype, "state", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('AbuseModerationComment', value => utils_1.throwIfNotValid(value, abuses_1.isAbuseModerationCommentValid, 'moderationComment', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.ABUSES.MODERATION_COMMENT.max)),
    tslib_1.__metadata("design:type", String)
], AbuseModel.prototype, "moderationComment", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.INTEGER)),
    tslib_1.__metadata("design:type", Array)
], AbuseModel.prototype, "predefinedReasons", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], AbuseModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], AbuseModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AbuseModel.prototype, "reporterAccountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'reporterAccountId',
            allowNull: true
        },
        as: 'ReporterAccount',
        onDelete: 'set null'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], AbuseModel.prototype, "ReporterAccount", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AbuseModel.prototype, "flaggedAccountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'flaggedAccountId',
            allowNull: true
        },
        as: 'FlaggedAccount',
        onDelete: 'set null'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], AbuseModel.prototype, "FlaggedAccount", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasOne(() => video_comment_abuse_1.VideoCommentAbuseModel, {
        foreignKey: {
            name: 'abuseId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_comment_abuse_1.VideoCommentAbuseModel)
], AbuseModel.prototype, "VideoCommentAbuse", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasOne(() => video_abuse_1.VideoAbuseModel, {
        foreignKey: {
            name: 'abuseId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_abuse_1.VideoAbuseModel)
], AbuseModel.prototype, "VideoAbuse", void 0);
AbuseModel = AbuseModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.FOR_API]: () => {
            return {
                attributes: {
                    include: [
                        [
                            sequelize_1.literal('(' +
                                'SELECT count(*) ' +
                                'FROM "abuseMessage" ' +
                                'WHERE "abuseId" = "AbuseModel"."id"' +
                                ')'),
                            'countMessages'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT count(*) ' +
                                'FROM "videoAbuse" ' +
                                'WHERE "videoId" = "VideoAbuse"."videoId" AND "videoId" IS NOT NULL' +
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
                                'WHERE t.id = "VideoAbuse".id AND t.id IS NOT NULL' +
                                ')'),
                            'nthReportForVideo'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT count("abuse"."id") ' +
                                'FROM "abuse" ' +
                                'WHERE "abuse"."reporterAccountId" = "AbuseModel"."reporterAccountId"' +
                                ')'),
                            'countReportsForReporter'
                        ],
                        [
                            sequelize_1.literal('(' +
                                'SELECT count("abuse"."id") ' +
                                'FROM "abuse" ' +
                                'WHERE "abuse"."flaggedAccountId" = "AbuseModel"."flaggedAccountId"' +
                                ')'),
                            'countReportsForReportee'
                        ]
                    ]
                },
                include: [
                    {
                        model: account_1.AccountModel.scope({
                            method: [
                                account_1.ScopeNames.SUMMARY,
                                { actorRequired: false }
                            ]
                        }),
                        as: 'ReporterAccount'
                    },
                    {
                        model: account_1.AccountModel.scope({
                            method: [
                                account_1.ScopeNames.SUMMARY,
                                { actorRequired: false }
                            ]
                        }),
                        as: 'FlaggedAccount'
                    },
                    {
                        model: video_comment_abuse_1.VideoCommentAbuseModel.unscoped(),
                        include: [
                            {
                                model: video_comment_1.VideoCommentModel.unscoped(),
                                include: [
                                    {
                                        model: video_1.VideoModel.unscoped(),
                                        attributes: ['name', 'id', 'uuid']
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: video_abuse_1.VideoAbuseModel.unscoped(),
                        include: [
                            {
                                attributes: ['id', 'uuid', 'name', 'nsfw'],
                                model: video_1.VideoModel.unscoped(),
                                include: [
                                    {
                                        attributes: ['filename', 'fileUrl', 'type'],
                                        model: thumbnail_1.ThumbnailModel
                                    },
                                    {
                                        model: video_channel_1.VideoChannelModel.scope({
                                            method: [
                                                video_channel_1.ScopeNames.SUMMARY,
                                                { withAccount: false, actorRequired: false }
                                            ]
                                        }),
                                        required: false
                                    },
                                    {
                                        attributes: ['id', 'reason', 'unfederated'],
                                        required: false,
                                        model: video_blacklist_1.VideoBlacklistModel
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'abuse',
        indexes: [
            {
                fields: ['reporterAccountId']
            },
            {
                fields: ['flaggedAccountId']
            }
        ]
    })
], AbuseModel);
exports.AbuseModel = AbuseModel;
