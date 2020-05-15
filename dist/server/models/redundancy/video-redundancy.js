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
var VideoRedundancyModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const actor_1 = require("../activitypub/actor");
const utils_1 = require("../utils");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const constants_1 = require("../../initializers/constants");
const video_file_1 = require("../video/video-file");
const utils_2 = require("../../helpers/utils");
const video_1 = require("../video/video");
const logger_1 = require("../../helpers/logger");
const shared_1 = require("../../../shared");
const video_channel_1 = require("../video/video-channel");
const server_1 = require("../server/server");
const lodash_1 = require("lodash");
const core_utils_1 = require("../../helpers/core-utils");
const sequelize_1 = require("sequelize");
const video_streaming_playlist_1 = require("../video/video-streaming-playlist");
const config_1 = require("../../initializers/config");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["WITH_VIDEO"] = "WITH_VIDEO";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let VideoRedundancyModel = VideoRedundancyModel_1 = class VideoRedundancyModel extends sequelize_typescript_1.Model {
    static removeFile(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!instance.isOwned())
                return;
            if (instance.videoFileId) {
                const videoFile = yield video_file_1.VideoFileModel.loadWithVideo(instance.videoFileId);
                const logIdentifier = `${videoFile.Video.uuid}-${videoFile.resolution}`;
                logger_1.logger.info('Removing duplicated video file %s.', logIdentifier);
                videoFile.Video.removeFile(videoFile, true)
                    .catch(err => logger_1.logger.error('Cannot delete %s files.', logIdentifier, { err }));
            }
            if (instance.videoStreamingPlaylistId) {
                const videoStreamingPlaylist = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.loadWithVideo(instance.videoStreamingPlaylistId);
                const videoUUID = videoStreamingPlaylist.Video.uuid;
                logger_1.logger.info('Removing duplicated video streaming playlist %s.', videoUUID);
                videoStreamingPlaylist.Video.removeStreamingPlaylistFiles(videoStreamingPlaylist, true)
                    .catch(err => logger_1.logger.error('Cannot delete video streaming playlist files of %s.', videoUUID, { err }));
            }
            return undefined;
        });
    }
    static loadLocalByFileId(videoFileId) {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const query = {
                where: {
                    actorId: actor.id,
                    videoFileId
                }
            };
            return VideoRedundancyModel_1.scope(ScopeNames.WITH_VIDEO).findOne(query);
        });
    }
    static loadLocalByStreamingPlaylistId(videoStreamingPlaylistId) {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const query = {
                where: {
                    actorId: actor.id,
                    videoStreamingPlaylistId
                }
            };
            return VideoRedundancyModel_1.scope(ScopeNames.WITH_VIDEO).findOne(query);
        });
    }
    static loadByIdWithVideo(id, transaction) {
        const query = {
            where: { id },
            transaction
        };
        return VideoRedundancyModel_1.scope(ScopeNames.WITH_VIDEO).findOne(query);
    }
    static loadByUrl(url, transaction) {
        const query = {
            where: {
                url
            },
            transaction
        };
        return VideoRedundancyModel_1.findOne(query);
    }
    static isLocalByVideoUUIDExists(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const query = {
                raw: true,
                attributes: ['id'],
                where: {
                    actorId: actor.id
                },
                include: [
                    {
                        attributes: [],
                        model: video_file_1.VideoFileModel,
                        required: true,
                        include: [
                            {
                                attributes: [],
                                model: video_1.VideoModel,
                                required: true,
                                where: {
                                    uuid
                                }
                            }
                        ]
                    }
                ]
            };
            return VideoRedundancyModel_1.findOne(query)
                .then(r => !!r);
        });
    }
    static getVideoSample(p) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield p;
            if (rows.length === 0)
                return undefined;
            const ids = rows.map(r => r.id);
            const id = lodash_1.sample(ids);
            return video_1.VideoModel.loadWithFiles(id, undefined, !core_utils_1.isTestInstance());
        });
    }
    static findMostViewToDuplicate(randomizedFactor) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                attributes: ['id', 'views'],
                limit: randomizedFactor,
                order: utils_1.getVideoSort('-views'),
                where: {
                    privacy: shared_1.VideoPrivacy.PUBLIC
                },
                include: [
                    yield VideoRedundancyModel_1.buildVideoFileForDuplication(),
                    VideoRedundancyModel_1.buildServerRedundancyInclude()
                ]
            };
            return VideoRedundancyModel_1.getVideoSample(video_1.VideoModel.unscoped().findAll(query));
        });
    }
    static findTrendingToDuplicate(randomizedFactor) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                attributes: ['id', 'views'],
                subQuery: false,
                group: 'VideoModel.id',
                limit: randomizedFactor,
                order: utils_1.getVideoSort('-trending'),
                where: {
                    privacy: shared_1.VideoPrivacy.PUBLIC
                },
                include: [
                    yield VideoRedundancyModel_1.buildVideoFileForDuplication(),
                    VideoRedundancyModel_1.buildServerRedundancyInclude(),
                    video_1.VideoModel.buildTrendingQuery(config_1.CONFIG.TRENDING.VIDEOS.INTERVAL_DAYS)
                ]
            };
            return VideoRedundancyModel_1.getVideoSample(video_1.VideoModel.unscoped().findAll(query));
        });
    }
    static findRecentlyAddedToDuplicate(randomizedFactor, minViews) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                attributes: ['id', 'publishedAt'],
                limit: randomizedFactor,
                order: utils_1.getVideoSort('-publishedAt'),
                where: {
                    privacy: shared_1.VideoPrivacy.PUBLIC,
                    views: {
                        [sequelize_1.Op.gte]: minViews
                    }
                },
                include: [
                    yield VideoRedundancyModel_1.buildVideoFileForDuplication(),
                    VideoRedundancyModel_1.buildServerRedundancyInclude()
                ]
            };
            return VideoRedundancyModel_1.getVideoSample(video_1.VideoModel.unscoped().findAll(query));
        });
    }
    static loadOldestLocalExpired(strategy, expiresAfterMs) {
        return __awaiter(this, void 0, void 0, function* () {
            const expiredDate = new Date();
            expiredDate.setMilliseconds(expiredDate.getMilliseconds() - expiresAfterMs);
            const actor = yield utils_2.getServerActor();
            const query = {
                where: {
                    actorId: actor.id,
                    strategy,
                    createdAt: {
                        [sequelize_1.Op.lt]: expiredDate
                    }
                }
            };
            return VideoRedundancyModel_1.scope([ScopeNames.WITH_VIDEO]).findOne(query);
        });
    }
    static getTotalDuplicated(strategy) {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const redundancyInclude = {
                attributes: [],
                model: VideoRedundancyModel_1,
                required: true,
                where: {
                    actorId: actor.id,
                    strategy
                }
            };
            const queryFiles = {
                include: [redundancyInclude]
            };
            const queryStreamingPlaylists = {
                include: [
                    {
                        attributes: [],
                        model: video_1.VideoModel.unscoped(),
                        required: true,
                        include: [
                            {
                                required: true,
                                attributes: [],
                                model: video_streaming_playlist_1.VideoStreamingPlaylistModel.unscoped(),
                                include: [
                                    redundancyInclude
                                ]
                            }
                        ]
                    }
                ]
            };
            return Promise.all([
                video_file_1.VideoFileModel.aggregate('size', 'SUM', queryFiles),
                video_file_1.VideoFileModel.aggregate('size', 'SUM', queryStreamingPlaylists)
            ]).then(([r1, r2]) => {
                return utils_1.parseAggregateResult(r1) + utils_1.parseAggregateResult(r2);
            });
        });
    }
    static listLocalExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const query = {
                where: {
                    actorId: actor.id,
                    expiresOn: {
                        [sequelize_1.Op.lt]: new Date()
                    }
                }
            };
            return VideoRedundancyModel_1.scope([ScopeNames.WITH_VIDEO]).findAll(query);
        });
    }
    static listRemoteExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const query = {
                where: {
                    actorId: {
                        [sequelize_1.Op.ne]: actor.id
                    },
                    expiresOn: {
                        [sequelize_1.Op.lt]: new Date(),
                        [sequelize_1.Op.ne]: null
                    }
                }
            };
            return VideoRedundancyModel_1.scope([ScopeNames.WITH_VIDEO]).findAll(query);
        });
    }
    static listLocalOfServer(serverId) {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const buildVideoInclude = () => ({
                model: video_1.VideoModel,
                required: true,
                include: [
                    {
                        attributes: [],
                        model: video_channel_1.VideoChannelModel.unscoped(),
                        required: true,
                        include: [
                            {
                                attributes: [],
                                model: actor_1.ActorModel.unscoped(),
                                required: true,
                                where: {
                                    serverId
                                }
                            }
                        ]
                    }
                ]
            });
            const query = {
                where: {
                    actorId: actor.id
                },
                include: [
                    {
                        model: video_file_1.VideoFileModel,
                        required: false,
                        include: [buildVideoInclude()]
                    },
                    {
                        model: video_streaming_playlist_1.VideoStreamingPlaylistModel,
                        required: false,
                        include: [buildVideoInclude()]
                    }
                ]
            };
            return VideoRedundancyModel_1.findAll(query);
        });
    }
    static listForApi(options) {
        const { start, count, sort, target, strategy } = options;
        let redundancyWhere = {};
        let videosWhere = {};
        let redundancySqlSuffix = '';
        if (target === 'my-videos') {
            Object.assign(videosWhere, { remote: false });
        }
        else if (target === 'remote-videos') {
            Object.assign(videosWhere, { remote: true });
            Object.assign(redundancyWhere, { strategy: { [sequelize_1.Op.ne]: null } });
            redundancySqlSuffix = ' AND "videoRedundancy"."strategy" IS NOT NULL';
        }
        if (strategy) {
            Object.assign(redundancyWhere, { strategy: strategy });
        }
        const videoFilterWhere = {
            [sequelize_1.Op.and]: [
                {
                    [sequelize_1.Op.or]: [
                        {
                            id: {
                                [sequelize_1.Op.in]: sequelize_1.literal('(' +
                                    'SELECT "videoId" FROM "videoFile" ' +
                                    'INNER JOIN "videoRedundancy" ON "videoRedundancy"."videoFileId" = "videoFile".id' +
                                    redundancySqlSuffix +
                                    ')')
                            }
                        },
                        {
                            id: {
                                [sequelize_1.Op.in]: sequelize_1.literal('(' +
                                    'select "videoId" FROM "videoStreamingPlaylist" ' +
                                    'INNER JOIN "videoRedundancy" ON "videoRedundancy"."videoStreamingPlaylistId" = "videoStreamingPlaylist".id' +
                                    redundancySqlSuffix +
                                    ')')
                            }
                        }
                    ]
                },
                videosWhere
            ]
        };
        const findOptions = {
            offset: start,
            limit: count,
            order: utils_1.getSort(sort),
            include: [
                {
                    required: false,
                    model: video_file_1.VideoFileModel.unscoped(),
                    include: [
                        {
                            model: VideoRedundancyModel_1.unscoped(),
                            required: false,
                            where: redundancyWhere
                        }
                    ]
                },
                {
                    required: false,
                    model: video_streaming_playlist_1.VideoStreamingPlaylistModel.unscoped(),
                    include: [
                        {
                            model: VideoRedundancyModel_1.unscoped(),
                            required: false,
                            where: redundancyWhere
                        },
                        {
                            model: video_file_1.VideoFileModel.unscoped(),
                            required: false
                        }
                    ]
                }
            ],
            where: videoFilterWhere
        };
        const countOptions = {
            where: videoFilterWhere
        };
        return Promise.all([
            video_1.VideoModel.findAll(findOptions),
            video_1.VideoModel.count(countOptions)
        ]).then(([data, total]) => ({ total, data }));
    }
    static getStats(strategy) {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const query = {
                raw: true,
                attributes: [
                    [sequelize_1.fn('COALESCE', sequelize_1.fn('SUM', sequelize_1.col('VideoFile.size')), '0'), 'totalUsed'],
                    [sequelize_1.fn('COUNT', sequelize_1.fn('DISTINCT', sequelize_1.col('videoId'))), 'totalVideos'],
                    [sequelize_1.fn('COUNT', sequelize_1.col('videoFileId')), 'totalVideoFiles']
                ],
                where: {
                    strategy,
                    actorId: actor.id
                },
                include: [
                    {
                        attributes: [],
                        model: video_file_1.VideoFileModel,
                        required: true
                    }
                ]
            };
            return VideoRedundancyModel_1.findOne(query)
                .then((r) => ({
                totalUsed: utils_1.parseAggregateResult(r.totalUsed),
                totalVideos: r.totalVideos,
                totalVideoFiles: r.totalVideoFiles
            }));
        });
    }
    static toFormattedJSONStatic(video) {
        let filesRedundancies = [];
        let streamingPlaylistsRedundancies = [];
        for (const file of video.VideoFiles) {
            for (const redundancy of file.RedundancyVideos) {
                filesRedundancies.push({
                    id: redundancy.id,
                    fileUrl: redundancy.fileUrl,
                    strategy: redundancy.strategy,
                    createdAt: redundancy.createdAt,
                    updatedAt: redundancy.updatedAt,
                    expiresOn: redundancy.expiresOn,
                    size: file.size
                });
            }
        }
        for (const playlist of video.VideoStreamingPlaylists) {
            const size = playlist.VideoFiles.reduce((a, b) => a + b.size, 0);
            for (const redundancy of playlist.RedundancyVideos) {
                streamingPlaylistsRedundancies.push({
                    id: redundancy.id,
                    fileUrl: redundancy.fileUrl,
                    strategy: redundancy.strategy,
                    createdAt: redundancy.createdAt,
                    updatedAt: redundancy.updatedAt,
                    expiresOn: redundancy.expiresOn,
                    size
                });
            }
        }
        return {
            id: video.id,
            name: video.name,
            url: video.url,
            uuid: video.uuid,
            redundancies: {
                files: filesRedundancies,
                streamingPlaylists: streamingPlaylistsRedundancies
            }
        };
    }
    getVideo() {
        if (this.VideoFile)
            return this.VideoFile.Video;
        return this.VideoStreamingPlaylist.Video;
    }
    isOwned() {
        return !!this.strategy;
    }
    toActivityPubObject() {
        if (this.VideoStreamingPlaylist) {
            return {
                id: this.url,
                type: 'CacheFile',
                object: this.VideoStreamingPlaylist.Video.url,
                expires: this.expiresOn ? this.expiresOn.toISOString() : null,
                url: {
                    type: 'Link',
                    mediaType: 'application/x-mpegURL',
                    href: this.fileUrl
                }
            };
        }
        return {
            id: this.url,
            type: 'CacheFile',
            object: this.VideoFile.Video.url,
            expires: this.expiresOn ? this.expiresOn.toISOString() : null,
            url: {
                type: 'Link',
                mediaType: constants_1.MIMETYPES.VIDEO.EXT_MIMETYPE[this.VideoFile.extname],
                href: this.fileUrl,
                height: this.VideoFile.resolution,
                size: this.VideoFile.size,
                fps: this.VideoFile.fps
            }
        };
    }
    static buildVideoFileForDuplication() {
        return __awaiter(this, void 0, void 0, function* () {
            const actor = yield utils_2.getServerActor();
            const notIn = sequelize_1.literal('(' +
                `SELECT "videoFileId" FROM "videoRedundancy" WHERE "actorId" = ${actor.id} AND "videoFileId" IS NOT NULL` +
                ')');
            return {
                attributes: [],
                model: video_file_1.VideoFileModel.unscoped(),
                required: true,
                where: {
                    id: {
                        [sequelize_1.Op.notIn]: notIn
                    }
                }
            };
        });
    }
    static buildServerRedundancyInclude() {
        return {
            attributes: [],
            model: video_channel_1.VideoChannelModel.unscoped(),
            required: true,
            include: [
                {
                    attributes: [],
                    model: actor_1.ActorModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: [],
                            model: server_1.ServerModel.unscoped(),
                            required: true,
                            where: {
                                redundancyAllowed: true
                            }
                        }
                    ]
                }
            ]
        };
    }
};
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoRedundancyModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoRedundancyModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], VideoRedundancyModel.prototype, "expiresOn", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoRedundancyFileUrl', value => utils_1.throwIfNotValid(value, misc_1.isUrlValid, 'fileUrl')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS_REDUNDANCY.URL.max)),
    __metadata("design:type", String)
], VideoRedundancyModel.prototype, "fileUrl", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoRedundancyUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'url')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS_REDUNDANCY.URL.max)),
    __metadata("design:type", String)
], VideoRedundancyModel.prototype, "url", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoRedundancyModel.prototype, "strategy", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_file_1.VideoFileModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoRedundancyModel.prototype, "videoFileId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_file_1.VideoFileModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", video_file_1.VideoFileModel)
], VideoRedundancyModel.prototype, "VideoFile", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_streaming_playlist_1.VideoStreamingPlaylistModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoRedundancyModel.prototype, "videoStreamingPlaylistId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_streaming_playlist_1.VideoStreamingPlaylistModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", video_streaming_playlist_1.VideoStreamingPlaylistModel)
], VideoRedundancyModel.prototype, "VideoStreamingPlaylist", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => actor_1.ActorModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoRedundancyModel.prototype, "actorId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => actor_1.ActorModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", actor_1.ActorModel)
], VideoRedundancyModel.prototype, "Actor", void 0);
__decorate([
    sequelize_typescript_1.BeforeDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VideoRedundancyModel]),
    __metadata("design:returntype", Promise)
], VideoRedundancyModel, "removeFile", null);
VideoRedundancyModel = VideoRedundancyModel_1 = __decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_VIDEO]: {
            include: [
                {
                    model: video_file_1.VideoFileModel,
                    required: false,
                    include: [
                        {
                            model: video_1.VideoModel,
                            required: true
                        }
                    ]
                },
                {
                    model: video_streaming_playlist_1.VideoStreamingPlaylistModel,
                    required: false,
                    include: [
                        {
                            model: video_1.VideoModel,
                            required: true
                        }
                    ]
                }
            ]
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoRedundancy',
        indexes: [
            {
                fields: ['videoFileId']
            },
            {
                fields: ['actorId']
            },
            {
                fields: ['url'],
                unique: true
            }
        ]
    })
], VideoRedundancyModel);
exports.VideoRedundancyModel = VideoRedundancyModel;
