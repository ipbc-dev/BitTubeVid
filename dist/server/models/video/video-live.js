"use strict";
var VideoLiveModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoLiveModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const constants_1 = require("@server/initializers/constants");
const video_1 = require("./video");
const video_blacklist_1 = require("./video-blacklist");
let VideoLiveModel = VideoLiveModel_1 = class VideoLiveModel extends sequelize_typescript_1.Model {
    static loadByStreamKey(streamKey) {
        const query = {
            where: {
                streamKey
            },
            include: [
                {
                    model: video_1.VideoModel.unscoped(),
                    required: true,
                    where: {
                        state: 4
                    },
                    include: [
                        {
                            model: video_blacklist_1.VideoBlacklistModel.unscoped(),
                            required: false
                        }
                    ]
                }
            ]
        };
        return VideoLiveModel_1.findOne(query);
    }
    static loadByVideoId(videoId) {
        const query = {
            where: {
                videoId
            }
        };
        return VideoLiveModel_1.findOne(query);
    }
    toFormattedJSON() {
        return {
            rtmpUrl: this.streamKey
                ? constants_1.WEBSERVER.RTMP_URL
                : null,
            streamKey: this.streamKey,
            permanentLive: this.permanentLive,
            saveReplay: this.saveReplay
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING),
    tslib_1.__metadata("design:type", String)
], VideoLiveModel.prototype, "streamKey", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], VideoLiveModel.prototype, "saveReplay", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], VideoLiveModel.prototype, "permanentLive", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoLiveModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoLiveModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoLiveModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoLiveModel.prototype, "Video", void 0);
VideoLiveModel = VideoLiveModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.DefaultScope(() => ({
        include: [
            {
                model: video_1.VideoModel,
                required: true,
                include: [
                    {
                        model: video_blacklist_1.VideoBlacklistModel,
                        required: false
                    }
                ]
            }
        ]
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoLive',
        indexes: [
            {
                fields: ['videoId'],
                unique: true
            }
        ]
    })
], VideoLiveModel);
exports.VideoLiveModel = VideoLiveModel;
