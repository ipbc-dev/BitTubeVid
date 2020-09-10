"use strict";
var VideoChangeOwnershipModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoChangeOwnershipModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const account_1 = require("../account/account");
const video_1 = require("./video");
const utils_1 = require("../utils");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_ACCOUNTS"] = "WITH_ACCOUNTS";
    ScopeNames["WITH_VIDEO"] = "WITH_VIDEO";
})(ScopeNames || (ScopeNames = {}));
let VideoChangeOwnershipModel = VideoChangeOwnershipModel_1 = class VideoChangeOwnershipModel extends sequelize_typescript_1.Model {
    static listForApi(nextOwnerId, start, count, sort) {
        const query = {
            offset: start,
            limit: count,
            order: utils_1.getSort(sort),
            where: {
                nextOwnerAccountId: nextOwnerId
            }
        };
        return Promise.all([
            VideoChangeOwnershipModel_1.scope(ScopeNames.WITH_ACCOUNTS).count(query),
            VideoChangeOwnershipModel_1.scope([ScopeNames.WITH_ACCOUNTS, ScopeNames.WITH_VIDEO]).findAll(query)
        ]).then(([count, rows]) => ({ total: count, data: rows }));
    }
    static load(id) {
        return VideoChangeOwnershipModel_1.scope([ScopeNames.WITH_ACCOUNTS, ScopeNames.WITH_VIDEO])
            .findByPk(id);
    }
    toFormattedJSON() {
        return {
            id: this.id,
            status: this.status,
            initiatorAccount: this.Initiator.toFormattedJSON(),
            nextOwnerAccount: this.NextOwner.toFormattedJSON(),
            video: this.Video.toFormattedJSON(),
            createdAt: this.createdAt
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoChangeOwnershipModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoChangeOwnershipModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], VideoChangeOwnershipModel.prototype, "status", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoChangeOwnershipModel.prototype, "initiatorAccountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'initiatorAccountId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], VideoChangeOwnershipModel.prototype, "Initiator", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoChangeOwnershipModel.prototype, "nextOwnerAccountId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'nextOwnerAccountId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", account_1.AccountModel)
], VideoChangeOwnershipModel.prototype, "NextOwner", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoChangeOwnershipModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoChangeOwnershipModel.prototype, "Video", void 0);
VideoChangeOwnershipModel = VideoChangeOwnershipModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'videoChangeOwnership',
        indexes: [
            {
                fields: ['videoId']
            },
            {
                fields: ['initiatorAccountId']
            },
            {
                fields: ['nextOwnerAccountId']
            }
        ]
    }),
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_ACCOUNTS]: {
            include: [
                {
                    model: account_1.AccountModel,
                    as: 'Initiator',
                    required: true
                },
                {
                    model: account_1.AccountModel,
                    as: 'NextOwner',
                    required: true
                }
            ]
        },
        [ScopeNames.WITH_VIDEO]: {
            include: [
                {
                    model: video_1.VideoModel.scope([
                        video_1.ScopeNames.WITH_THUMBNAILS,
                        video_1.ScopeNames.WITH_WEBTORRENT_FILES,
                        video_1.ScopeNames.WITH_STREAMING_PLAYLISTS,
                        video_1.ScopeNames.WITH_ACCOUNT_DETAILS
                    ]),
                    required: true
                }
            ]
        }
    }))
], VideoChangeOwnershipModel);
exports.VideoChangeOwnershipModel = VideoChangeOwnershipModel;
