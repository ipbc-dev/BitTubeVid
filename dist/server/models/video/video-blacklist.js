"use strict";
var VideoBlacklistModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoBlacklistModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const video_blacklist_1 = require("../../helpers/custom-validators/video-blacklist");
const constants_1 = require("../../initializers/constants");
const utils_1 = require("../utils");
const thumbnail_1 = require("./thumbnail");
const video_1 = require("./video");
const video_channel_1 = require("./video-channel");
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
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('VideoBlacklistReason', value => utils_1.throwIfNotValid(value, video_blacklist_1.isVideoBlacklistReasonValid, 'reason', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_BLACKLIST.REASON.max)),
    tslib_1.__metadata("design:type", String)
], VideoBlacklistModel.prototype, "reason", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], VideoBlacklistModel.prototype, "unfederated", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoBlacklistType', value => utils_1.throwIfNotValid(value, video_blacklist_1.isVideoBlacklistTypeValid, 'type')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoBlacklistModel.prototype, "type", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoBlacklistModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoBlacklistModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoBlacklistModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoBlacklistModel.prototype, "Video", void 0);
VideoBlacklistModel = VideoBlacklistModel_1 = tslib_1.__decorate([
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
