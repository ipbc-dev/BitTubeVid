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
var VideoBlacklistModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const utils_1 = require("../utils");
const video_1 = require("./video");
const video_channel_1 = require("./video-channel");
const video_blacklist_1 = require("../../helpers/custom-validators/video-blacklist");
const videos_1 = require("../../../shared/models/videos");
const constants_1 = require("../../initializers/constants");
const thumbnail_1 = require("./thumbnail");
let VideoBlacklistModel = VideoBlacklistModel_1 = class VideoBlacklistModel extends sequelize_typescript_1.Model {
    static listForApi(parameters) {
        const { start, count, sort, search, type } = parameters;
        function buildBaseQuery() {
            return {
                offset: start,
                limit: count,
                order: utils_1.getBlacklistSort(sort.sortModel, sort.sortValue)
            };
        }
        const countQuery = buildBaseQuery();
        const findQuery = buildBaseQuery();
        findQuery.include = [
            {
                model: video_1.VideoModel,
                required: true,
                where: utils_1.searchAttribute(search, 'name'),
                include: [
                    {
                        model: video_channel_1.VideoChannelModel.scope({ method: [video_channel_1.ScopeNames.SUMMARY, { withAccount: true }] }),
                        required: true
                    },
                    {
                        model: thumbnail_1.ThumbnailModel,
                        attributes: ['type', 'filename'],
                        required: false
                    }
                ]
            }
        ];
        if (type) {
            countQuery.where = { type };
            findQuery.where = { type };
        }
        return Promise.all([
            VideoBlacklistModel_1.count(countQuery),
            VideoBlacklistModel_1.findAll(findQuery)
        ]).then(([count, rows]) => {
            return {
                data: rows,
                total: count
            };
        });
    }
    static loadByVideoId(id) {
        const query = {
            where: {
                videoId: id
            }
        };
        return VideoBlacklistModel_1.findOne(query);
    }
    toFormattedJSON() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            reason: this.reason,
            unfederated: this.unfederated,
            type: this.type,
            video: this.Video.toFormattedJSON()
        };
    }
};
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('VideoBlacklistReason', value => utils_1.throwIfNotValid(value, video_blacklist_1.isVideoBlacklistReasonValid, 'reason', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_BLACKLIST.REASON.max)),
    __metadata("design:type", String)
], VideoBlacklistModel.prototype, "reason", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], VideoBlacklistModel.prototype, "unfederated", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoBlacklistType', value => utils_1.throwIfNotValid(value, video_blacklist_1.isVideoBlacklistTypeValid, 'type')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoBlacklistModel.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoBlacklistModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoBlacklistModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoBlacklistModel.prototype, "videoId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", video_1.VideoModel)
], VideoBlacklistModel.prototype, "Video", void 0);
VideoBlacklistModel = VideoBlacklistModel_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: 'videoBlacklist',
        indexes: [
            {
                fields: ['videoId'],
                unique: true
            }
        ]
    })
], VideoBlacklistModel);
exports.VideoBlacklistModel = VideoBlacklistModel;
