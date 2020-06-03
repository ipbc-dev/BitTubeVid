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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var VideoFileModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const videos_1 = require("../../helpers/custom-validators/videos");
const utils_1 = require("../utils");
const video_1 = require("./video");
const video_redundancy_1 = require("../redundancy/video-redundancy");
const video_streaming_playlist_1 = require("./video-streaming-playlist");
const sequelize_1 = require("sequelize");
const constants_1 = require("../../initializers/constants");
const memoizee = require("memoizee");
const validator_1 = require("validator");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_VIDEO"] = "WITH_VIDEO";
    ScopeNames["WITH_METADATA"] = "WITH_METADATA";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let VideoFileModel = VideoFileModel_1 = class VideoFileModel extends sequelize_typescript_1.Model {
    static doesInfohashExist(infoHash) {
        const query = 'SELECT 1 FROM "videoFile" WHERE "infoHash" = $infoHash LIMIT 1';
        const options = {
            type: sequelize_1.QueryTypes.SELECT,
            bind: { infoHash },
            raw: true
        };
        return video_1.VideoModel.sequelize.query(query, options)
            .then(results => results.length === 1);
    }
    static doesVideoExistForVideoFile(id, videoIdOrUUID) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoFile = yield VideoFileModel_1.loadWithVideoOrPlaylist(id, videoIdOrUUID);
            return !!videoFile;
        });
    }
    static loadWithMetadata(id) {
        return VideoFileModel_1.scope(ScopeNames.WITH_METADATA).findByPk(id);
    }
    static loadWithVideo(id) {
        return VideoFileModel_1.scope(ScopeNames.WITH_VIDEO).findByPk(id);
    }
    static loadWithVideoOrPlaylist(id, videoIdOrUUID) {
        const whereVideo = validator_1.default.isUUID(videoIdOrUUID + '')
            ? { uuid: videoIdOrUUID }
            : { id: videoIdOrUUID };
        const options = {
            where: {
                id
            },
            include: [
                {
                    model: video_1.VideoModel.unscoped(),
                    required: false,
                    where: whereVideo
                },
                {
                    model: video_streaming_playlist_1.VideoStreamingPlaylistModel.unscoped(),
                    required: false,
                    include: [
                        {
                            model: video_1.VideoModel.unscoped(),
                            required: true,
                            where: whereVideo
                        }
                    ]
                }
            ]
        };
        return VideoFileModel_1.findOne(options)
            .then(file => {
            if (!file.Video && !file.VideoStreamingPlaylist)
                return null;
            return file;
        });
    }
    static listByStreamingPlaylist(streamingPlaylistId, transaction) {
        const query = {
            include: [
                {
                    model: video_1.VideoModel.unscoped(),
                    required: true,
                    include: [
                        {
                            model: video_streaming_playlist_1.VideoStreamingPlaylistModel.unscoped(),
                            required: true,
                            where: {
                                id: streamingPlaylistId
                            }
                        }
                    ]
                }
            ],
            transaction
        };
        return VideoFileModel_1.findAll(query);
    }
    static getStats() {
        const query = {
            include: [
                {
                    attributes: [],
                    model: video_1.VideoModel.unscoped(),
                    where: {
                        remote: false
                    }
                }
            ]
        };
        return VideoFileModel_1.aggregate('size', 'SUM', query)
            .then(result => ({
            totalLocalVideoFilesSize: utils_1.parseAggregateResult(result)
        }));
    }
    static customUpsert(videoFile, mode, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseWhere = {
                fps: videoFile.fps,
                resolution: videoFile.resolution
            };
            if (mode === 'streaming-playlist')
                Object.assign(baseWhere, { videoStreamingPlaylistId: videoFile.videoStreamingPlaylistId });
            else
                Object.assign(baseWhere, { videoId: videoFile.videoId });
            const element = yield VideoFileModel_1.findOne({ where: baseWhere, transaction });
            if (!element)
                return videoFile.save({ transaction });
            for (const k of Object.keys(videoFile.toJSON())) {
                element[k] = videoFile[k];
            }
            return element.save({ transaction });
        });
    }
    getVideoOrStreamingPlaylist() {
        if (this.videoId)
            return this.Video;
        return this.VideoStreamingPlaylist;
    }
    isAudio() {
        return !!constants_1.MIMETYPES.AUDIO.EXT_MIMETYPE[this.extname];
    }
    hasSameUniqueKeysThan(other) {
        return this.fps === other.fps &&
            this.resolution === other.resolution &&
            ((this.videoId !== null && this.videoId === other.videoId) ||
                (this.videoStreamingPlaylistId !== null && this.videoStreamingPlaylistId === other.videoStreamingPlaylistId));
    }
};
VideoFileModel.doesInfohashExistCached = memoizee(VideoFileModel_1.doesInfohashExist, {
    promise: true,
    max: constants_1.MEMOIZE_LENGTH.INFO_HASH_EXISTS,
    maxAge: constants_1.MEMOIZE_TTL.INFO_HASH_EXISTS
});
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoFileModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoFileModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoFileResolution', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileResolutionValid, 'resolution')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoFileModel.prototype, "resolution", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoFileSize', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileSizeValid, 'size')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], VideoFileModel.prototype, "size", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoFileExtname', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileExtnameValid, 'extname')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoFileModel.prototype, "extname", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoFileInfohash', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileInfoHashValid, 'info hash')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoFileModel.prototype, "infoHash", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(-1),
    sequelize_typescript_1.Is('VideoFileFPS', value => utils_1.throwIfNotValid(value, videos_1.isVideoFPSResolutionValid, 'fps')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoFileModel.prototype, "fps", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.JSONB),
    __metadata("design:type", Object)
], VideoFileModel.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoFileModel.prototype, "metadataUrl", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoFileModel.prototype, "videoId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", video_1.VideoModel)
], VideoFileModel.prototype, "Video", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_streaming_playlist_1.VideoStreamingPlaylistModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoFileModel.prototype, "videoStreamingPlaylistId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_streaming_playlist_1.VideoStreamingPlaylistModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", video_streaming_playlist_1.VideoStreamingPlaylistModel)
], VideoFileModel.prototype, "VideoStreamingPlaylist", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_redundancy_1.VideoRedundancyModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE',
        hooks: true
    }),
    __metadata("design:type", Array)
], VideoFileModel.prototype, "RedundancyVideos", void 0);
VideoFileModel = VideoFileModel_1 = __decorate([
    sequelize_typescript_1.DefaultScope(() => ({
        attributes: {
            exclude: ['metadata']
        }
    })),
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_VIDEO]: {
            include: [
                {
                    model: video_1.VideoModel.unscoped(),
                    required: true
                }
            ]
        },
        [ScopeNames.WITH_METADATA]: {
            attributes: {
                include: ['metadata']
            }
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoFile',
        indexes: [
            {
                fields: ['videoId'],
                where: {
                    videoId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['videoStreamingPlaylistId'],
                where: {
                    videoStreamingPlaylistId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['infoHash']
            },
            {
                fields: ['videoId', 'resolution', 'fps'],
                unique: true,
                where: {
                    videoId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            },
            {
                fields: ['videoStreamingPlaylistId', 'resolution', 'fps'],
                unique: true,
                where: {
                    videoStreamingPlaylistId: {
                        [sequelize_1.Op.ne]: null
                    }
                }
            }
        ]
    })
], VideoFileModel);
exports.VideoFileModel = VideoFileModel;
