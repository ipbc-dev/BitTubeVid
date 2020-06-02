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
var VideoPlaylistModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const video_playlist_privacy_model_1 = require("../../../shared/models/videos/playlist/video-playlist-privacy.model");
const utils_1 = require("../utils");
const video_playlists_1 = require("../../helpers/custom-validators/video-playlists");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const constants_1 = require("../../initializers/constants");
const account_1 = require("../account/account");
const video_channel_1 = require("./video-channel");
const path_1 = require("path");
const video_playlist_element_1 = require("./video-playlist-element");
const activitypub_1 = require("../../helpers/activitypub");
const video_playlist_type_model_1 = require("../../../shared/models/videos/playlist/video-playlist-type.model");
const thumbnail_1 = require("./thumbnail");
const sequelize_1 = require("sequelize");
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["AVAILABLE_FOR_LIST"] = "AVAILABLE_FOR_LIST";
    ScopeNames["WITH_VIDEOS_LENGTH"] = "WITH_VIDEOS_LENGTH";
    ScopeNames["WITH_ACCOUNT_AND_CHANNEL_SUMMARY"] = "WITH_ACCOUNT_AND_CHANNEL_SUMMARY";
    ScopeNames["WITH_ACCOUNT"] = "WITH_ACCOUNT";
    ScopeNames["WITH_THUMBNAIL"] = "WITH_THUMBNAIL";
    ScopeNames["WITH_ACCOUNT_AND_CHANNEL"] = "WITH_ACCOUNT_AND_CHANNEL";
})(ScopeNames || (ScopeNames = {}));
let VideoPlaylistModel = VideoPlaylistModel_1 = class VideoPlaylistModel extends sequelize_typescript_1.Model {
    static listForApi(options) {
        const query = {
            offset: options.start,
            limit: options.count,
            order: utils_1.getSort(options.sort)
        };
        const scopes = [
            {
                method: [
                    ScopeNames.AVAILABLE_FOR_LIST,
                    {
                        type: options.type,
                        followerActorId: options.followerActorId,
                        accountId: options.accountId,
                        videoChannelId: options.videoChannelId,
                        listMyPlaylists: options.listMyPlaylists,
                        search: options.search
                    }
                ]
            },
            ScopeNames.WITH_VIDEOS_LENGTH,
            ScopeNames.WITH_THUMBNAIL
        ];
        return VideoPlaylistModel_1
            .scope(scopes)
            .findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows };
        });
    }
    static listPublicUrlsOfForAP(options, start, count) {
        const where = {
            privacy: video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC
        };
        if (options.account) {
            Object.assign(where, { ownerAccountId: options.account.id });
        }
        if (options.channel) {
            Object.assign(where, { videoChannelId: options.channel.id });
        }
        const query = {
            attributes: ['url'],
            offset: start,
            limit: count,
            where
        };
        return VideoPlaylistModel_1.findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows.map(p => p.url) };
        });
    }
    static listPlaylistIdsOf(accountId, videoIds) {
        const query = {
            attributes: ['id'],
            where: {
                ownerAccountId: accountId
            },
            include: [
                {
                    attributes: ['id', 'videoId', 'startTimestamp', 'stopTimestamp'],
                    model: video_playlist_element_1.VideoPlaylistElementModel.unscoped(),
                    where: {
                        videoId: {
                            [sequelize_1.Op.in]: videoIds
                        }
                    },
                    required: true
                }
            ]
        };
        return VideoPlaylistModel_1.findAll(query);
    }
    static doesPlaylistExist(url) {
        const query = {
            attributes: [],
            where: {
                url
            }
        };
        return VideoPlaylistModel_1
            .findOne(query)
            .then(e => !!e);
    }
    static loadWithAccountAndChannelSummary(id, transaction) {
        const where = utils_1.buildWhereIdOrUUID(id);
        const query = {
            where,
            transaction
        };
        return VideoPlaylistModel_1
            .scope([ScopeNames.WITH_ACCOUNT_AND_CHANNEL_SUMMARY, ScopeNames.WITH_VIDEOS_LENGTH, ScopeNames.WITH_THUMBNAIL])
            .findOne(query);
    }
    static loadWithAccountAndChannel(id, transaction) {
        const where = utils_1.buildWhereIdOrUUID(id);
        const query = {
            where,
            transaction
        };
        return VideoPlaylistModel_1
            .scope([ScopeNames.WITH_ACCOUNT_AND_CHANNEL, ScopeNames.WITH_VIDEOS_LENGTH, ScopeNames.WITH_THUMBNAIL])
            .findOne(query);
    }
    static loadByUrlAndPopulateAccount(url) {
        const query = {
            where: {
                url
            }
        };
        return VideoPlaylistModel_1.scope([ScopeNames.WITH_ACCOUNT, ScopeNames.WITH_THUMBNAIL]).findOne(query);
    }
    static getPrivacyLabel(privacy) {
        return constants_1.VIDEO_PLAYLIST_PRIVACIES[privacy] || 'Unknown';
    }
    static getTypeLabel(type) {
        return constants_1.VIDEO_PLAYLIST_TYPES[type] || 'Unknown';
    }
    static resetPlaylistsOfChannel(videoChannelId, transaction) {
        const query = {
            where: {
                videoChannelId
            },
            transaction
        };
        return VideoPlaylistModel_1.update({ privacy: video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE, videoChannelId: null }, query);
    }
    setAndSaveThumbnail(thumbnail, t) {
        return __awaiter(this, void 0, void 0, function* () {
            thumbnail.videoPlaylistId = this.id;
            this.Thumbnail = yield thumbnail.save({ transaction: t });
        });
    }
    hasThumbnail() {
        return !!this.Thumbnail;
    }
    hasGeneratedThumbnail() {
        return this.hasThumbnail() && this.Thumbnail.automaticallyGenerated === true;
    }
    generateThumbnailName() {
        const extension = '.jpg';
        return 'playlist-' + this.uuid + extension;
    }
    getThumbnailUrl() {
        if (!this.hasThumbnail())
            return null;
        return constants_1.WEBSERVER.URL + constants_1.STATIC_PATHS.THUMBNAILS + this.Thumbnail.filename;
    }
    getThumbnailStaticPath() {
        if (!this.hasThumbnail())
            return null;
        return path_1.join(constants_1.STATIC_PATHS.THUMBNAILS, this.Thumbnail.filename);
    }
    setAsRefreshed() {
        this.changed('updatedAt', true);
        return this.save();
    }
    isOwned() {
        return this.OwnerAccount.isOwned();
    }
    isOutdated() {
        if (this.isOwned())
            return false;
        return utils_1.isOutdated(this, constants_1.ACTIVITY_PUB.VIDEO_PLAYLIST_REFRESH_INTERVAL);
    }
    toFormattedJSON() {
        return {
            id: this.id,
            uuid: this.uuid,
            isLocal: this.isOwned(),
            displayName: this.name,
            description: this.description,
            privacy: {
                id: this.privacy,
                label: VideoPlaylistModel_1.getPrivacyLabel(this.privacy)
            },
            thumbnailPath: this.getThumbnailStaticPath(),
            type: {
                id: this.type,
                label: VideoPlaylistModel_1.getTypeLabel(this.type)
            },
            videosLength: this.get('videosLength'),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            ownerAccount: this.OwnerAccount.toFormattedSummaryJSON(),
            videoChannel: this.VideoChannel
                ? this.VideoChannel.toFormattedSummaryJSON()
                : null
        };
    }
    toActivityPubObject(page, t) {
        const handler = (start, count) => {
            return video_playlist_element_1.VideoPlaylistElementModel.listUrlsOfForAP(this.id, start, count, t);
        };
        let icon;
        if (this.hasThumbnail()) {
            icon = {
                type: 'Image',
                url: this.getThumbnailUrl(),
                mediaType: 'image/jpeg',
                width: constants_1.THUMBNAILS_SIZE.width,
                height: constants_1.THUMBNAILS_SIZE.height
            };
        }
        return activitypub_1.activityPubCollectionPagination(this.url, handler, page)
            .then(o => {
            return Object.assign(o, {
                type: 'Playlist',
                name: this.name,
                content: this.description,
                uuid: this.uuid,
                published: this.createdAt.toISOString(),
                updated: this.updatedAt.toISOString(),
                attributedTo: this.VideoChannel ? [this.VideoChannel.Actor.url] : [],
                icon
            });
        });
    }
};
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoPlaylistModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoPlaylistModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoPlaylistName', value => utils_1.throwIfNotValid(value, video_playlists_1.isVideoPlaylistNameValid, 'name')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoPlaylistModel.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('VideoPlaylistDescription', value => utils_1.throwIfNotValid(value, video_playlists_1.isVideoPlaylistDescriptionValid, 'description', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_PLAYLISTS.DESCRIPTION.max)),
    __metadata("design:type", String)
], VideoPlaylistModel.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoPlaylistPrivacy', value => utils_1.throwIfNotValid(value, video_playlists_1.isVideoPlaylistPrivacyValid, 'privacy')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoPlaylistModel.prototype, "privacy", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoPlaylistUrl', value => utils_1.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'url')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEO_PLAYLISTS.URL.max)),
    __metadata("design:type", String)
], VideoPlaylistModel.prototype, "url", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(sequelize_typescript_1.DataType.UUIDV4),
    sequelize_typescript_1.IsUUID(4),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], VideoPlaylistModel.prototype, "uuid", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(video_playlist_type_model_1.VideoPlaylistType.REGULAR),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoPlaylistModel.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => account_1.AccountModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoPlaylistModel.prototype, "ownerAccountId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => account_1.AccountModel, {
        foreignKey: {
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", account_1.AccountModel)
], VideoPlaylistModel.prototype, "OwnerAccount", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_channel_1.VideoChannelModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoPlaylistModel.prototype, "videoChannelId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_channel_1.VideoChannelModel, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", video_channel_1.VideoChannelModel)
], VideoPlaylistModel.prototype, "VideoChannel", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_playlist_element_1.VideoPlaylistElementModel, {
        foreignKey: {
            name: 'videoPlaylistId',
            allowNull: false
        },
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", Array)
], VideoPlaylistModel.prototype, "VideoPlaylistElements", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => thumbnail_1.ThumbnailModel, {
        foreignKey: {
            name: 'videoPlaylistId',
            allowNull: true
        },
        onDelete: 'CASCADE',
        hooks: true
    }),
    __metadata("design:type", thumbnail_1.ThumbnailModel)
], VideoPlaylistModel.prototype, "Thumbnail", void 0);
VideoPlaylistModel = VideoPlaylistModel_1 = __decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.WITH_THUMBNAIL]: {
            include: [
                {
                    model: thumbnail_1.ThumbnailModel,
                    required: false
                }
            ]
        },
        [ScopeNames.WITH_VIDEOS_LENGTH]: {
            attributes: {
                include: [
                    [
                        sequelize_1.literal('(SELECT COUNT("id") FROM "videoPlaylistElement" WHERE "videoPlaylistId" = "VideoPlaylistModel"."id")'),
                        'videosLength'
                    ]
                ]
            }
        },
        [ScopeNames.WITH_ACCOUNT]: {
            include: [
                {
                    model: account_1.AccountModel,
                    required: true
                }
            ]
        },
        [ScopeNames.WITH_ACCOUNT_AND_CHANNEL_SUMMARY]: {
            include: [
                {
                    model: account_1.AccountModel.scope(account_1.ScopeNames.SUMMARY),
                    required: true
                },
                {
                    model: video_channel_1.VideoChannelModel.scope(video_channel_1.ScopeNames.SUMMARY),
                    required: false
                }
            ]
        },
        [ScopeNames.WITH_ACCOUNT_AND_CHANNEL]: {
            include: [
                {
                    model: account_1.AccountModel,
                    required: true
                },
                {
                    model: video_channel_1.VideoChannelModel,
                    required: false
                }
            ]
        },
        [ScopeNames.AVAILABLE_FOR_LIST]: (options) => {
            let whereActor = {};
            const whereAnd = [];
            if (options.listMyPlaylists !== true) {
                whereAnd.push({
                    privacy: video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC
                });
                const inQueryInstanceFollow = utils_1.buildServerIdsFollowedBy(options.followerActorId);
                whereActor = {
                    [sequelize_1.Op.or]: [
                        {
                            serverId: null
                        },
                        {
                            serverId: {
                                [sequelize_1.Op.in]: sequelize_1.literal(inQueryInstanceFollow)
                            }
                        }
                    ]
                };
            }
            if (options.accountId) {
                whereAnd.push({
                    ownerAccountId: options.accountId
                });
            }
            if (options.videoChannelId) {
                whereAnd.push({
                    videoChannelId: options.videoChannelId
                });
            }
            if (options.type) {
                whereAnd.push({
                    type: options.type
                });
            }
            if (options.search) {
                whereAnd.push({
                    name: {
                        [sequelize_1.Op.iLike]: '%' + options.search + '%'
                    }
                });
            }
            const where = {
                [sequelize_1.Op.and]: whereAnd
            };
            const accountScope = {
                method: [account_1.ScopeNames.SUMMARY, { whereActor }]
            };
            return {
                where,
                include: [
                    {
                        model: account_1.AccountModel.scope(accountScope),
                        required: true
                    },
                    {
                        model: video_channel_1.VideoChannelModel.scope(video_channel_1.ScopeNames.SUMMARY),
                        required: false
                    }
                ]
            };
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'videoPlaylist',
        indexes: [
            {
                fields: ['ownerAccountId']
            },
            {
                fields: ['videoChannelId']
            },
            {
                fields: ['url'],
                unique: true
            }
        ]
    })
], VideoPlaylistModel);
exports.VideoPlaylistModel = VideoPlaylistModel;
