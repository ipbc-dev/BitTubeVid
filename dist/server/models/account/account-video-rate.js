"use strict";
var AccountVideoRateModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountVideoRateModel = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const constants_1 = require("../../initializers/constants");
const actor_1 = require("../activitypub/actor");
const utils_1 = require("../utils");
const video_1 = require("../video/video");
const video_channel_1 = require("../video/video-channel");
const account_1 = require("./account");
let AccountVideoRateModel = AccountVideoRateModel_1 = class AccountVideoRateModel extends sequelize_typescript_1.Model {
    static load(accountId, videoId, transaction) {
        const options = {
            where: {
                accountId,
                videoId
            }
        };
        if (transaction)
            options.transaction = transaction;
        return AccountVideoRateModel_1.findOne(options);
    }
    static loadByAccountAndVideoOrUrl(accountId, videoId, url, t) {
        const options = {
            where: {
                [sequelize_1.Op.or]: [
                    {
                        accountId,
                        videoId
                    },
                    {
                        url
                    }
                ]
            }
        };
        if (t)
            options.transaction = t;
        return AccountVideoRateModel_1.findOne(options);
    }
    static listByAccountForApi(options) {
        const query = {
            offset: options.start,
            limit: options.count,
            order: utils_1.getSort(options.sort),
            where: {
                accountId: options.accountId
            },
            include: [
                {
                    model: video_1.VideoModel,
                    required: true,
                    include: [
                        {
                            model: video_channel_1.VideoChannelModel.scope({ method: [video_channel_1.ScopeNames.SUMMARY, { withAccount: true }] }),
                            required: true
                        }
                    ]
                }
            ]
        };
        if (options.type)
            query.where['type'] = options.type;
        return AccountVideoRateModel_1.findAndCountAll(query);
    }
    static listRemoteRateUrlsOfLocalVideos() {
        const query = `SELECT "accountVideoRate".url FROM "accountVideoRate" ` +
            `INNER JOIN account ON account.id = "accountVideoRate"."accountId" ` +
            `INNER JOIN actor ON actor.id = account."actorId" AND actor."serverId" IS NOT NULL ` +
            `INNER JOIN video ON video.id = "accountVideoRate"."videoId" AND video.remote IS FALSE`;
        return AccountVideoRateModel_1.sequelize.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true
        }).then(rows => rows.map(r => r.url));
    }
    static loadLocalAndPopulateVideo(rateType, accountName, videoId, t) {
        const options = {
            where: {
                videoId,
                type: rateType
            },
            include: [
                {
                    model: account_1.AccountModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: ['id', 'url', 'followersUrl', 'preferredUsername'],
                            model: actor_1.ActorModel.unscoped(),
                            required: true,
                            where: {
                                preferredUsername: accountName,
                                serverId: null
                            }
                        }
                    ]
                },
                {
                    model: video_1.VideoModel.unscoped(),
                    required: true
                }
            ]
        };
        if (t)
            options.transaction = t;
        return AccountVideoRateModel_1.findOne(options);
    }
    static loadByUrl(url, transaction) {
        const options = {
            where: {
                url
            }
        };
        if (transaction)
            options.transaction = transaction;
        return AccountVideoRateModel_1.findOne(options);
    }
    static listAndCountAccountUrlsByVideoId(rateType, videoId, start, count, t) {
        const query = {
            offset: start,
            limit: count,
            where: {
                videoId,
                type: rateType
            },
            transaction: t,
            include: [
                {
                    attributes: ['actorId'],
                    model: account_1.AccountModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: ['url'],
                            model: actor_1.ActorModel.unscoped(),
                            required: true
                        }
                    ]
                }
            ]
        };
        return AccountVideoRateModel_1.findAndCountAll(query);
    }
    static cleanOldRatesOf(videoId, type, beforeUpdatedAt) {
        return AccountVideoRateModel_1.sequelize.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                where: {
                    updatedAt: {
                        [sequelize_1.Op.lt]: beforeUpdatedAt
                    },
                    videoId,
                    type,
                    accountId: {
                        [sequelize_1.Op.notIn]: utils_1.buildLocalAccountIdsIn()
                    }
                },
                transaction: t
            };
            yield AccountVideoRateModel_1.destroy(query);
            return video_1.VideoModel.updateRatesOf(videoId, type, t);
        }));
    }
    toFormattedJSON() {
        return {
            video: this.Video.toFormattedJSON(),
            rating: this.type
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.ENUM(...lodash_1.values(constants_1.VIDEO_RATE_TYPES))),
    tslib_1.__metadata("design:type", String)
], AccountVideoRateModel.prototype, "type", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('AccountVideoRateUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'url')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_RATES.URL.max)),
    tslib_1.__metadata("design:type", String)
], AccountVideoRateModel.prototype, "url", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], AccountVideoRateModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], AccountVideoRateModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AccountVideoRateModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], AccountVideoRateModel.prototype, "Video", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], AccountVideoRateModel.prototype, "accountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], AccountVideoRateModel.prototype, "Account", void 0);
AccountVideoRateModel = AccountVideoRateModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'accountVideoRate',
        indexes: [
            {
                fields: ['videoId', 'accountId'],
                unique: true
            },
            {
                fields: ['videoId']
            },
            {
                fields: ['accountId']
            },
            {
                fields: ['videoId', 'type']
            },
            {
                fields: ['url'],
                unique: true
            }
        ]
    })
], AccountVideoRateModel);
exports.AccountVideoRateModel = AccountVideoRateModel;
