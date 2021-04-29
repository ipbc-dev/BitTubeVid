"use strict";
var VideoCommentModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCommentModel = exports.ScopeNames = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const application_1 = require("@server/models/application/application");
const actor_1 = require("../../helpers/custom-validators/activitypub/actor");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const regexp_1 = require("../../helpers/regexp");
const constants_1 = require("../../initializers/constants");
const video_comment_abuse_1 = require("../abuse/video-comment-abuse");
const account_1 = require("../account/account");
const actor_2 = require("../activitypub/actor");
const utils_1 = require("../utils");
const video_1 = require("./video");
const video_channel_1 = require("./video-channel");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_ACCOUNT"] = "WITH_ACCOUNT";
    ScopeNames["WITH_ACCOUNT_FOR_API"] = "WITH_ACCOUNT_FOR_API";
    ScopeNames["WITH_IN_REPLY_TO"] = "WITH_IN_REPLY_TO";
    ScopeNames["WITH_VIDEO"] = "WITH_VIDEO";
    ScopeNames["ATTRIBUTES_FOR_API"] = "ATTRIBUTES_FOR_API";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let VideoCommentModel = VideoCommentModel_1 = class VideoCommentModel extends sequelize_typescript_1.Model {
    static loadById(id, t) {
        const query = {
            where: {
                id
            }
        };
        if (t !== undefined)
            query.transaction = t;
        return VideoCommentModel_1.findOne(query);
    }
    static loadByIdAndPopulateVideoAndAccountAndReply(id, t) {
        const query = {
            where: {
                id
            }
        };
        if (t !== undefined)
            query.transaction = t;
        return VideoCommentModel_1
            .scope([ScopeNames.WITH_VIDEO, ScopeNames.WITH_ACCOUNT, ScopeNames.WITH_IN_REPLY_TO])
            .findOne(query);
    }
    static loadByUrlAndPopulateAccountAndVideo(url, t) {
        const query = {
            where: {
                url
            }
        };
        if (t !== undefined)
            query.transaction = t;
        return VideoCommentModel_1.scope([ScopeNames.WITH_ACCOUNT, ScopeNames.WITH_VIDEO]).findOne(query);
    }
    static loadByUrlAndPopulateReplyAndVideoUrlAndAccount(url, t) {
        const query = {
            where: {
                url
            },
            include: [
                {
                    attributes: ['id', 'url'],
                    model: video_1.VideoModel.unscoped()
                }
            ]
        };
        if (t !== undefined)
            query.transaction = t;
        return VideoCommentModel_1.scope([ScopeNames.WITH_IN_REPLY_TO, ScopeNames.WITH_ACCOUNT]).findOne(query);
    }
    static listCommentsForApi(parameters) {
        const { start, count, sort, isLocal, search, searchAccount, searchVideo } = parameters;
        const where = {
            deletedAt: null
        };
        const whereAccount = {};
        const whereActor = {};
        const whereVideo = {};
        if (isLocal === true) {
            Object.assign(whereActor, {
                serverId: null
            });
        }
        else if (isLocal === false) {
            Object.assign(whereActor, {
                serverId: {
                    [sequelize_1.Op.ne]: null
                }
            });
        }
        if (search) {
            Object.assign(where, {
                [sequelize_1.Op.or]: [
                    utils_1.searchAttribute(search, 'text'),
                    utils_1.searchAttribute(search, '$Account.Actor.preferredUsername$'),
                    utils_1.searchAttribute(search, '$Account.name$'),
                    utils_1.searchAttribute(search, '$Video.name$')
                ]
            });
        }
        if (searchAccount) {
            Object.assign(whereActor, {
                [sequelize_1.Op.or]: [
                    utils_1.searchAttribute(searchAccount, '$Account.Actor.preferredUsername$'),
                    utils_1.searchAttribute(searchAccount, '$Account.name$')
                ]
            });
        }
        if (searchVideo) {
            Object.assign(whereVideo, utils_1.searchAttribute(searchVideo, 'name'));
        }
        const query = {
            offset: start,
            limit: count,
            order: utils_1.getCommentSort(sort),
            where,
            include: [
                {
                    model: account_1.AccountModel.unscoped(),
                    required: true,
                    where: whereAccount,
                    include: [
                        {
                            attributes: {
                                exclude: actor_2.unusedActorAttributesForAPI
                            },
                            model: actor_2.ActorModel,
                            required: true,
                            where: whereActor
                        }
                    ]
                },
                {
                    model: video_1.VideoModel.unscoped(),
                    required: true,
                    where: whereVideo
                }
            ]
        };
        return VideoCommentModel_1
            .findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows };
        });
    }
    static listThreadsForApi(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { videoId, isVideoOwned, start, count, sort, user } = parameters;
            const blockerAccountIds = yield VideoCommentModel_1.buildBlockerAccountIds({ videoId, user, isVideoOwned });
            const accountBlockedWhere = {
                accountId: {
                    [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(' + utils_1.buildBlockedAccountSQL(blockerAccountIds) + ')')
                }
            };
            const queryList = {
                offset: start,
                limit: count,
                order: utils_1.getCommentSort(sort),
                where: {
                    [sequelize_1.Op.and]: [
                        {
                            videoId
                        },
                        {
                            inReplyToCommentId: null
                        },
                        {
                            [sequelize_1.Op.or]: [
                                accountBlockedWhere,
                                {
                                    accountId: null
                                }
                            ]
                        }
                    ]
                }
            };
            const scopesList = [
                ScopeNames.WITH_ACCOUNT_FOR_API,
                {
                    method: [ScopeNames.ATTRIBUTES_FOR_API, blockerAccountIds]
                }
            ];
            const queryCount = {
                where: Object.assign({ videoId, deletedAt: null }, accountBlockedWhere)
            };
            return Promise.all([
                VideoCommentModel_1.scope(scopesList).findAndCountAll(queryList),
                VideoCommentModel_1.count(queryCount)
            ]).then(([{ rows, count }, totalNotDeletedComments]) => {
                return { total: count, data: rows, totalNotDeletedComments };
            });
        });
    }
    static listThreadCommentsForApi(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { videoId, threadId, user, isVideoOwned } = parameters;
            const blockerAccountIds = yield VideoCommentModel_1.buildBlockerAccountIds({ videoId, user, isVideoOwned });
            const query = {
                order: [['createdAt', 'ASC'], ['updatedAt', 'ASC']],
                where: {
                    videoId,
                    [sequelize_1.Op.and]: [
                        {
                            [sequelize_1.Op.or]: [
                                { id: threadId },
                                { originCommentId: threadId }
                            ]
                        },
                        {
                            [sequelize_1.Op.or]: [
                                {
                                    accountId: {
                                        [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(' + utils_1.buildBlockedAccountSQL(blockerAccountIds) + ')')
                                    }
                                },
                                {
                                    accountId: null
                                }
                            ]
                        }
                    ]
                }
            };
            const scopes = [
                ScopeNames.WITH_ACCOUNT_FOR_API,
                {
                    method: [ScopeNames.ATTRIBUTES_FOR_API, blockerAccountIds]
                }
            ];
            return VideoCommentModel_1.scope(scopes)
                .findAndCountAll(query)
                .then(({ rows, count }) => {
                return { total: count, data: rows };
            });
        });
    }
    static listThreadParentComments(comment, t, order = 'ASC') {
        const query = {
            order: [['createdAt', order]],
            where: {
                id: {
                    [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(' +
                        'WITH RECURSIVE children (id, "inReplyToCommentId") AS ( ' +
                        `SELECT id, "inReplyToCommentId" FROM "videoComment" WHERE id = ${comment.id} ` +
                        'UNION ' +
                        'SELECT "parent"."id", "parent"."inReplyToCommentId" FROM "videoComment" "parent" ' +
                        'INNER JOIN "children" ON "children"."inReplyToCommentId" = "parent"."id"' +
                        ') ' +
                        'SELECT id FROM children' +
                        ')'),
                    [sequelize_1.Op.ne]: comment.id
                }
            },
            transaction: t
        };
        return VideoCommentModel_1
            .scope([ScopeNames.WITH_ACCOUNT])
            .findAll(query);
    }
    static listAndCountByVideoForAP(video, start, count, t) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const blockerAccountIds = yield VideoCommentModel_1.buildBlockerAccountIds({
                videoId: video.id,
                isVideoOwned: video.isOwned()
            });
            const query = {
                order: [['createdAt', 'ASC']],
                offset: start,
                limit: count,
                where: {
                    videoId: video.id,
                    accountId: {
                        [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(' + utils_1.buildBlockedAccountSQL(blockerAccountIds) + ')')
                    }
                },
                transaction: t
            };
            return VideoCommentModel_1.findAndCountAll(query);
        });
    }
    static listForFeed(parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const serverActor = yield application_1.getServerActor();
            const { start, count, videoId, accountId, videoChannelId } = parameters;
            const whereAnd = utils_1.buildBlockedAccountSQLOptimized('"VideoCommentModel"."accountId"', [serverActor.Account.id, '"Video->VideoChannel"."accountId"']);
            if (accountId) {
                whereAnd.push({
                    [sequelize_1.Op.eq]: accountId
                });
            }
            const accountWhere = {
                [sequelize_1.Op.and]: whereAnd
            };
            const videoChannelWhere = videoChannelId ? { id: videoChannelId } : undefined;
            const query = {
                order: [['createdAt', 'DESC']],
                offset: start,
                limit: count,
                where: {
                    deletedAt: null,
                    accountId: accountWhere
                },
                include: [
                    {
                        attributes: ['name', 'uuid'],
                        model: video_1.VideoModel.unscoped(),
                        required: true,
                        where: {
                            privacy: 1
                        },
                        include: [
                            {
                                attributes: ['accountId'],
                                model: video_channel_1.VideoChannelModel.unscoped(),
                                required: true,
                                where: videoChannelWhere
                            }
                        ]
                    }
                ]
            };
            if (videoId)
                query.where['videoId'] = videoId;
            return VideoCommentModel_1
                .scope([ScopeNames.WITH_ACCOUNT])
                .findAll(query);
        });
    }
    static listForBulkDelete(ofAccount, filter = {}) {
        const accountWhere = filter.onVideosOfAccount
            ? { id: filter.onVideosOfAccount.id }
            : {};
        const query = {
            limit: 1000,
            where: {
                deletedAt: null,
                accountId: ofAccount.id
            },
            include: [
                {
                    model: video_1.VideoModel,
                    required: true,
                    include: [
                        {
                            model: video_channel_1.VideoChannelModel,
                            required: true,
                            include: [
                                {
                                    model: account_1.AccountModel,
                                    required: true,
                                    where: accountWhere
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        return VideoCommentModel_1
            .scope([ScopeNames.WITH_ACCOUNT])
            .findAll(query);
    }
    static getStats() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const totalLocalVideoComments = yield VideoCommentModel_1.count({
                include: [
                    {
                        model: account_1.AccountModel,
                        required: true,
                        include: [
                            {
                                model: actor_2.ActorModel,
                                required: true,
                                where: {
                                    serverId: null
                                }
                            }
                        ]
                    }
                ]
            });
            const totalVideoComments = yield VideoCommentModel_1.count();
            return {
                totalLocalVideoComments,
                totalVideoComments
            };
        });
    }
    static listRemoteCommentUrlsOfLocalVideos() {
        const query = `SELECT "videoComment".url FROM "videoComment" ` +
            `INNER JOIN account ON account.id = "videoComment"."accountId" ` +
            `INNER JOIN actor ON actor.id = "account"."actorId" AND actor."serverId" IS NOT NULL ` +
            `INNER JOIN video ON video.id = "videoComment"."videoId" AND video.remote IS FALSE`;
        return VideoCommentModel_1.sequelize.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true
        }).then(rows => rows.map(r => r.url));
    }
    static cleanOldCommentsOf(videoId, beforeUpdatedAt) {
        const query = {
            where: {
                updatedAt: {
                    [sequelize_1.Op.lt]: beforeUpdatedAt
                },
                videoId,
                accountId: {
                    [sequelize_1.Op.notIn]: utils_1.buildLocalAccountIdsIn()
                },
                deletedAt: null
            }
        };
        return VideoCommentModel_1.destroy(query);
    }
    getCommentStaticPath() {
        return this.Video.getWatchStaticPath() + ';threadId=' + this.getThreadId();
    }
    getThreadId() {
        return this.originCommentId || this.id;
    }
    isOwned() {
        if (!this.Account) {
            return false;
        }
        return this.Account.isOwned();
    }
    isDeleted() {
        return this.deletedAt !== null;
    }
    extractMentions() {
        let result = [];
        const localMention = `@(${actor_1.actorNameAlphabet}+)`;
        const remoteMention = `${localMention}@${constants_1.WEBSERVER.HOST}`;
        const mentionRegex = this.isOwned()
            ? '(?:(?:' + remoteMention + ')|(?:' + localMention + '))'
            : '(?:' + remoteMention + ')';
        const firstMentionRegex = new RegExp(`^${mentionRegex} `, 'g');
        const endMentionRegex = new RegExp(` ${mentionRegex}$`, 'g');
        const remoteMentionsRegex = new RegExp(' ' + remoteMention + ' ', 'g');
        result = result.concat(regexp_1.regexpCapture(this.text, firstMentionRegex)
            .map(([, username1, username2]) => username1 || username2), regexp_1.regexpCapture(this.text, endMentionRegex)
            .map(([, username1, username2]) => username1 || username2), regexp_1.regexpCapture(this.text, remoteMentionsRegex)
            .map(([, username]) => username));
        if (this.isOwned()) {
            const localMentionsRegex = new RegExp(' ' + localMention + ' ', 'g');
            result = result.concat(regexp_1.regexpCapture(this.text, localMentionsRegex)
                .map(([, username]) => username));
        }
        return lodash_1.uniq(result);
    }
    toFormattedJSON() {
        return {
            id: this.id,
            url: this.url,
            text: this.text,
            threadId: this.getThreadId(),
            inReplyToCommentId: this.inReplyToCommentId || null,
            videoId: this.videoId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            isDeleted: this.isDeleted(),
            totalRepliesFromVideoAuthor: this.get('totalRepliesFromVideoAuthor') || 0,
            totalReplies: this.get('totalReplies') || 0,
            account: this.Account
                ? this.Account.toFormattedJSON()
                : null
        };
    }
    toFormattedAdminJSON() {
        return {
            id: this.id,
            url: this.url,
            text: this.text,
            threadId: this.getThreadId(),
            inReplyToCommentId: this.inReplyToCommentId || null,
            videoId: this.videoId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            video: {
                id: this.Video.id,
                uuid: this.Video.uuid,
                name: this.Video.name
            },
            account: this.Account
                ? this.Account.toFormattedJSON()
                : null
        };
    }
    toActivityPubObject(threadParentComments) {
        let inReplyTo;
        if (this.inReplyToCommentId === null) {
            inReplyTo = this.Video.url;
        }
        else {
            inReplyTo = this.InReplyToVideoComment.url;
        }
        if (this.isDeleted()) {
            return {
                id: this.url,
                type: 'Tombstone',
                formerType: 'Note',
                inReplyTo,
                published: this.createdAt.toISOString(),
                updated: this.updatedAt.toISOString(),
                deleted: this.deletedAt.toISOString()
            };
        }
        const tag = [];
        for (const parentComment of threadParentComments) {
            if (!parentComment.Account)
                continue;
            const actor = parentComment.Account.Actor;
            tag.push({
                type: 'Mention',
                href: actor.url,
                name: `@${actor.preferredUsername}@${actor.getHost()}`
            });
        }
        return {
            type: 'Note',
            id: this.url,
            content: this.text,
            inReplyTo,
            updated: this.updatedAt.toISOString(),
            published: this.createdAt.toISOString(),
            url: this.url,
            attributedTo: this.Account.Actor.url,
            tag
        };
    }
    static buildBlockerAccountIds(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { videoId, user, isVideoOwned } = options;
            const serverActor = yield application_1.getServerActor();
            const blockerAccountIds = [serverActor.Account.id];
            if (user)
                blockerAccountIds.push(user.Account.id);
            if (isVideoOwned) {
                const videoOwnerAccount = yield account_1.AccountModel.loadAccountIdFromVideo(videoId);
                blockerAccountIds.push(videoOwnerAccount.id);
            }
            return blockerAccountIds;
        });
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoCommentModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoCommentModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DATE),
    tslib_1.__metadata("design:type", Date)
], VideoCommentModel.prototype, "deletedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoCommentUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'url')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS.URL.max)),
    tslib_1.__metadata("design:type", String)
], VideoCommentModel.prototype, "url", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    tslib_1.__metadata("design:type", String)
], VideoCommentModel.prototype, "text", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => VideoCommentModel_1),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoCommentModel.prototype, "originCommentId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => VideoCommentModel_1, {
        foreignKey: {
            name: 'originCommentId',
            allowNull: true
        },
        as: 'OriginVideoComment',
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", VideoCommentModel)
], VideoCommentModel.prototype, "OriginVideoComment", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => VideoCommentModel_1),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoCommentModel.prototype, "inReplyToCommentId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => VideoCommentModel_1, {
        foreignKey: {
            name: 'inReplyToCommentId',
            allowNull: true
        },
        as: 'InReplyToVideoComment',
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", VideoCommentModel)
], VideoCommentModel.prototype, "InReplyToVideoComment", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoCommentModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoCommentModel.prototype, "Video", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoCommentModel.prototype, "accountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], VideoCommentModel.prototype, "Account", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasMany(() => video_comment_abuse_1.VideoCommentAbuseModel, {
        foreignKey: {
            name: 'videoCommentId',
            allowNull: true
        },
        onDelete: 'set null'
    }),
    tslib_1.__metadata("design:type", Array)
], VideoCommentModel.prototype, "CommentAbuses", void 0);
VideoCommentModel = VideoCommentModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.ATTRIBUTES_FOR_API]: (blockerAccountIds) => {
            return {
                attributes: {
                    include: [
                        [
                            sequelize_1.Sequelize.literal('(' +
                                'WITH "blocklist" AS (' + utils_1.buildBlockedAccountSQL(blockerAccountIds) + ')' +
                                'SELECT COUNT("replies"."id") - (' +
                                'SELECT COUNT("replies"."id") ' +
                                'FROM "videoComment" AS "replies" ' +
                                'WHERE "replies"."originCommentId" = "VideoCommentModel"."id" ' +
                                'AND "accountId" IN (SELECT "id" FROM "blocklist")' +
                                ')' +
                                'FROM "videoComment" AS "replies" ' +
                                'WHERE "replies"."originCommentId" = "VideoCommentModel"."id" ' +
                                'AND "accountId" NOT IN (SELECT "id" FROM "blocklist")' +
                                ')'),
                            'totalReplies'
                        ],
                        [
                            sequelize_1.Sequelize.literal('(' +
                                'SELECT COUNT("replies"."id") ' +
                                'FROM "videoComment" AS "replies" ' +
                                'INNER JOIN "video" ON "video"."id" = "replies"."videoId" ' +
                                'INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId" ' +
                                'WHERE "replies"."originCommentId" = "VideoCommentModel"."id" ' +
                                'AND "replies"."accountId" = "videoChannel"."accountId"' +
                                ')'),
                            'totalRepliesFromVideoAuthor'
                        ]
                    ]
                }
            };
        },
        [ScopeNames.WITH_ACCOUNT]: {
            include: [
                {
                    model: account_1.AccountModel
                }
            ]
        },
        [ScopeNames.WITH_ACCOUNT_FOR_API]: {
            include: [
                {
                    model: account_1.AccountModel.unscoped(),
                    include: [
                        {
                            attributes: {
                                exclude: actor_2.unusedActorAttributesForAPI
                            },
                            model: actor_2.ActorModel,
                            required: true
                        }
                    ]
                }
            ]
        },
        [ScopeNames.WITH_IN_REPLY_TO]: {
            include: [
                {
                    model: VideoCommentModel_1,
                    as: 'InReplyToVideoComment'
                }
            ]
        },
        [ScopeNames.WITH_VIDEO]: {
            include: [
                {
                    model: video_1.VideoModel,
                    required: true,
                    include: [
                        {
                            model: video_channel_1.VideoChannelModel,
                            required: true,
                            include: [
                                {
                                    model: account_1.AccountModel,
                                    required: true
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoComment',
        indexes: [
            {
                fields: ['videoId']
            },
            {
                fields: ['videoId', 'originCommentId']
            },
            {
                fields: ['url'],
                unique: true
            },
            {
                fields: ['accountId']
            },
            {
                fields: [
                    { name: 'createdAt', order: 'DESC' }
                ]
            }
        ]
    })
], VideoCommentModel);
exports.VideoCommentModel = VideoCommentModel;
