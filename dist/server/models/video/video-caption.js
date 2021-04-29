"use strict";
var VideoCaptionModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCaptionModel = exports.ScopeNames = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const sequelize_typescript_1 = require("sequelize-typescript");
const uuid_1 = require("uuid");
const video_captions_1 = require("../../helpers/custom-validators/video-captions");
const logger_1 = require("../../helpers/logger");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const utils_1 = require("../utils");
const video_1 = require("./video");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_VIDEO_UUID_AND_REMOTE"] = "WITH_VIDEO_UUID_AND_REMOTE";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let VideoCaptionModel = VideoCaptionModel_1 = class VideoCaptionModel extends sequelize_typescript_1.Model {
    static removeFiles(instance) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!instance.Video) {
                instance.Video = yield instance.$get('Video');
            }
            if (instance.isOwned()) {
                logger_1.logger.info('Removing caption %s.', instance.filename);
                try {
                    yield instance.removeCaptionFile();
                }
                catch (err) {
                    logger_1.logger.error('Cannot remove caption file %s.', instance.filename);
                }
            }
            return undefined;
        });
    }
    static loadByVideoIdAndLanguage(videoId, language) {
        const videoInclude = {
            model: video_1.VideoModel.unscoped(),
            attributes: ['id', 'remote', 'uuid'],
            where: utils_1.buildWhereIdOrUUID(videoId)
        };
        const query = {
            where: {
                language
            },
            include: [
                videoInclude
            ]
        };
        return VideoCaptionModel_1.findOne(query);
    }
    static loadWithVideoByFilename(filename) {
        const query = {
            where: {
                filename
            },
            include: [
                {
                    model: video_1.VideoModel.unscoped(),
                    attributes: ['id', 'remote', 'uuid']
                }
            ]
        };
        return VideoCaptionModel_1.findOne(query);
    }
    static insertOrReplaceLanguage(caption, transaction) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const existing = yield VideoCaptionModel_1.loadByVideoIdAndLanguage(caption.videoId, caption.language);
            if (existing)
                yield existing.destroy({ transaction });
            return caption.save({ transaction });
        });
    }
    static listVideoCaptions(videoId) {
        const query = {
            order: [['language', 'ASC']],
            where: {
                videoId
            }
        };
        return VideoCaptionModel_1.scope(ScopeNames.WITH_VIDEO_UUID_AND_REMOTE).findAll(query);
    }
    static getLanguageLabel(language) {
        return constants_1.VIDEO_LANGUAGES[language] || 'Unknown';
    }
    static deleteAllCaptionsOfRemoteVideo(videoId, transaction) {
        const query = {
            where: {
                videoId
            },
            transaction
        };
        return VideoCaptionModel_1.destroy(query);
    }
    static generateCaptionName(language) {
        return `${uuid_1.v4()}-${language}.vtt`;
    }
    isOwned() {
        return this.Video.remote === false;
    }
    toFormattedJSON() {
        return {
            language: {
                id: this.language,
                label: VideoCaptionModel_1.getLanguageLabel(this.language)
            },
            captionPath: this.getCaptionStaticPath()
        };
    }
    getCaptionStaticPath() {
        return path_1.join(constants_1.LAZY_STATIC_PATHS.VIDEO_CAPTIONS, this.filename);
    }
    removeCaptionFile() {
        return fs_extra_1.remove(config_1.CONFIG.STORAGE.CAPTIONS_DIR + this.filename);
    }
    getFileUrl(video) {
        if (!this.Video)
            this.Video = video;
        if (video.isOwned())
            return constants_1.WEBSERVER.URL + this.getCaptionStaticPath();
        return this.fileUrl;
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoCaptionModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoCaptionModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoCaptionLanguage', value => utils_1.throwIfNotValid(value, video_captions_1.isVideoCaptionLanguageValid, 'language')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], VideoCaptionModel.prototype, "language", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], VideoCaptionModel.prototype, "filename", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.COMMONS.URL.max)),
    tslib_1.__metadata("design:type", String)
], VideoCaptionModel.prototype, "fileUrl", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoCaptionModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoCaptionModel.prototype, "Video", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BeforeDestroy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [VideoCaptionModel]),
    tslib_1.__metadata("design:returntype", Promise)
], VideoCaptionModel, "removeFiles", null);
VideoCaptionModel = VideoCaptionModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_VIDEO_UUID_AND_REMOTE]: {
            include: [
                {
                    attributes: ['id', 'uuid', 'remote'],
                    model: video_1.VideoModel.unscoped(),
                    required: true
                }
            ]
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoCaption',
        indexes: [
            {
                fields: ['filename'],
                unique: true
            },
            {
                fields: ['videoId']
            },
            {
                fields: ['videoId', 'language'],
                unique: true
            }
        ]
    })
], VideoCaptionModel);
exports.VideoCaptionModel = VideoCaptionModel;
