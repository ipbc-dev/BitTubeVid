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
var VideoModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const lodash_1 = require("lodash");
const path_1 = require("path");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const shared_1 = require("../../../shared");
const core_utils_1 = require("../../helpers/core-utils");
const misc_1 = require("../../helpers/custom-validators/activitypub/misc");
const misc_2 = require("../../helpers/custom-validators/misc");
const videos_1 = require("../../helpers/custom-validators/videos");
const ffmpeg_utils_1 = require("../../helpers/ffmpeg-utils");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("../../helpers/utils");
const constants_1 = require("../../initializers/constants");
const send_1 = require("../../lib/activitypub/send");
const account_1 = require("../account/account");
const account_video_rate_1 = require("../account/account-video-rate");
const actor_1 = require("../activitypub/actor");
const avatar_1 = require("../avatar/avatar");
const server_1 = require("../server/server");
const utils_2 = require("../utils");
const tag_1 = require("./tag");
const video_abuse_1 = require("./video-abuse");
const video_channel_1 = require("./video-channel");
const video_comment_1 = require("./video-comment");
const video_file_1 = require("./video-file");
const video_share_1 = require("./video-share");
const video_tag_1 = require("./video-tag");
const schedule_video_update_1 = require("./schedule-video-update");
const video_caption_1 = require("./video-caption");
const video_blacklist_1 = require("./video-blacklist");
const fs_extra_1 = require("fs-extra");
const video_views_1 = require("./video-views");
const video_redundancy_1 = require("../redundancy/video-redundancy");
const video_format_utils_1 = require("./video-format-utils");
const user_video_history_1 = require("../account/user-video-history");
const video_import_1 = require("./video-import");
const video_streaming_playlist_1 = require("./video-streaming-playlist");
const video_playlist_element_1 = require("./video-playlist-element");
const config_1 = require("../../initializers/config");
const thumbnail_1 = require("./thumbnail");
const thumbnail_type_1 = require("../../../shared/models/videos/thumbnail.type");
const video_streaming_playlist_type_1 = require("../../../shared/models/videos/video-streaming-playlist.type");
const video_paths_1 = require("@server/lib/video-paths");
const validator_1 = require("validator");
const indexes = [
    utils_2.buildTrigramSearchIndex('video_name_trigram', 'name'),
    { fields: ['createdAt'] },
    {
        fields: [
            { name: 'publishedAt', order: 'DESC' },
            { name: 'id', order: 'ASC' }
        ]
    },
    { fields: ['duration'] },
    { fields: ['views'] },
    { fields: ['channelId'] },
    {
        fields: ['originallyPublishedAt'],
        where: {
            originallyPublishedAt: {
                [sequelize_1.Op.ne]: null
            }
        }
    },
    {
        fields: ['category'],
        where: {
            category: {
                [sequelize_1.Op.ne]: null
            }
        }
    },
    {
        fields: ['licence'],
        where: {
            licence: {
                [sequelize_1.Op.ne]: null
            }
        }
    },
    {
        fields: ['language'],
        where: {
            language: {
                [sequelize_1.Op.ne]: null
            }
        }
    },
    {
        fields: ['nsfw'],
        where: {
            nsfw: true
        }
    },
    {
        fields: ['remote'],
        where: {
            remote: false
        }
    },
    {
        fields: ['uuid'],
        unique: true
    },
    {
        fields: ['url'],
        unique: true
    }
];
var ScopeNames;
(function (ScopeNames) {
    ScopeNames["AVAILABLE_FOR_LIST_IDS"] = "AVAILABLE_FOR_LIST_IDS";
    ScopeNames["FOR_API"] = "FOR_API";
    ScopeNames["WITH_ACCOUNT_DETAILS"] = "WITH_ACCOUNT_DETAILS";
    ScopeNames["WITH_TAGS"] = "WITH_TAGS";
    ScopeNames["WITH_WEBTORRENT_FILES"] = "WITH_WEBTORRENT_FILES";
    ScopeNames["WITH_SCHEDULED_UPDATE"] = "WITH_SCHEDULED_UPDATE";
    ScopeNames["WITH_BLACKLISTED"] = "WITH_BLACKLISTED";
    ScopeNames["WITH_USER_HISTORY"] = "WITH_USER_HISTORY";
    ScopeNames["WITH_STREAMING_PLAYLISTS"] = "WITH_STREAMING_PLAYLISTS";
    ScopeNames["WITH_USER_ID"] = "WITH_USER_ID";
    ScopeNames["WITH_THUMBNAILS"] = "WITH_THUMBNAILS";
})(ScopeNames = exports.ScopeNames || (exports.ScopeNames = {}));
let VideoModel = VideoModel_1 = class VideoModel extends sequelize_typescript_1.Model {
    static sendDelete(instance, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (instance.isOwned()) {
                if (!instance.VideoChannel) {
                    instance.VideoChannel = (yield instance.$get('VideoChannel', {
                        include: [
                            actor_1.ActorModel,
                            account_1.AccountModel
                        ],
                        transaction: options.transaction
                    }));
                }
                return send_1.sendDeleteVideo(instance, options.transaction);
            }
            return undefined;
        });
    }
    static removeFiles(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = [];
            logger_1.logger.info('Removing files of video %s.', instance.url);
            if (instance.isOwned()) {
                if (!Array.isArray(instance.VideoFiles)) {
                    instance.VideoFiles = yield instance.$get('VideoFiles');
                }
                instance.VideoFiles.forEach(file => {
                    tasks.push(instance.removeFile(file));
                    tasks.push(instance.removeTorrent(file));
                });
                if (!Array.isArray(instance.VideoStreamingPlaylists)) {
                    instance.VideoStreamingPlaylists = yield instance.$get('VideoStreamingPlaylists');
                }
                for (const p of instance.VideoStreamingPlaylists) {
                    tasks.push(instance.removeStreamingPlaylistFiles(p));
                }
            }
            Promise.all(tasks)
                .catch(err => {
                logger_1.logger.error('Some errors when removing files of video %s in before destroy hook.', instance.uuid, { err });
            });
            return undefined;
        });
    }
    static listLocal() {
        const query = {
            where: {
                remote: false
            }
        };
        return VideoModel_1.scope([
            ScopeNames.WITH_WEBTORRENT_FILES,
            ScopeNames.WITH_STREAMING_PLAYLISTS,
            ScopeNames.WITH_THUMBNAILS
        ]).findAll(query);
    }
    static listAllAndSharedByActorForOutbox(actorId, start, count) {
        function getRawQuery(select) {
            const queryVideo = 'SELECT ' + select + ' FROM "video" AS "Video" ' +
                'INNER JOIN "videoChannel" AS "VideoChannel" ON "VideoChannel"."id" = "Video"."channelId" ' +
                'INNER JOIN "account" AS "Account" ON "Account"."id" = "VideoChannel"."accountId" ' +
                'WHERE "Account"."actorId" = ' + actorId;
            const queryVideoShare = 'SELECT ' + select + ' FROM "videoShare" AS "VideoShare" ' +
                'INNER JOIN "video" AS "Video" ON "Video"."id" = "VideoShare"."videoId" ' +
                'WHERE "VideoShare"."actorId" = ' + actorId;
            return `(${queryVideo}) UNION (${queryVideoShare})`;
        }
        const rawQuery = getRawQuery('"Video"."id"');
        const rawCountQuery = getRawQuery('COUNT("Video"."id") as "total"');
        const query = {
            distinct: true,
            offset: start,
            limit: count,
            order: utils_2.getVideoSort('createdAt', ['Tags', 'name', 'ASC']),
            where: {
                id: {
                    [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(' + rawQuery + ')')
                },
                [sequelize_1.Op.or]: [
                    { privacy: shared_1.VideoPrivacy.PUBLIC },
                    { privacy: shared_1.VideoPrivacy.UNLISTED }
                ]
            },
            include: [
                {
                    attributes: ['language'],
                    model: video_caption_1.VideoCaptionModel.unscoped(),
                    required: false
                },
                {
                    attributes: ['id', 'url'],
                    model: video_share_1.VideoShareModel.unscoped(),
                    required: false,
                    where: {
                        [sequelize_1.Op.and]: [
                            {
                                id: {
                                    [sequelize_1.Op.not]: null
                                }
                            },
                            {
                                actorId
                            }
                        ]
                    },
                    include: [
                        {
                            attributes: ['id', 'url'],
                            model: actor_1.ActorModel.unscoped()
                        }
                    ]
                },
                {
                    model: video_channel_1.VideoChannelModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: ['name'],
                            model: account_1.AccountModel.unscoped(),
                            required: true,
                            include: [
                                {
                                    attributes: ['id', 'url', 'followersUrl'],
                                    model: actor_1.ActorModel.unscoped(),
                                    required: true
                                }
                            ]
                        },
                        {
                            attributes: ['id', 'url', 'followersUrl'],
                            model: actor_1.ActorModel.unscoped(),
                            required: true
                        }
                    ]
                },
                video_file_1.VideoFileModel,
                tag_1.TagModel
            ]
        };
        return Bluebird.all([
            VideoModel_1.scope(ScopeNames.WITH_THUMBNAILS).findAll(query),
            VideoModel_1.sequelize.query(rawCountQuery, { type: sequelize_1.QueryTypes.SELECT })
        ]).then(([rows, totals]) => {
            let totalVideos = 0;
            let totalVideoShares = 0;
            if (totals[0])
                totalVideos = parseInt(totals[0].total, 10);
            if (totals[1])
                totalVideoShares = parseInt(totals[1].total, 10);
            const total = totalVideos + totalVideoShares;
            return {
                data: rows,
                total: total
            };
        });
    }
    static listUserVideosForApi(accountId, start, count, sort, search) {
        function buildBaseQuery() {
            let baseQuery = {
                offset: start,
                limit: count,
                order: utils_2.getVideoSort(sort),
                include: [
                    {
                        model: video_channel_1.VideoChannelModel,
                        required: true,
                        include: [
                            {
                                model: account_1.AccountModel,
                                where: {
                                    id: accountId
                                },
                                required: true
                            }
                        ]
                    }
                ]
            };
            if (search) {
                baseQuery = Object.assign(baseQuery, {
                    where: {
                        name: {
                            [sequelize_1.Op.iLike]: '%' + search + '%'
                        }
                    }
                });
            }
            return baseQuery;
        }
        const countQuery = buildBaseQuery();
        const findQuery = buildBaseQuery();
        const findScopes = [
            ScopeNames.WITH_SCHEDULED_UPDATE,
            ScopeNames.WITH_BLACKLISTED,
            ScopeNames.WITH_THUMBNAILS
        ];
        return Promise.all([
            VideoModel_1.count(countQuery),
            VideoModel_1.scope(findScopes).findAll(findQuery)
        ]).then(([count, rows]) => {
            return {
                data: rows,
                total: count
            };
        });
    }
    static listForApi(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.filter && options.filter === 'all-local' && !options.user.hasRight(shared_1.UserRight.SEE_ALL_VIDEOS)) {
                throw new Error('Try to filter all-local but no user has not the see all videos right');
            }
            const query = {
                offset: options.start,
                limit: options.count,
                order: utils_2.getVideoSort(options.sort)
            };
            let trendingDays;
            if (options.sort.endsWith('trending')) {
                trendingDays = config_1.CONFIG.TRENDING.VIDEOS.INTERVAL_DAYS;
                query.group = 'VideoModel.id';
            }
            const serverActor = yield utils_1.getServerActor();
            const followerActorId = options.followerActorId !== undefined ? options.followerActorId : serverActor.id;
            const queryOptions = {
                followerActorId,
                serverAccountId: serverActor.Account.id,
                nsfw: options.nsfw,
                categoryOneOf: options.categoryOneOf,
                licenceOneOf: options.licenceOneOf,
                languageOneOf: options.languageOneOf,
                tagsOneOf: options.tagsOneOf,
                tagsAllOf: options.tagsAllOf,
                filter: options.filter,
                withFiles: options.withFiles,
                accountId: options.accountId,
                videoChannelId: options.videoChannelId,
                videoPlaylistId: options.videoPlaylistId,
                includeLocalVideos: options.includeLocalVideos,
                user: options.user,
                historyOfUser: options.historyOfUser,
                trendingDays
            };
            return VideoModel_1.getAvailableForApi(query, queryOptions, options.countVideos);
        });
    }
    static searchAndPopulateAccountAndServer(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereAnd = [];
            if (options.startDate || options.endDate) {
                const publishedAtRange = {};
                if (options.startDate)
                    publishedAtRange[sequelize_1.Op.gte] = options.startDate;
                if (options.endDate)
                    publishedAtRange[sequelize_1.Op.lte] = options.endDate;
                whereAnd.push({ publishedAt: publishedAtRange });
            }
            if (options.originallyPublishedStartDate || options.originallyPublishedEndDate) {
                const originallyPublishedAtRange = {};
                if (options.originallyPublishedStartDate)
                    originallyPublishedAtRange[sequelize_1.Op.gte] = options.originallyPublishedStartDate;
                if (options.originallyPublishedEndDate)
                    originallyPublishedAtRange[sequelize_1.Op.lte] = options.originallyPublishedEndDate;
                whereAnd.push({ originallyPublishedAt: originallyPublishedAtRange });
            }
            if (options.durationMin || options.durationMax) {
                const durationRange = {};
                if (options.durationMin)
                    durationRange[sequelize_1.Op.gte] = options.durationMin;
                if (options.durationMax)
                    durationRange[sequelize_1.Op.lte] = options.durationMax;
                whereAnd.push({ duration: durationRange });
            }
            const attributesInclude = [];
            const escapedSearch = VideoModel_1.sequelize.escape(options.search);
            const escapedLikeSearch = VideoModel_1.sequelize.escape('%' + options.search + '%');
            if (options.search) {
                const trigramSearch = {
                    id: {
                        [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(' +
                            'SELECT "video"."id" FROM "video" ' +
                            'WHERE ' +
                            'lower(immutable_unaccent("video"."name")) % lower(immutable_unaccent(' + escapedSearch + ')) OR ' +
                            'lower(immutable_unaccent("video"."name")) LIKE lower(immutable_unaccent(' + escapedLikeSearch + '))' +
                            'UNION ALL ' +
                            'SELECT "video"."id" FROM "video" LEFT JOIN "videoTag" ON "videoTag"."videoId" = "video"."id" ' +
                            'INNER JOIN "tag" ON "tag"."id" = "videoTag"."tagId" ' +
                            'WHERE lower("tag"."name") = lower(' + escapedSearch + ')' +
                            ')')
                    }
                };
                if (validator_1.default.isUUID(options.search)) {
                    whereAnd.push({
                        [sequelize_1.Op.or]: [
                            trigramSearch,
                            {
                                uuid: options.search
                            }
                        ]
                    });
                }
                else {
                    whereAnd.push(trigramSearch);
                }
                attributesInclude.push(utils_2.createSimilarityAttribute('VideoModel.name', options.search));
            }
            if (!options.search) {
                attributesInclude.push(sequelize_1.Sequelize.literal('0 as similarity'));
            }
            const query = {
                attributes: {
                    include: attributesInclude
                },
                offset: options.start,
                limit: options.count,
                order: utils_2.getVideoSort(options.sort)
            };
            const serverActor = yield utils_1.getServerActor();
            const queryOptions = {
                followerActorId: serverActor.id,
                serverAccountId: serverActor.Account.id,
                includeLocalVideos: options.includeLocalVideos,
                nsfw: options.nsfw,
                categoryOneOf: options.categoryOneOf,
                licenceOneOf: options.licenceOneOf,
                languageOneOf: options.languageOneOf,
                tagsOneOf: options.tagsOneOf,
                tagsAllOf: options.tagsAllOf,
                user: options.user,
                filter: options.filter,
                baseWhere: whereAnd
            };
            return VideoModel_1.getAvailableForApi(query, queryOptions);
        });
    }
    static load(id, t) {
        const where = utils_2.buildWhereIdOrUUID(id);
        const options = {
            where,
            transaction: t
        };
        return VideoModel_1.scope(ScopeNames.WITH_THUMBNAILS).findOne(options);
    }
    static loadWithBlacklist(id, t) {
        const where = utils_2.buildWhereIdOrUUID(id);
        const options = {
            where,
            transaction: t
        };
        return VideoModel_1.scope([
            ScopeNames.WITH_THUMBNAILS,
            ScopeNames.WITH_BLACKLISTED
        ]).findOne(options);
    }
    static loadWithRights(id, t) {
        const where = utils_2.buildWhereIdOrUUID(id);
        const options = {
            where,
            transaction: t
        };
        return VideoModel_1.scope([
            ScopeNames.WITH_BLACKLISTED,
            ScopeNames.WITH_USER_ID,
            ScopeNames.WITH_THUMBNAILS
        ]).findOne(options);
    }
    static loadOnlyId(id, t) {
        const where = utils_2.buildWhereIdOrUUID(id);
        const options = {
            attributes: ['id'],
            where,
            transaction: t
        };
        return VideoModel_1.scope(ScopeNames.WITH_THUMBNAILS).findOne(options);
    }
    static loadWithFiles(id, t, logging) {
        const where = utils_2.buildWhereIdOrUUID(id);
        const query = {
            where,
            transaction: t,
            logging
        };
        return VideoModel_1.scope([
            ScopeNames.WITH_WEBTORRENT_FILES,
            ScopeNames.WITH_STREAMING_PLAYLISTS,
            ScopeNames.WITH_THUMBNAILS
        ]).findOne(query);
    }
    static loadByUUID(uuid) {
        const options = {
            where: {
                uuid
            }
        };
        return VideoModel_1.scope(ScopeNames.WITH_THUMBNAILS).findOne(options);
    }
    static loadByUrl(url, transaction) {
        const query = {
            where: {
                url
            },
            transaction
        };
        return VideoModel_1.scope(ScopeNames.WITH_THUMBNAILS).findOne(query);
    }
    static loadByUrlAndPopulateAccount(url, transaction) {
        const query = {
            where: {
                url
            },
            transaction
        };
        return VideoModel_1.scope([
            ScopeNames.WITH_ACCOUNT_DETAILS,
            ScopeNames.WITH_WEBTORRENT_FILES,
            ScopeNames.WITH_STREAMING_PLAYLISTS,
            ScopeNames.WITH_THUMBNAILS,
            ScopeNames.WITH_BLACKLISTED
        ]).findOne(query);
    }
    static loadAndPopulateAccountAndServerAndTags(id, t, userId) {
        const where = utils_2.buildWhereIdOrUUID(id);
        const options = {
            order: [['Tags', 'name', 'ASC']],
            where,
            transaction: t
        };
        const scopes = [
            ScopeNames.WITH_TAGS,
            ScopeNames.WITH_BLACKLISTED,
            ScopeNames.WITH_ACCOUNT_DETAILS,
            ScopeNames.WITH_SCHEDULED_UPDATE,
            ScopeNames.WITH_WEBTORRENT_FILES,
            ScopeNames.WITH_STREAMING_PLAYLISTS,
            ScopeNames.WITH_THUMBNAILS
        ];
        if (userId) {
            scopes.push({ method: [ScopeNames.WITH_USER_HISTORY, userId] });
        }
        return VideoModel_1
            .scope(scopes)
            .findOne(options);
    }
    static loadForGetAPI(parameters) {
        const { id, t, userId } = parameters;
        const where = utils_2.buildWhereIdOrUUID(id);
        const options = {
            order: [['Tags', 'name', 'ASC']],
            where,
            transaction: t
        };
        const scopes = [
            ScopeNames.WITH_TAGS,
            ScopeNames.WITH_BLACKLISTED,
            ScopeNames.WITH_ACCOUNT_DETAILS,
            ScopeNames.WITH_SCHEDULED_UPDATE,
            ScopeNames.WITH_THUMBNAILS,
            { method: [ScopeNames.WITH_WEBTORRENT_FILES, true] },
            { method: [ScopeNames.WITH_STREAMING_PLAYLISTS, true] }
        ];
        if (userId) {
            scopes.push({ method: [ScopeNames.WITH_USER_HISTORY, userId] });
        }
        return VideoModel_1
            .scope(scopes)
            .findOne(options);
    }
    static getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const totalLocalVideos = yield VideoModel_1.count({
                where: {
                    remote: false
                }
            });
            const totalVideos = yield VideoModel_1.count();
            let totalLocalVideoViews = yield VideoModel_1.sum('views', {
                where: {
                    remote: false
                }
            });
            if (!totalLocalVideoViews)
                totalLocalVideoViews = 0;
            return {
                totalLocalVideos,
                totalLocalVideoViews,
                totalVideos
            };
        });
    }
    static incrementViews(id, views) {
        return VideoModel_1.increment('views', {
            by: views,
            where: {
                id
            }
        });
    }
    static checkVideoHasInstanceFollow(videoId, followerActorId) {
        const query = 'SELECT 1 FROM "videoShare" ' +
            'INNER JOIN "actorFollow" ON "actorFollow"."targetActorId" = "videoShare"."actorId" ' +
            'WHERE "actorFollow"."actorId" = $followerActorId AND "videoShare"."videoId" = $videoId ' +
            'LIMIT 1';
        const options = {
            type: sequelize_1.QueryTypes.SELECT,
            bind: { followerActorId, videoId },
            raw: true
        };
        return VideoModel_1.sequelize.query(query, options)
            .then(results => results.length === 1);
    }
    static bulkUpdateSupportField(videoChannel, t) {
        const options = {
            where: {
                channelId: videoChannel.id
            },
            transaction: t
        };
        return VideoModel_1.update({ support: videoChannel.support }, options);
    }
    static getAllIdsFromChannel(videoChannel) {
        const query = {
            attributes: ['id'],
            where: {
                channelId: videoChannel.id
            }
        };
        return VideoModel_1.findAll(query)
            .then(videos => videos.map(v => v.id));
    }
    static getRandomFieldSamples(field, threshold, count) {
        return __awaiter(this, void 0, void 0, function* () {
            const serverActor = yield utils_1.getServerActor();
            const followerActorId = serverActor.id;
            const scopeOptions = {
                serverAccountId: serverActor.Account.id,
                followerActorId,
                includeLocalVideos: true,
                attributesType: 'none'
            };
            const query = {
                attributes: [field],
                limit: count,
                group: field,
                having: sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col(field)), { [sequelize_1.Op.gte]: threshold }),
                order: [this.sequelize.random()]
            };
            return VideoModel_1.scope({ method: [ScopeNames.AVAILABLE_FOR_LIST_IDS, scopeOptions] })
                .findAll(query)
                .then(rows => rows.map(r => r[field]));
        });
    }
    static buildTrendingQuery(trendingDays) {
        return {
            attributes: [],
            subQuery: false,
            model: video_views_1.VideoViewModel,
            required: false,
            where: {
                startDate: {
                    [sequelize_1.Op.gte]: new Date(new Date().getTime() - (24 * 3600 * 1000) * trendingDays)
                }
            }
        };
    }
    static getAvailableForApi(query, options, countVideos = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const idsScope = {
                method: [
                    ScopeNames.AVAILABLE_FOR_LIST_IDS, options
                ]
            };
            const countOptions = Object.assign({}, options, { trendingDays: undefined });
            const countQuery = Object.assign({}, query, { attributes: undefined, group: undefined });
            const countScope = {
                method: [
                    ScopeNames.AVAILABLE_FOR_LIST_IDS, countOptions
                ]
            };
            const [count, rows] = yield Promise.all([
                countVideos
                    ? VideoModel_1.scope(countScope).count(countQuery)
                    : Promise.resolve(undefined),
                VideoModel_1.scope(idsScope)
                    .findAll(Object.assign({}, query, { raw: true }))
                    .then(rows => rows.map(r => r.id))
                    .then(ids => VideoModel_1.loadCompleteVideosForApi(ids, query, options))
            ]);
            return {
                data: rows,
                total: count
            };
        });
    }
    static loadCompleteVideosForApi(ids, query, options) {
        if (ids.length === 0)
            return [];
        const secondQuery = {
            offset: 0,
            limit: query.limit,
            attributes: query.attributes,
            order: [
                sequelize_1.Sequelize.literal(ids.map(id => `"VideoModel".id = ${id} DESC`).join(', '))
            ]
        };
        const apiScope = [];
        if (options.user) {
            apiScope.push({ method: [ScopeNames.WITH_USER_HISTORY, options.user.id] });
        }
        apiScope.push({
            method: [
                ScopeNames.FOR_API, {
                    ids,
                    withFiles: options.withFiles,
                    videoPlaylistId: options.videoPlaylistId
                }
            ]
        });
        return VideoModel_1.scope(apiScope).findAll(secondQuery);
    }
    static isPrivacyForFederation(privacy) {
        const castedPrivacy = parseInt(privacy + '', 10);
        return castedPrivacy === shared_1.VideoPrivacy.PUBLIC || castedPrivacy === shared_1.VideoPrivacy.UNLISTED;
    }
    static getCategoryLabel(id) {
        return constants_1.VIDEO_CATEGORIES[id] || 'Misc';
    }
    static getLicenceLabel(id) {
        return constants_1.VIDEO_LICENCES[id] || 'Unknown';
    }
    static getLanguageLabel(id) {
        return constants_1.VIDEO_LANGUAGES[id] || 'Unknown';
    }
    static getPrivacyLabel(id) {
        return constants_1.VIDEO_PRIVACIES[id] || 'Unknown';
    }
    static getStateLabel(id) {
        return constants_1.VIDEO_STATES[id] || 'Unknown';
    }
    isBlacklisted() {
        return !!this.VideoBlacklist;
    }
    isBlocked() {
        return (this.VideoChannel.Account.Actor.Server && this.VideoChannel.Account.Actor.Server.isBlocked()) ||
            this.VideoChannel.Account.isBlocked();
    }
    getQualityFileBy(fun) {
        if (Array.isArray(this.VideoFiles) && this.VideoFiles.length !== 0) {
            const file = fun(this.VideoFiles, file => file.resolution);
            return Object.assign(file, { Video: this });
        }
        if (Array.isArray(this.VideoStreamingPlaylists) && this.VideoStreamingPlaylists.length !== 0) {
            const streamingPlaylistWithVideo = Object.assign(this.VideoStreamingPlaylists[0], { Video: this });
            const file = fun(streamingPlaylistWithVideo.VideoFiles, file => file.resolution);
            return Object.assign(file, { VideoStreamingPlaylist: streamingPlaylistWithVideo });
        }
        return undefined;
    }
    getMaxQualityFile() {
        return this.getQualityFileBy(lodash_1.maxBy);
    }
    getMinQualityFile() {
        return this.getQualityFileBy(lodash_1.minBy);
    }
    getWebTorrentFile(resolution) {
        if (Array.isArray(this.VideoFiles) === false)
            return undefined;
        const file = this.VideoFiles.find(f => f.resolution === resolution);
        if (!file)
            return undefined;
        return Object.assign(file, { Video: this });
    }
    addAndSaveThumbnail(thumbnail, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            thumbnail.videoId = this.id;
            const savedThumbnail = yield thumbnail.save({ transaction });
            if (Array.isArray(this.Thumbnails) === false)
                this.Thumbnails = [];
            if (this.Thumbnails.find(t => t.id === savedThumbnail.id))
                return;
            this.Thumbnails.push(savedThumbnail);
        });
    }
    generateThumbnailName() {
        return this.uuid + '.jpg';
    }
    getMiniature() {
        if (Array.isArray(this.Thumbnails) === false)
            return undefined;
        return this.Thumbnails.find(t => t.type === thumbnail_type_1.ThumbnailType.MINIATURE);
    }
    generatePreviewName() {
        return this.uuid + '.jpg';
    }
    getPreview() {
        if (Array.isArray(this.Thumbnails) === false)
            return undefined;
        return this.Thumbnails.find(t => t.type === thumbnail_type_1.ThumbnailType.PREVIEW);
    }
    isOwned() {
        return this.remote === false;
    }
    getWatchStaticPath() {
        return '/videos/watch/' + this.uuid;
    }
    getEmbedStaticPath() {
        return '/videos/embed/' + this.uuid;
    }
    getMiniatureStaticPath() {
        const thumbnail = this.getMiniature();
        if (!thumbnail)
            return null;
        return path_1.join(constants_1.STATIC_PATHS.THUMBNAILS, thumbnail.filename);
    }
    getPreviewStaticPath() {
        const preview = this.getPreview();
        if (!preview)
            return null;
        return path_1.join(constants_1.LAZY_STATIC_PATHS.PREVIEWS, preview.filename);
    }
    toFormattedJSON(options) {
        return video_format_utils_1.videoModelToFormattedJSON(this, options);
    }
    toFormattedDetailsJSON() {
        return video_format_utils_1.videoModelToFormattedDetailsJSON(this);
    }
    getFormattedVideoFilesJSON() {
        const { baseUrlHttp, baseUrlWs } = this.getBaseUrls();
        return video_format_utils_1.videoFilesModelToFormattedJSON(this, baseUrlHttp, baseUrlWs, this.VideoFiles);
    }
    toActivityPubObject() {
        return video_format_utils_1.videoModelToActivityPubObject(this);
    }
    getTruncatedDescription() {
        if (!this.description)
            return null;
        const maxLength = constants_1.CONSTRAINTS_FIELDS.VIDEOS.TRUNCATED_DESCRIPTION.max;
        return core_utils_1.peertubeTruncate(this.description, { length: maxLength });
    }
    getMaxQualityResolution() {
        const file = this.getMaxQualityFile();
        const videoOrPlaylist = file.getVideoOrStreamingPlaylist();
        const originalFilePath = video_paths_1.getVideoFilePath(videoOrPlaylist, file);
        return ffmpeg_utils_1.getVideoFileResolution(originalFilePath);
    }
    getDescriptionAPIPath() {
        return `/api/${constants_1.API_VERSION}/videos/${this.uuid}/description`;
    }
    getHLSPlaylist() {
        if (!this.VideoStreamingPlaylists)
            return undefined;
        const playlist = this.VideoStreamingPlaylists.find(p => p.type === video_streaming_playlist_type_1.VideoStreamingPlaylistType.HLS);
        playlist.Video = this;
        return playlist;
    }
    setHLSPlaylist(playlist) {
        const toAdd = [playlist];
        if (Array.isArray(this.VideoStreamingPlaylists) === false || this.VideoStreamingPlaylists.length === 0) {
            this.VideoStreamingPlaylists = toAdd;
            return;
        }
        this.VideoStreamingPlaylists = this.VideoStreamingPlaylists
            .filter(s => s.type !== video_streaming_playlist_type_1.VideoStreamingPlaylistType.HLS)
            .concat(toAdd);
    }
    removeFile(videoFile, isRedundancy = false) {
        const filePath = video_paths_1.getVideoFilePath(this, videoFile, isRedundancy);
        return fs_extra_1.remove(filePath)
            .catch(err => logger_1.logger.warn('Cannot delete file %s.', filePath, { err }));
    }
    removeTorrent(videoFile) {
        const torrentPath = video_paths_1.getTorrentFilePath(this, videoFile);
        return fs_extra_1.remove(torrentPath)
            .catch(err => logger_1.logger.warn('Cannot delete torrent %s.', torrentPath, { err }));
    }
    removeStreamingPlaylistFiles(streamingPlaylist, isRedundancy = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const directoryPath = video_paths_1.getHLSDirectory(this, isRedundancy);
            yield fs_extra_1.remove(directoryPath);
            if (isRedundancy !== true) {
                let streamingPlaylistWithFiles = streamingPlaylist;
                streamingPlaylistWithFiles.Video = this;
                if (!Array.isArray(streamingPlaylistWithFiles.VideoFiles)) {
                    streamingPlaylistWithFiles.VideoFiles = yield streamingPlaylistWithFiles.$get('VideoFiles');
                }
                yield Promise.all(streamingPlaylistWithFiles.VideoFiles.map(file => streamingPlaylistWithFiles.removeTorrent(file)));
            }
        });
    }
    isOutdated() {
        if (this.isOwned())
            return false;
        return utils_2.isOutdated(this, constants_1.ACTIVITY_PUB.VIDEO_REFRESH_INTERVAL);
    }
    hasPrivacyForFederation() {
        return VideoModel_1.isPrivacyForFederation(this.privacy);
    }
    isNewVideo(newPrivacy) {
        return this.hasPrivacyForFederation() === false && VideoModel_1.isPrivacyForFederation(newPrivacy) === true;
    }
    setAsRefreshed() {
        this.changed('updatedAt', true);
        return this.save();
    }
    requiresAuth() {
        return this.privacy === shared_1.VideoPrivacy.PRIVATE || this.privacy === shared_1.VideoPrivacy.INTERNAL || !!this.VideoBlacklist;
    }
    setPrivacy(newPrivacy) {
        if (this.privacy === shared_1.VideoPrivacy.PRIVATE && newPrivacy !== shared_1.VideoPrivacy.PRIVATE) {
            this.publishedAt = new Date();
        }
        this.privacy = newPrivacy;
    }
    isConfidential() {
        return this.privacy === shared_1.VideoPrivacy.PRIVATE ||
            this.privacy === shared_1.VideoPrivacy.UNLISTED ||
            this.privacy === shared_1.VideoPrivacy.INTERNAL;
    }
    publishIfNeededAndSave(t) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state !== shared_1.VideoState.PUBLISHED) {
                this.state = shared_1.VideoState.PUBLISHED;
                this.publishedAt = new Date();
                yield this.save({ transaction: t });
                return true;
            }
            return false;
        });
    }
    getBaseUrls() {
        if (this.isOwned()) {
            return {
                baseUrlHttp: constants_1.WEBSERVER.URL,
                baseUrlWs: constants_1.WEBSERVER.WS + '://' + constants_1.WEBSERVER.HOSTNAME + ':' + constants_1.WEBSERVER.PORT
            };
        }
        return {
            baseUrlHttp: constants_1.REMOTE_SCHEME.HTTP + '://' + this.VideoChannel.Account.Actor.Server.host,
            baseUrlWs: constants_1.REMOTE_SCHEME.WS + '://' + this.VideoChannel.Account.Actor.Server.host
        };
    }
    getTrackerUrls(baseUrlHttp, baseUrlWs) {
        return [baseUrlWs + '/tracker/socket', baseUrlHttp + '/tracker/announce'];
    }
    getTorrentUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_PATHS.TORRENTS + video_paths_1.getTorrentFileName(this, videoFile);
    }
    getTorrentDownloadUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_DOWNLOAD_PATHS.TORRENTS + video_paths_1.getTorrentFileName(this, videoFile);
    }
    getVideoFileUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_PATHS.WEBSEED + video_paths_1.getVideoFilename(this, videoFile);
    }
    getVideoRedundancyUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_PATHS.REDUNDANCY + video_paths_1.getVideoFilename(this, videoFile);
    }
    getVideoFileDownloadUrl(videoFile, baseUrlHttp) {
        return baseUrlHttp + constants_1.STATIC_DOWNLOAD_PATHS.VIDEOS + video_paths_1.getVideoFilename(this, videoFile);
    }
    getBandwidthBits(videoFile) {
        return Math.ceil((videoFile.size * 8) / this.duration);
    }
};
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(sequelize_typescript_1.DataType.UUIDV4),
    sequelize_typescript_1.IsUUID(4),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.UUID),
    __metadata("design:type", String)
], VideoModel.prototype, "uuid", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoName', value => utils_2.throwIfNotValid(value, videos_1.isVideoNameValid, 'name')),
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], VideoModel.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoCategory', value => utils_2.throwIfNotValid(value, videos_1.isVideoCategoryValid, 'category', true)),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "category", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoLicence', value => utils_2.throwIfNotValid(value, videos_1.isVideoLicenceValid, 'licence', true)),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "licence", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoLanguage', value => utils_2.throwIfNotValid(value, videos_1.isVideoLanguageValid, 'language', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS.LANGUAGE.max)),
    __metadata("design:type", String)
], VideoModel.prototype, "language", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoPrivacy', value => utils_2.throwIfNotValid(value, videos_1.isVideoPrivacyValid, 'privacy')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "privacy", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoNSFW', value => utils_2.throwIfNotValid(value, misc_2.isBooleanValid, 'NSFW boolean')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], VideoModel.prototype, "nsfw", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoDescription', value => utils_2.throwIfNotValid(value, videos_1.isVideoDescriptionValid, 'description', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS.DESCRIPTION.max)),
    __metadata("design:type", String)
], VideoModel.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoSupport', value => utils_2.throwIfNotValid(value, videos_1.isVideoSupportValid, 'support', true)),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS.SUPPORT.max)),
    __metadata("design:type", String)
], VideoModel.prototype, "support", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoDuration', value => utils_2.throwIfNotValid(value, videos_1.isVideoDurationValid, 'duration')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "duration", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(0),
    sequelize_typescript_1.IsInt,
    sequelize_typescript_1.Min(0),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "views", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(0),
    sequelize_typescript_1.IsInt,
    sequelize_typescript_1.Min(0),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "likes", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(0),
    sequelize_typescript_1.IsInt,
    sequelize_typescript_1.Min(0),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "dislikes", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], VideoModel.prototype, "remote", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('VideoUrl', value => utils_2.throwIfNotValid(value, misc_1.isActivityPubUrlValid, 'url')),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(constants_1.CONSTRAINTS_FIELDS.VIDEOS.URL.max)),
    __metadata("design:type", String)
], VideoModel.prototype, "url", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], VideoModel.prototype, "commentsEnabled", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], VideoModel.prototype, "downloadEnabled", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    __metadata("design:type", Boolean)
], VideoModel.prototype, "waitTranscoding", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Is('VideoState', value => utils_2.throwIfNotValid(value, videos_1.isVideoStateValid, 'state')),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "state", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], VideoModel.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], VideoModel.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(sequelize_typescript_1.DataType.NOW),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], VideoModel.prototype, "publishedAt", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Default(null),
    sequelize_typescript_1.Column,
    __metadata("design:type", Date)
], VideoModel.prototype, "originallyPublishedAt", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => video_channel_1.VideoChannelModel),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], VideoModel.prototype, "channelId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => video_channel_1.VideoChannelModel, {
        foreignKey: {
            allowNull: true
        },
        hooks: true
    }),
    __metadata("design:type", video_channel_1.VideoChannelModel)
], VideoModel.prototype, "VideoChannel", void 0);
__decorate([
    sequelize_typescript_1.BelongsToMany(() => tag_1.TagModel, {
        foreignKey: 'videoId',
        through: () => video_tag_1.VideoTagModel,
        onDelete: 'CASCADE'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "Tags", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => thumbnail_1.ThumbnailModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: true
        },
        hooks: true,
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "Thumbnails", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_playlist_element_1.VideoPlaylistElementModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: true
        },
        onDelete: 'set null'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoPlaylistElements", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_abuse_1.VideoAbuseModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoAbuses", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_file_1.VideoFileModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: true
        },
        hooks: true,
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoFiles", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_streaming_playlist_1.VideoStreamingPlaylistModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        hooks: true,
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoStreamingPlaylists", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_share_1.VideoShareModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoShares", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => account_video_rate_1.AccountVideoRateModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "AccountVideoRates", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_comment_1.VideoCommentModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade',
        hooks: true
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoComments", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_views_1.VideoViewModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoViews", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => user_video_history_1.UserVideoHistoryModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "UserVideoHistories", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => schedule_video_update_1.ScheduleVideoUpdateModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", schedule_video_update_1.ScheduleVideoUpdateModel)
], VideoModel.prototype, "ScheduleVideoUpdate", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => video_blacklist_1.VideoBlacklistModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade'
    }),
    __metadata("design:type", video_blacklist_1.VideoBlacklistModel)
], VideoModel.prototype, "VideoBlacklist", void 0);
__decorate([
    sequelize_typescript_1.HasOne(() => video_import_1.VideoImportModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: true
        },
        onDelete: 'set null'
    }),
    __metadata("design:type", video_import_1.VideoImportModel)
], VideoModel.prototype, "VideoImport", void 0);
__decorate([
    sequelize_typescript_1.HasMany(() => video_caption_1.VideoCaptionModel, {
        foreignKey: {
            name: 'videoId',
            allowNull: false
        },
        onDelete: 'cascade',
        hooks: true,
        ['separate']: true
    }),
    __metadata("design:type", Array)
], VideoModel.prototype, "VideoCaptions", void 0);
__decorate([
    sequelize_typescript_1.BeforeDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VideoModel, "sendDelete", null);
__decorate([
    sequelize_typescript_1.BeforeDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VideoModel]),
    __metadata("design:returntype", Promise)
], VideoModel, "removeFiles", null);
VideoModel = VideoModel_1 = __decorate([
    sequelize_typescript_1.Scopes(() => ({
        [ScopeNames.FOR_API]: (options) => {
            const query = {
                include: [
                    {
                        model: video_channel_1.VideoChannelModel.scope({
                            method: [
                                video_channel_1.ScopeNames.SUMMARY, {
                                    withAccount: true,
                                    withAccountBlockerIds: options.withAccountBlockerIds
                                }
                            ]
                        }),
                        required: true
                    },
                    {
                        attributes: ['type', 'filename'],
                        model: thumbnail_1.ThumbnailModel,
                        required: false
                    }
                ]
            };
            if (options.ids) {
                query.where = {
                    id: {
                        [sequelize_1.Op.in]: options.ids
                    }
                };
            }
            if (options.withFiles === true) {
                query.include.push({
                    model: video_file_1.VideoFileModel.unscoped(),
                    required: true
                });
            }
            if (options.videoPlaylistId) {
                query.include.push({
                    model: video_playlist_element_1.VideoPlaylistElementModel.unscoped(),
                    required: true,
                    where: {
                        videoPlaylistId: options.videoPlaylistId
                    }
                });
            }
            return query;
        },
        [ScopeNames.AVAILABLE_FOR_LIST_IDS]: (options) => {
            const whereAnd = options.baseWhere ? [].concat(options.baseWhere) : [];
            const query = {
                raw: true,
                include: []
            };
            const attributesType = options.attributesType || 'id';
            if (attributesType === 'id')
                query.attributes = ['id'];
            else if (attributesType === 'none')
                query.attributes = [];
            whereAnd.push({
                id: {
                    [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(SELECT "videoBlacklist"."videoId" FROM "videoBlacklist")')
                }
            });
            if (options.serverAccountId) {
                whereAnd.push({
                    channelId: {
                        [sequelize_1.Op.notIn]: sequelize_1.Sequelize.literal('(' +
                            'SELECT id FROM "videoChannel" WHERE "accountId" IN (' +
                            utils_2.buildBlockedAccountSQL(options.serverAccountId, options.user ? options.user.Account.id : undefined) +
                            ')' +
                            ')')
                    }
                });
            }
            if (!options.filter || options.filter !== 'all-local') {
                const publishWhere = {
                    [sequelize_1.Op.or]: [
                        {
                            state: shared_1.VideoState.PUBLISHED
                        },
                        {
                            [sequelize_1.Op.and]: {
                                state: shared_1.VideoState.TO_TRANSCODE,
                                waitTranscoding: false
                            }
                        }
                    ]
                };
                whereAnd.push(publishWhere);
                if (options.user) {
                    const privacyWhere = {
                        [sequelize_1.Op.or]: [
                            {
                                privacy: shared_1.VideoPrivacy.INTERNAL
                            },
                            {
                                privacy: shared_1.VideoPrivacy.PUBLIC
                            }
                        ]
                    };
                    whereAnd.push(privacyWhere);
                }
                else {
                    const privacyWhere = { privacy: shared_1.VideoPrivacy.PUBLIC };
                    whereAnd.push(privacyWhere);
                }
            }
            if (options.videoPlaylistId) {
                query.include.push({
                    attributes: [],
                    model: video_playlist_element_1.VideoPlaylistElementModel.unscoped(),
                    required: true,
                    where: {
                        videoPlaylistId: options.videoPlaylistId
                    }
                });
                query.subQuery = false;
            }
            if (options.filter && (options.filter === 'local' || options.filter === 'all-local')) {
                whereAnd.push({
                    remote: false
                });
            }
            if (options.accountId || options.videoChannelId) {
                const videoChannelInclude = {
                    attributes: [],
                    model: video_channel_1.VideoChannelModel.unscoped(),
                    required: true
                };
                if (options.videoChannelId) {
                    videoChannelInclude.where = {
                        id: options.videoChannelId
                    };
                }
                if (options.accountId) {
                    const accountInclude = {
                        attributes: [],
                        model: account_1.AccountModel.unscoped(),
                        required: true
                    };
                    accountInclude.where = { id: options.accountId };
                    videoChannelInclude.include = [accountInclude];
                }
                query.include.push(videoChannelInclude);
            }
            if (options.followerActorId) {
                let localVideosReq = '';
                if (options.includeLocalVideos === true) {
                    localVideosReq = ' UNION ALL SELECT "video"."id" FROM "video" WHERE remote IS FALSE';
                }
                const actorIdNumber = parseInt(options.followerActorId.toString(), 10);
                whereAnd.push({
                    id: {
                        [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(' +
                            'SELECT "videoShare"."videoId" AS "id" FROM "videoShare" ' +
                            'INNER JOIN "actorFollow" ON "actorFollow"."targetActorId" = "videoShare"."actorId" ' +
                            'WHERE "actorFollow"."actorId" = ' + actorIdNumber +
                            ' UNION ALL ' +
                            'SELECT "video"."id" AS "id" FROM "video" ' +
                            'INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId" ' +
                            'INNER JOIN "account" ON "account"."id" = "videoChannel"."accountId" ' +
                            'INNER JOIN "actor" ON "account"."actorId" = "actor"."id" ' +
                            'INNER JOIN "actorFollow" ON "actorFollow"."targetActorId" = "actor"."id" ' +
                            'WHERE "actorFollow"."actorId" = ' + actorIdNumber +
                            localVideosReq +
                            ')')
                    }
                });
            }
            if (options.withFiles === true) {
                whereAnd.push({
                    id: {
                        [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(SELECT "videoId" FROM "videoFile")')
                    }
                });
            }
            if (options.tagsAllOf || options.tagsOneOf) {
                if (options.tagsOneOf) {
                    const tagsOneOfLower = options.tagsOneOf.map(t => t.toLowerCase());
                    whereAnd.push({
                        id: {
                            [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(' +
                                'SELECT "videoId" FROM "videoTag" ' +
                                'INNER JOIN "tag" ON "tag"."id" = "videoTag"."tagId" ' +
                                'WHERE lower("tag"."name") IN (' + utils_2.createSafeIn(VideoModel_1, tagsOneOfLower) + ')' +
                                ')')
                        }
                    });
                }
                if (options.tagsAllOf) {
                    const tagsAllOfLower = options.tagsAllOf.map(t => t.toLowerCase());
                    whereAnd.push({
                        id: {
                            [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(' +
                                'SELECT "videoId" FROM "videoTag" ' +
                                'INNER JOIN "tag" ON "tag"."id" = "videoTag"."tagId" ' +
                                'WHERE lower("tag"."name") IN (' + utils_2.createSafeIn(VideoModel_1, tagsAllOfLower) + ')' +
                                'GROUP BY "videoTag"."videoId" HAVING COUNT(*) = ' + tagsAllOfLower.length +
                                ')')
                        }
                    });
                }
            }
            if (options.nsfw === true || options.nsfw === false) {
                whereAnd.push({ nsfw: options.nsfw });
            }
            if (options.categoryOneOf) {
                whereAnd.push({
                    category: {
                        [sequelize_1.Op.or]: options.categoryOneOf
                    }
                });
            }
            if (options.licenceOneOf) {
                whereAnd.push({
                    licence: {
                        [sequelize_1.Op.or]: options.licenceOneOf
                    }
                });
            }
            if (options.languageOneOf) {
                let videoLanguages = options.languageOneOf;
                if (options.languageOneOf.find(l => l === '_unknown')) {
                    videoLanguages = videoLanguages.concat([null]);
                }
                whereAnd.push({
                    [sequelize_1.Op.or]: [
                        {
                            language: {
                                [sequelize_1.Op.or]: videoLanguages
                            }
                        },
                        {
                            id: {
                                [sequelize_1.Op.in]: sequelize_1.Sequelize.literal('(' +
                                    'SELECT "videoId" FROM "videoCaption" ' +
                                    'WHERE "language" IN (' + utils_2.createSafeIn(VideoModel_1, options.languageOneOf) + ') ' +
                                    ')')
                            }
                        }
                    ]
                });
            }
            if (options.trendingDays) {
                query.include.push(VideoModel_1.buildTrendingQuery(options.trendingDays));
                query.subQuery = false;
            }
            if (options.historyOfUser) {
                query.include.push({
                    model: user_video_history_1.UserVideoHistoryModel,
                    required: true,
                    where: {
                        userId: options.historyOfUser.id
                    }
                });
                query.subQuery = false;
            }
            query.where = {
                [sequelize_1.Op.and]: whereAnd
            };
            return query;
        },
        [ScopeNames.WITH_THUMBNAILS]: {
            include: [
                {
                    model: thumbnail_1.ThumbnailModel,
                    required: false
                }
            ]
        },
        [ScopeNames.WITH_USER_ID]: {
            include: [
                {
                    attributes: ['accountId'],
                    model: video_channel_1.VideoChannelModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: ['userId'],
                            model: account_1.AccountModel.unscoped(),
                            required: true
                        }
                    ]
                }
            ]
        },
        [ScopeNames.WITH_ACCOUNT_DETAILS]: {
            include: [
                {
                    model: video_channel_1.VideoChannelModel.unscoped(),
                    required: true,
                    include: [
                        {
                            attributes: {
                                exclude: ['privateKey', 'publicKey']
                            },
                            model: actor_1.ActorModel.unscoped(),
                            required: true,
                            include: [
                                {
                                    attributes: ['host'],
                                    model: server_1.ServerModel.unscoped(),
                                    required: false
                                },
                                {
                                    model: avatar_1.AvatarModel.unscoped(),
                                    required: false
                                }
                            ]
                        },
                        {
                            model: account_1.AccountModel.unscoped(),
                            required: true,
                            include: [
                                {
                                    model: actor_1.ActorModel.unscoped(),
                                    attributes: {
                                        exclude: ['privateKey', 'publicKey']
                                    },
                                    required: true,
                                    include: [
                                        {
                                            attributes: ['host'],
                                            model: server_1.ServerModel.unscoped(),
                                            required: false
                                        },
                                        {
                                            model: avatar_1.AvatarModel.unscoped(),
                                            required: false
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        [ScopeNames.WITH_TAGS]: {
            include: [tag_1.TagModel]
        },
        [ScopeNames.WITH_BLACKLISTED]: {
            include: [
                {
                    attributes: ['id', 'reason', 'unfederated'],
                    model: video_blacklist_1.VideoBlacklistModel,
                    required: false
                }
            ]
        },
        [ScopeNames.WITH_WEBTORRENT_FILES]: (withRedundancies = false) => {
            let subInclude = [];
            if (withRedundancies === true) {
                subInclude = [
                    {
                        attributes: ['fileUrl'],
                        model: video_redundancy_1.VideoRedundancyModel.unscoped(),
                        required: false
                    }
                ];
            }
            return {
                include: [
                    {
                        model: video_file_1.VideoFileModel.unscoped(),
                        separate: true,
                        required: false,
                        include: subInclude
                    }
                ]
            };
        },
        [ScopeNames.WITH_STREAMING_PLAYLISTS]: (withRedundancies = false) => {
            const subInclude = [
                {
                    model: video_file_1.VideoFileModel.unscoped(),
                    required: false
                }
            ];
            if (withRedundancies === true) {
                subInclude.push({
                    attributes: ['fileUrl'],
                    model: video_redundancy_1.VideoRedundancyModel.unscoped(),
                    required: false
                });
            }
            return {
                include: [
                    {
                        model: video_streaming_playlist_1.VideoStreamingPlaylistModel.unscoped(),
                        separate: true,
                        required: false,
                        include: subInclude
                    }
                ]
            };
        },
        [ScopeNames.WITH_SCHEDULED_UPDATE]: {
            include: [
                {
                    model: schedule_video_update_1.ScheduleVideoUpdateModel.unscoped(),
                    required: false
                }
            ]
        },
        [ScopeNames.WITH_USER_HISTORY]: (userId) => {
            return {
                include: [
                    {
                        attributes: ['currentTime'],
                        model: user_video_history_1.UserVideoHistoryModel.unscoped(),
                        required: false,
                        where: {
                            userId
                        }
                    }
                ]
            };
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'video',
        indexes
    })
], VideoModel);
exports.VideoModel = VideoModel;
