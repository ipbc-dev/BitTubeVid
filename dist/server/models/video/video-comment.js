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
var VideoCommentModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const constants_1 = require("../../initializers/constants");
const account_1 = require("../account/account");
const actor_1 = require("../activitypub/actor");
const utils_1 = require("../utils");
const video_1 = require("./video");
const video_channel_1 = require("./video-channel");
const actor_2 = require("../../helpers/custom-validators/activitypub/actor");
const regexp_1 = require("../../helpers/regexp");
const lodash_1 = require("lodash");
const sequelize_1 = require("sequelize");
const models_1 = require("@shared/models");
const application_1 = require("@server/models/application/application");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_ACCOUNT"] = "WITH_ACCOUNT";
    ScopeNames["WITH_IN_REPLY_TO"] = "WITH_IN_REPLY_TO";
    ScopeNames["WITH_VIDEO"] = "WITH_VIDEO";
    ScopeNames["ATTRIBUTES_FOR_API"] = "ATTRIBUTES_FOR_API";
})(ScopeNames || (ScopeNames = {}));
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
    static listThreadsForApi(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { videoId, start, count, sort, user } = parameters;
            const serverActor = yield application_1.getServerActor();
            const serverAccountId = serverActor.Account.id;
            const userAccountId = user ? user.Account.id : undefined;
            const query = {
                offset: start,
                limit: count,
                order: utils_1.getCommentSort(sort),
                where: {
                    videoId,
                    inReplyToCommentId: null,
                    accountId: {
                        [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(' + utils_1.buildBlockedAccountSQL(serverAccountId, userAccountId) + ')')
                    }
                }
            };
            const scopes = [
                ScopeNames.WITH_ACCOUNT,
                {
                    method: [ScopeNames.ATTRIBUTES_FOR_API, serverAccountId, userAccountId]
                }
            ];
            return VideoCommentModel_1
                .scope(scopes)
                .findAndCountAll(query)
                .then(({ rows, count }) => {
                return { total: count, data: rows };
            });
        });
    }
    static listThreadCommentsForApi(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { videoId, threadId, user } = parameters;
            const serverActor = yield application_1.getServerActor();
            const serverAccountId = serverActor.Account.id;
            const userAccountId = user ? user.Account.id : undefined;
            const query = {
                order: [['createdAt', 'ASC'], ['updatedAt', 'ASC']],
                where: {
                    videoId,
                    [sequelize_1.Op.or]: [
                        { id: threadId },
                        { originCommentId: threadId }
                    ],
                    accountId: {
                        [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(' + utils_1.buildBlockedAccountSQL(serverAccountId, userAccountId) + ')')
                    }
                }
            };
            const scopes = [
                ScopeNames.WITH_ACCOUNT,
                {
                    method: [ScopeNames.ATTRIBUTES_FOR_API, serverAccountId, userAccountId]
                }
            ];
            return VideoCommentModel_1
                .scope(scopes)
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
    static listAndCountByVideoId(videoId, start, count, t, order = 'ASC') {
        const query = {
            order: [['createdAt', order]],
            offset: start,
            limit: count,
            where: {
                videoId
            },
            transaction: t
        };
        return VideoCommentModel_1.findAndCountAll(query);
    }
    static listForFeed(start, count, videoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const serverActor = yield application_1.getServerActor();
            const query = {
                order: [['createdAt', 'DESC']],
                offset: start,
                limit: count,
                where: {
                    deletedAt: null,
                    accountId: {
                        [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(' + utils_1.buildBlockedAccountSQL(serverActor.Account.id) + ')')
                    }
                },
                include: [
                    {
                        attributes: ['name', 'uuid'],
                        model: video_1.VideoModel.unscoped(),
                        required: true,
                        where: {
                            privacy: models_1.VideoPrivacy.PUBLIC
                        }
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
    static getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const totalLocalVideoComments = yield VideoCommentModel_1.count({
                include: [
                    {
                        model: account_1.AccountModel,
                        required: true,
                        include: [
                            {
                                model: actor_1.ActorModel,
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
    static cleanOldCommentsOf(videoId, beforeUpdatedAt) {
        const query = {
            where: {
                updatedAt: {
                    [sequelize_1.Op.lt]: beforeUpdatedAt
                },
                videoId,
                accountId: {
                    [sequelize_1.Op.notIn]: utils_1.buildLocalAccountIdsIn()
                }
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
        const localMention = `@(${actor_2.actorNameAlphabet}+)`;
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
            threadId: this.originCommentId || this.id,
            inReplyToCommentId: this.inReplyToCommentId || null,
            videoId: this.videoId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            isDeleted: this.isDeleted(),
            totalRepliesFromVideoAuthor: this.get('totalRepliesFromVideoAuthor') || 0,
            totalReplies: this.get('totalReplies') || 0,
            account: this.Account ? this.Account.toFormattedJSON() : null
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
};
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoCommentModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoCommentModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], VideoCommentModel.prototype, "deletedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoCommentUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'url')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS.URL.max)),
    __metadata("design:type", String)
], VideoCommentModel.prototype, "url", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], VideoCommentModel.prototype, "text", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => VideoCommentModel_1),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoCommentModel.prototype, "originCommentId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => VideoCommentModel_1, {
        foreignKey: {
            name: 'originCommentId',
            allowNull: true
        },
        as: 'OriginVideoComment',
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", VideoCommentModel)
], VideoCommentModel.prototype, "OriginVideoComment", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => VideoCommentModel_1),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoCommentModel.prototype, "inReplyToCommentId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => VideoCommentModel_1, {
        foreignKey: {
            name: 'inReplyToCommentId',
            allowNull: true
        },
        as: 'InReplyToVideoComment',
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", VideoCommentModel)
], VideoCommentModel.prototype, "InReplyToVideoComment", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoCommentModel.prototype, "videoId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", video_1.VideoModel)
], VideoCommentModel.prototype, "Video", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoCommentModel.prototype, "accountId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", account_1.AccountModel)
], VideoCommentModel.prototype, "Account", void 0);
VideoCommentModel = VideoCommentModel_1 = __decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.ATTRIBUTES_FOR_API]: (serverAccountId, userAccountId) => {
            return {
                attributes: {
                    include: [
                        [
                            sequelize_1.Sequelize.literal('(' +
                                'WITH "blocklist" AS (' + utils_1.buildBlockedAccountSQL(serverAccountId, userAccountId) + ')' +
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
            }
        ]
    })
], VideoCommentModel);
exports.VideoCommentModel = VideoCommentModel;
