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
var VideoStreamingPlaylistModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const videos_1 = require("../../helpers/custom-validators/videos");
const utils_1 = require("../utils");
const video_1 = require("./video");
const video_redundancy_1 = require("../redundancy/video-redundancy");
const video_streaming_playlist_type_1 = require("../../../shared/models/videos/video-streaming-playlist.type");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const constants_1 = require("../../initializers/constants");
const path_1 = require("path");
const core_utils_1 = require("../../helpers/core-utils");
const misc_2 = require("../../helpers/custom-validators/misc");
const sequelize_1 = require("sequelize");
const video_file_1 = require("@server/models/video/video-file");
const video_paths_1 = require("@server/lib/video-paths");
const memoizee = require("memoizee");
const fs_extra_1 = require("fs-extra");
const logger_1 = require("@server/helpers/logger");
let VideoStreamingPlaylistModel = VideoStreamingPlaylistModel_1 = class VideoStreamingPlaylistModel extends sequelize_typescript_1.Model {
    static doesInfohashExist(infoHash) {
        const query = 'SELECT 1 FROM "videoStreamingPlaylist" WHERE $infoHash = ANY("p2pMediaLoaderInfohashes") LIMIT 1';
        const options = {
            type: sequelize_1.QueryTypes.SELECT,
            bind: { infoHash },
            raw: true
        };
        return video_1.VideoModel.sequelize.query(query, options)
            .then(results => results.length === 1);
    }
    static buildP2PMediaLoaderInfoHashes(playlistUrl, files) {
        const hashes = [];
        for (let i = 0; i < files.length; i++) {
            hashes.push(core_utils_1.sha1(`${constants_1.P2P_MEDIA_LOADER_PEER_VERSION}${playlistUrl}+V${i}`));
        }
        return hashes;
    }
    static listByIncorrectPeerVersion() {
        const query = {
            where: {
                p2pMediaLoaderPeerVersion: {
                    [sequelize_1.Op.ne]: constants_1.P2P_MEDIA_LOADER_PEER_VERSION
                }
            }
        };
        return VideoStreamingPlaylistModel_1.findAll(query);
    }
    static loadWithVideo(id) {
        const options = {
            include: [
                {
                    model: video_1.VideoModel.unscoped(),
                    required: true
                }
            ]
        };
        return VideoStreamingPlaylistModel_1.findByPk(id, options);
    }
    static getHlsPlaylistFilename(resolution) {
        return resolution + '.m3u8';
    }
    static getMasterHlsPlaylistFilename() {
        return 'master.m3u8';
    }
    static getHlsSha256SegmentsFilename() {
        return 'segments-sha256.json';
    }
    static getHlsMasterPlaylistStaticPath(videoUUID) {
        return path_1.join(constants_1.STATIC_PATHS.STREAMING_PLAYLISTS.HLS, videoUUID, VideoStreamingPlaylistModel_1.getMasterHlsPlaylistFilename());
    }
    static getHlsPlaylistStaticPath(videoUUID, resolution) {
        return path_1.join(constants_1.STATIC_PATHS.STREAMING_PLAYLISTS.HLS, videoUUID, VideoStreamingPlaylistModel_1.getHlsPlaylistFilename(resolution));
    }
    static getHlsSha256SegmentsStaticPath(videoUUID) {
        return path_1.join(constants_1.STATIC_PATHS.STREAMING_PLAYLISTS.HLS, videoUUID, VideoStreamingPlaylistModel_1.getHlsSha256SegmentsFilename());
    }
    getStringType() {
        if (this.type === video_streaming_playlist_type_1.VideoStreamingPlaylistType.HLS)
            return 'hls';
        return 'unknown';
    }
    getVideoRedundancyUrl(baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_PATHS.REDUNDANCY + this.getStringType() + '/' + this.Video.uuid;
    }
    getTorrentDownloadUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_DOWNLOAD_PATHS.TORRENTS + video_paths_1.getTorrentFileName(this, videoFile);
    }
    getVideoFileDownloadUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_DOWNLOAD_PATHS.HLS_VIDEOS + video_paths_1.getVideoFilename(this, videoFile);
    }
    getVideoFileUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + path_1.join(constants_1.STATIC_PATHS.STREAMING_PLAYLISTS.HLS, this.Video.uuid, video_paths_1.getVideoFilename(this, videoFile));
    }
    getTorrentUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + path_1.join(constants_1.STATIC_PATHS.TORRENTS, video_paths_1.getTorrentFileName(this, videoFile));
    }
    getTrackerUrls(baseUrlHttp, baseUrlWs) {
        return [baseUrlWs + '/tracker/socket', baseUrlHttp + '/tracker/announce'];
    }
    hasSameUniqueKeysThan(other) {
        return this.type === other.type &&
            this.videoId === other.videoId;
    }
    removeTorrent(videoFile) {
        const torrentPath = video_paths_1.getTorrentFilePath(this, videoFile);
        return fs_extra_1.remove(torrentPath)
            .catch(err => logger_1.logger.warn('Cannot delete torrent %s.', torrentPath, { err }));
    }
};
VideoStreamingPlaylistModel.doesInfohashExistCached = memoizee(VideoStreamingPlaylistModel_1.doesInfohashExist, {
    promise: true,
    max: constants_1.MEMOIZE_LENGTH.INFO_HASH_EXISTS,
    maxAge: constants_1.MEMOIZE_TTL.INFO_HASH_EXISTS
});
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoStreamingPlaylistModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoStreamingPlaylistModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoStreamingPlaylistModel.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('PlaylistUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'playlist url')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS.URL.max)),
    __metadata("design:type", String)
], VideoStreamingPlaylistModel.prototype, "playlistUrl", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoStreamingPlaylistInfoHashes', value => utils_1.throwIfNotValid(value, v => misc_2.isArrayOf(v, videos_1.isVideoFileInfoHashValid), 'info hashes')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING)),
    __metadata("design:type", Array)
], VideoStreamingPlaylistModel.prototype, "p2pMediaLoaderInfohashes", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoStreamingPlaylistModel.prototype, "p2pMediaLoaderPeerVersion", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoStreamingSegmentsSha256Url', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'segments sha256 url')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoStreamingPlaylistModel.prototype, "segmentsSha256Url", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoStreamingPlaylistModel.prototype, "videoId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", video_1.VideoModel)
], VideoStreamingPlaylistModel.prototype, "Video", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_file_1.VideoFileModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", Array)
], VideoStreamingPlaylistModel.prototype, "VideoFiles", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_redundancy_1.VideoRedundancyModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE',
        hooks: true
    }),
    __metadata("design:type", Array)
], VideoStreamingPlaylistModel.prototype, "RedundancyVideos", void 0);
VideoStreamingPlaylistModel = VideoStreamingPlaylistModel_1 = __decorate([
    sequelize_typescript_1.Table({
        tableName: 'videoStreamingPlaylist',
        indexes: [
            {
                fields: ['videoId']
            },
            {
                fields: ['videoId', 'type'],
                unique: true
            },
            {
                fields: ['p2pMediaLoaderInfohashes'],
                using: 'gin'
            }
        ]
    })
], VideoStreamingPlaylistModel);
exports.VideoStreamingPlaylistModel = VideoStreamingPlaylistModel;
