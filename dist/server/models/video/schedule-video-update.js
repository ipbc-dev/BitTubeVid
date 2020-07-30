"use strict";
var ScheduleVideoUpdateModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleVideoUpdateModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const video_1 = require("./video");
const sequelize_1 = require("sequelize");
let ScheduleVideoUpdateModel = ScheduleVideoUpdateModel_1 = class ScheduleVideoUpdateModel extends sequelize_typescript_1.Model {
    static areVideosToUpdate() {
        const query = {
            logging: false,
            attributes: ['id'],
            where: {
                updateAt: {
                    [sequelize_1.Op.lte]: new Date()
                }
            }
        };
        return ScheduleVideoUpdateModel_1.findOne(query)
            .then(res => !!res);
    }
    static listVideosToUpdate(t) {
        const query = {
            where: {
                updateAt: {
                    [sequelize_1.Op.lte]: new Date()
                }
            },
            include: [
                {
                    model: video_1.VideoModel.scope([
                        video_1.ScopeNames.WITH_WEBTORRENT_FILES,
                        video_1.ScopeNames.WITH_STREAMING_PLAYLISTS,
                        video_1.ScopeNames.WITH_ACCOUNT_DETAILS,
                        video_1.ScopeNames.WITH_BLACKLISTED,
                        video_1.ScopeNames.WITH_THUMBNAILS,
                        video_1.ScopeNames.WITH_TAGS
                    ])
                }
            ],
            transaction: t
        };
        return ScheduleVideoUpdateModel_1.findAll(query);
    }
    static deleteByVideoId(videoId, t) {
        const query = {
            where: {
                videoId
            },
            transaction: t
        };
        return ScheduleVideoUpdateModel_1.destroy(query);
    }
    toFormattedJSON() {
        return {
            updateAt: this.updateAt,
            privacy: this.privacy || undefined
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Date)
], ScheduleVideoUpdateModel.prototype, "updateAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], ScheduleVideoUpdateModel.prototype, "privacy", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], ScheduleVideoUpdateModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], ScheduleVideoUpdateModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], ScheduleVideoUpdateModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], ScheduleVideoUpdateModel.prototype, "Video", void 0);
ScheduleVideoUpdateModel = ScheduleVideoUpdateModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'scheduleVideoUpdate',
        indexes: [
            {
                fields: ['videoId'],
                unique: true
            },
            {
                fields: ['updateAt']
            }
        ]
    })
], ScheduleVideoUpdateModel);
exports.ScheduleVideoUpdateModel = ScheduleVideoUpdateModel;
