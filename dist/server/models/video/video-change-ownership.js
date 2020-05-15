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
var VideoChangeOwnershipModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const account_1 = require("../account/account");
const video_1 = require("./video");
const videos_1 = require("../../../shared/models/videos");
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
            video: {
                id: this.Video.id,
                uuid: this.Video.uuid,
                url: this.Video.url,
                name: this.Video.name
            },
            createdAt: this.createdAt
        };
    }
};
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoChangeOwnershipModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoChangeOwnershipModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoChangeOwnershipModel.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoChangeOwnershipModel.prototype, "initiatorAccountId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'initiatorAccountId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", account_1.AccountModel)
], VideoChangeOwnershipModel.prototype, "Initiator", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoChangeOwnershipModel.prototype, "nextOwnerAccountId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            name: 'nextOwnerAccountId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", account_1.AccountModel)
], VideoChangeOwnershipModel.prototype, "NextOwner", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoChangeOwnershipModel.prototype, "videoId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", video_1.VideoModel)
], VideoChangeOwnershipModel.prototype, "Video", void 0);
VideoChangeOwnershipModel = VideoChangeOwnershipModel_1 = __decorate([
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
                        video_1.ScopeNames.WITH_STREAMING_PLAYLISTS
                    ]),
                    required: true
                }
            ]
        }
    }))
], VideoChangeOwnershipModel);
exports.VideoChangeOwnershipModel = VideoChangeOwnershipModel;
