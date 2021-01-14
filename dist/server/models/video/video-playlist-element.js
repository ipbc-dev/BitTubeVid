"use strict";
var VideoPlaylistElementModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoPlaylistElementModel = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const validator_1 = require("validator");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const constants_1 = require("../../initializers/constants");
const utils_1 = require("../utils");
const video_1 = require("./video");
const video_playlist_1 = require("./video-playlist");
let VideoPlaylistElementModel = VideoPlaylistElementModel_1 = class VideoPlaylistElementModel extends sequelize_typescript_1.Model {
    static deleteAllOf(videoPlaylistId, transaction) {
        const query = {
            where: {
                videoPlaylistId
            },
            transaction
        };
        return VideoPlaylistElementModel_1.destroy(query);
    }
    static listForApi(options) {
        const accountIds = [options.serverAccount.id];
        const videoScope = [
            video_1.ScopeNames.WITH_BLACKLISTED
        ];
        if (options.user) {
            accountIds.push(options.user.Account.id);
            videoScope.push({ method: [video_1.ScopeNames.WITH_USER_HISTORY, options.user.id] });
        }
        const forApiOptions = { withAccountBlockerIds: accountIds };
        videoScope.push({
            method: [
                video_1.ScopeNames.FOR_API, forApiOptions
            ]
        });
        const findQuery = {
            offset: options.start,
            limit: options.count,
            order: utils_1.getSort('position'),
            where: {
                videoPlaylistId: options.videoPlaylistId
            },
            include: [
                {
                    model: video_1.VideoModel.scope(videoScope),
                    required: false
                }
            ]
        };
        const countQuery = {
            where: {
                videoPlaylistId: options.videoPlaylistId
            }
        };
        return Promise.all([
            VideoPlaylistElementModel_1.count(countQuery),
            VideoPlaylistElementModel_1.findAll(findQuery)
        ]).then(([total, data]) => ({ total, data }));
    }
    static loadByPlaylistAndVideo(videoPlaylistId, videoId) {
        const query = {
            where: {
                videoPlaylistId,
                videoId
            }
        };
        return VideoPlaylistElementModel_1.findOne(query);
    }
    static loadById(playlistElementId) {
        return VideoPlaylistElementModel_1.findByPk(playlistElementId);
    }
    static loadByPlaylistAndElementIdForAP(playlistId, playlistElementId) {
        const playlistWhere = validator_1.default.isUUID('' + playlistId) ? { uuid: playlistId } : { id: playlistId };
        const query = {
            include: [
                {
                    attributes: ['privacy'],
                    model: video_playlist_1.VideoPlaylistModel.unscoped(),
                    where: playlistWhere
                },
                {
                    attributes: ['url'],
                    model: video_1.VideoModel.unscoped()
                }
            ],
            where: {
                id: playlistElementId
            }
        };
        return VideoPlaylistElementModel_1.findOne(query);
    }
    static listUrlsOfForAP(videoPlaylistId, start, count, t) {
        const query = {
            attributes: ['url'],
            offset: start,
            limit: count,
            order: utils_1.getSort('position'),
            where: {
                videoPlaylistId
            },
            transaction: t
        };
        return VideoPlaylistElementModel_1
            .findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows.map(e => e.url) };
        });
    }
    static loadFirstElementWithVideoThumbnail(videoPlaylistId) {
        const query = {
            order: utils_1.getSort('position'),
            where: {
                videoPlaylistId
            },
            include: [
                {
                    model: video_1.VideoModel.scope(video_1.ScopeNames.WITH_THUMBNAILS),
                    required: true
                }
            ]
        };
        return VideoPlaylistElementModel_1
            .findOne(query);
    }
    static getNextPositionOf(videoPlaylistId, transaction) {
        const query = {
            where: {
                videoPlaylistId
            },
            transaction
        };
        return VideoPlaylistElementModel_1.max('position', query)
            .then(position => position ? position + 1 : 1);
    }
    static reassignPositionOf(videoPlaylistId, firstPosition, endPosition, newPosition, transaction) {
        const query = {
            where: {
                videoPlaylistId,
                position: {
                    [sequelize_1.Op.gte]: firstPosition,
                    [sequelize_1.Op.lte]: endPosition
                }
            },
            transaction,
            validate: false
        };
        return VideoPlaylistElementModel_1.update({ position: sequelize_1.Sequelize.literal(`${newPosition} + "position" - ${firstPosition}`) }, query);
    }
    static increasePositionOf(videoPlaylistId, fromPosition, toPosition, by = 1, transaction) {
        const query = {
            where: {
                videoPlaylistId,
                position: {
                    [sequelize_1.Op.gte]: fromPosition
                }
            },
            transaction
        };
        return VideoPlaylistElementModel_1.increment({ position: by }, query);
    }
    getType(displayNSFW, accountId) {
        const video = this.Video;
        if (!video)
            return 1;
        if (accountId && video.VideoChannel.Account.id === accountId)
            return 0;
        if (video.privacy === 4 && accountId)
            return 0;
        if (video.privacy === 3 || video.privacy === 4)
            return 2;
        if (video.isBlacklisted() || video.isBlocked())
            return 3;
        if (video.nsfw === true && displayNSFW === false)
            return 3;
        return 0;
    }
    getVideoElement(displayNSFW, accountId) {
        if (!this.Video)
            return null;
        if (this.getType(displayNSFW, accountId) !== 0)
            return null;
        return this.Video.toFormattedJSON();
    }
    toFormattedJSON(options = {}) {
        return {
            id: this.id,
            position: this.position,
            startTimestamp: this.startTimestamp,
            stopTimestamp: this.stopTimestamp,
            type: this.getType(options.displayNSFW, options.accountId),
            video: this.getVideoElement(options.displayNSFW, options.accountId)
        };
    }
    toActivityPubObject() {
        const base = {
            id: this.url,
            type: 'PlaylistElement',
            url: this.Video.url,
            position: this.position
        };
        if (this.startTimestamp)
            base.startTimestamp = this.startTimestamp;
        if (this.stopTimestamp)
            base.stopTimestamp = this.stopTimestamp;
        return base;
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoPlaylistElementModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], VideoPlaylistElementModel.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('VideoPlaylistUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'url', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_PLAYLISTS.URL.max)),
    tslib_1.__metadata("design:type", String)
], VideoPlaylistElementModel.prototype, "url", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(1),
    sequelize_typescript_1.IsInt,
    sequelize_typescript_1.Min(1),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoPlaylistElementModel.prototype, "position", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.IsInt,
    sequelize_typescript_1.Min(0),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoPlaylistElementModel.prototype, "startTimestamp", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.IsInt,
    sequelize_typescript_1.Min(0),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoPlaylistElementModel.prototype, "stopTimestamp", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_playlist_1.VideoPlaylistModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoPlaylistElementModel.prototype, "videoPlaylistId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_playlist_1.VideoPlaylistModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    tslib_1.__metadata("design:type", video_playlist_1.VideoPlaylistModel)
], VideoPlaylistElementModel.prototype, "VideoPlaylist", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => video_1.VideoModel),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], VideoPlaylistElementModel.prototype, "videoId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => video_1.VideoModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'set null'
    }),
    tslib_1.__metadata("design:type", video_1.VideoModel)
], VideoPlaylistElementModel.prototype, "Video", void 0);
VideoPlaylistElementModel = VideoPlaylistElementModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        tableName: 'videoPlaylistElement',
        indexes: [
            {
                fields: ['videoPlaylistId']
            },
            {
                fields: ['videoId']
            },
            {
                fields: ['url'],
                unique: true
            }
        ]
    })
], VideoPlaylistElementModel);
exports.VideoPlaylistElementModel = VideoPlaylistElementModel;
