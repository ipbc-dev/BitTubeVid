"use strict";
var VideoFileModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoFileModel = exports.ScopeNames = void 0;
const tslib_1 = require("tslib");
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        const webtorrentFilesQuery = {
            include: [
                {
                    attributes: [],
                    required: true,
                    model: video_1.VideoModel.unscoped(),
                    where: {
                        remote: false
                    }
                }
            ]
        };
        const hlsFilesQuery = {
            include: [
                {
                    attributes: [],
                    required: true,
                    model: video_streaming_playlist_1.VideoStreamingPlaylistModel.unscoped(),
                    include: [
                        {
                            attributes: [],
                            model: video_1.VideoModel.unscoped(),
                            required: true,
                            where: {
                                remote: false
                            }
                        }
                    ]
                }
            ]
        };
        return Promise.all([
            VideoFileModel_1.aggregate('size', 'SUM', webtorrentFilesQuery),
            VideoFileModel_1.aggregate('size', 'SUM', hlsFilesQuery)
        ]).then(([webtorrentResult, hlsResult]) => ({
            totalLocalVideoFilesSize: utils_1.parseAggregateResult(webtorrentResult) + utils_1.parseAggregateResult(hlsResult)
        }));
    }
    static customUpsert(videoFile, mode, transaction) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    static removeHLSFilesOfVideoId(videoStreamingPlaylistId) {
        const options = {
            where: { videoStreamingPlaylistId }
        };
        return VideoFileModel_1.destroy(options);
    }
    getVideoOrStreamingPlaylist() {
        if (this.videoId)
            return this.Video;
        return this.VideoStreamingPlaylist;
    }
    isAudio() {
        return !!constants_1.MIMETYPES.AUDIO.EXT_MIMETYPE[this.extname];
    }
    isLive() {
        return this.size === -1;
    }
    isHLS() {
        return !!this.videoStreamingPlaylistId;
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
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoFileModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoFileModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoFileResolution', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileResolutionValid, 'resolution')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoFileModel.prototype, "resolution", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoFileSize', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileSizeValid, 'size')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT),
    tslib_1.__metadata("design:type", Number)
], VideoFileModel.prototype, "size", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoFileExtname', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileExtnameValid, 'extname')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], VideoFileModel.prototype, "extname", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('VideoFileInfohash', value => utils_1.throwIfNotValid(value, videos_1.isVideoFileInfoHashValid, 'info hash', true)),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], VideoFileModel.prototype, "infoHash", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(-1),
    sequelize_typescript_1.Is('VideoFileFPS', value => utils_1.throwIfNotValid(value, videos_1.isVideoFPSResolutionValid, 'fps')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoFileModel.prototype, "fps", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.JSONB),
    tslib_1.__metadata("design:type", Object)
], VideoFileModel.prototype, "metadata", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], VideoFileModel.prototype, "metadataUrl", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoFileModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoFileModel.prototype, "Video", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_streaming_playlist_1.VideoStreamingPlaylistModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoFileModel.prototype, "videoStreamingPlaylistId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_streaming_playlist_1.VideoStreamingPlaylistModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", video_streaming_playlist_1.VideoStreamingPlaylistModel)
], VideoFileModel.prototype, "VideoStreamingPlaylist", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasMany(() => video_redundancy_1.VideoRedundancyModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE',
        hooks: true
    }),
    tslib_1.__metadata("design:type", Array)
], VideoFileModel.prototype, "RedundancyVideos", void 0);
VideoFileModel = VideoFileModel_1 = tslib_1.__decorate([
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
