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
var ThumbnailModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const sequelize_typescript_1 = require("sequelize-typescript");
const constants_1 = require("../../initializers/constants");
const logger_1 = require("../../helpers/logger");
const fs_extra_1 = require("fs-extra");
const config_1 = require("../../initializers/config");
const video_1 = require("./video");
const video_playlist_1 = require("./video-playlist");
const thumbnail_type_1 = require("../../../shared/models/videos/thumbnail.type");
const activitypub_1 = require("@server/helpers/activitypub");
let ThumbnailModel = ThumbnailModel_1 = class ThumbnailModel extends sequelize_typescript_1.Model {
    static removeFiles(instance) {
        logger_1.logger.info('Removing %s file %s.', ThumbnailModel_1.types[instance.type].label, instance.filename);
        instance.removeThumbnail()
            .catch(err => logger_1.logger.error('Cannot remove thumbnail file %s.', instance.filename, err));
    }
    static loadByName(filename) {
        const query = {
            where: {
                filename
            }
        };
        return ThumbnailModel_1.findOne(query);
    }
    static generateDefaultPreviewName(videoUUID) {
        return videoUUID + '.jpg';
    }
    getFileUrl(video) {
        const staticPath = ThumbnailModel_1.types[this.type].staticPath + this.filename;
        if (video.isOwned())
            return constants_1.WEBSERVER.URL + staticPath;
        if (this.fileUrl)
            return this.fileUrl;
        return activitypub_1.buildRemoteVideoBaseUrl(video, staticPath);
    }
    getPath() {
        const directory = ThumbnailModel_1.types[this.type].directory;
        return path_1.join(directory, this.filename);
    }
    removeThumbnail() {
        return fs_extra_1.remove(this.getPath());
    }
};
ThumbnailModel.types = {
    [thumbnail_type_1.ThumbnailType.MINIATURE]: {
        label: 'miniature',
        directory: config_1.CONFIG.STORAGE.THUMBNAILS_DIR,
        staticPath: constants_1.STATIC_PATHS.THUMBNAILS
    },
    [thumbnail_type_1.ThumbnailType.PREVIEW]: {
        label: 'preview',
        directory: config_1.CONFIG.STORAGE.PREVIEWS_DIR,
        staticPath: constants_1.LAZY_STATIC_PATHS.PREVIEWS
    }
};
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ThumbnailModel.prototype, "filename", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ThumbnailModel.prototype, "height", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ThumbnailModel.prototype, "width", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ThumbnailModel.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.COMMONS.URL.max)),
    __metadata("design:type", String)
], ThumbnailModel.prototype, "fileUrl", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], ThumbnailModel.prototype, "automaticallyGenerated", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ThumbnailModel.prototype, "videoId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", video_1.VideoModel)
], ThumbnailModel.prototype, "Video", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_playlist_1.VideoPlaylistModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ThumbnailModel.prototype, "videoPlaylistId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_playlist_1.VideoPlaylistModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", video_playlist_1.VideoPlaylistModel)
], ThumbnailModel.prototype, "VideoPlaylist", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], ThumbnailModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], ThumbnailModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AfterDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ThumbnailModel]),
    __metadata("design:returntype", void 0)
], ThumbnailModel, "removeFiles", null);
ThumbnailModel = ThumbnailModel_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: 'thumbnail',
        indexes: [
            {
                fields: ['videoId']
            },
            {
                fields: ['videoPlaylistId'],
                unique: true
            }
        ]
    })
], ThumbnailModel);
exports.ThumbnailModel = ThumbnailModel;
