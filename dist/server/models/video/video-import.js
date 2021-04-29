"use strict";
var VideoImportModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoImportModel = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const video_imports_1 = require("../../helpers/custom-validators/video-imports");
const videos_1 = require("../../helpers/custom-validators/videos");
const constants_1 = require("../../initializers/constants");
const user_1 = require("../account/user");
const utils_1 = require("../utils");
const video_1 = require("./video");
const database_utils_1 = require("@server/helpers/database-utils");
let VideoImportModel = VideoImportModel_1 = class VideoImportModel extends sequelize_typescript_1.Model {
    static deleteVideoIfFailed(instance, options) {
        if (instance.state === 3) {
            return database_utils_1.afterCommitIfTransaction(options.transaction, () => instance.Video.destroy());
        }
        return undefined;
    }
    static loadAndPopulateVideo(id) {
        return VideoImportModel_1.findByPk(id);
    }
    static listUserVideoImportsForApi(userId, start, count, sort) {
        const query = {
            distinct: true,
            include: [
                {
                    attributes: ['id'],
                    model: user_1.UserModel.unscoped(),
                    required: true
                }
            ],
            offset: start,
            limit: count,
            order: utils_1.getSort(sort),
            where: {
                userId
            }
        };
        return VideoImportModel_1.findAndCountAll(query)
            .then(({ rows, count }) => {
            return {
                data: rows,
                total: count
            };
        });
    }
    getTargetIdentifier() {
        return this.targetUrl || this.magnetUri || this.torrentName;
    }
    toFormattedJSON() {
        const videoFormatOptions = {
            completeDescription: true,
            additionalAttributes: { state: true, waitTranscoding: true, scheduledUpdate: true }
        };
        const video = this.Video
            ? Object.assign(this.Video.toFormattedJSON(videoFormatOptions), { tags: this.Video.Tags.map(t => t.name) })
            : undefined;
        return {
            id: this.id,
            targetUrl: this.targetUrl,
            magnetUri: this.magnetUri,
            torrentName: this.torrentName,
            state: {
                id: this.state,
                label: VideoImportModel_1.getStateLabel(this.state)
            },
            error: this.error,
            updatedAt: this.updatedAt.toISOString(),
            createdAt: this.createdAt.toISOString(),
            video
        };
    }
    static getStateLabel(id) {
        return constants_1.VIDEO_IMPORT_STATES[id] || 'Unknown';
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoImportModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoImportModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoImportTargetUrl', value => utils_1.throwIfNotValid(value, video_imports_1.isVideoImportTargetUrlValid, 'targetUrl', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_IMPORTS.URL.max)),
    tslib_1.__metadata("design:type", String)
], VideoImportModel.prototype, "targetUrl", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoImportMagnetUri', value => utils_1.throwIfNotValid(value, videos_1.isVideoMagnetUriValid, 'magnetUri', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_IMPORTS.URL.max)),
    tslib_1.__metadata("design:type", String)
], VideoImportModel.prototype, "magnetUri", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_IMPORTS.TORRENT_NAME.max)),
    tslib_1.__metadata("design:type", String)
], VideoImportModel.prototype, "torrentName", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoImportState', value => utils_1.throwIfNotValid(value, video_imports_1.isVideoImportStateValid, 'state')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoImportModel.prototype, "state", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    tslib_1.__metadata("design:type", String)
], VideoImportModel.prototype, "error", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => user_1.UserModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoImportModel.prototype, "userId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => user_1.UserModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    tslib_1.__metadata("design:type", user_1.UserModel)
], VideoImportModel.prototype, "User", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoImportModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'set null'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoImportModel.prototype, "Video", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AfterUpdate,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [VideoImportModel, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], VideoImportModel, "deleteVideoIfFailed", null);
VideoImportModel = VideoImportModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.DefaultScope(() => ({
        include: [
            {
                model: user_1.UserModel.unscoped(),
                required: true
            },
            {
                model: video_1.VideoModel.scope([
                    video_1.ScopeNames.WITH_ACCOUNT_DETAILS,
                    video_1.ScopeNames.WITH_TAGS,
                    video_1.ScopeNames.WITH_THUMBNAILS
                ]),
                required: false
            }
        ]
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoImport',
        indexes: [
            {
                fields: ['videoId'],
                unique: true
            },
            {
                fields: ['userId']
            }
        ]
    })
], VideoImportModel);
exports.VideoImportModel = VideoImportModel;
