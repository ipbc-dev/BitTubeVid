"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateVideoChannelFromVideoObject = exports.fetchRemoteVideoDescription = exports.getOrCreateVideoAndAccountAndChannel = exports.fetchRemoteVideo = exports.federateVideoIfNeeded = exports.refreshVideoIfNeeded = exports.updateVideoFromAP = void 0;
const tslib_1 = require("tslib");
const Bluebird = require("bluebird");
const magnetUtil = require("magnet-uri");
const index_1 = require("../../../shared/index");
const videos_1 = require("../../../shared/models/videos");
const videos_2 = require("../../helpers/custom-validators/activitypub/videos");
const videos_3 = require("../../helpers/custom-validators/videos");
const database_utils_1 = require("../../helpers/database-utils");
const logger_1 = require("../../helpers/logger");
const requests_1 = require("../../helpers/requests");
const constants_1 = require("../../initializers/constants");
const tag_1 = require("../../models/video/tag");
const video_1 = require("../../models/video/video");
const video_file_1 = require("../../models/video/video-file");
const actor_1 = require("./actor");
const video_comments_1 = require("./video-comments");
const crawl_1 = require("./crawl");
const send_1 = require("./send");
const misc_1 = require("../../helpers/custom-validators/misc");
const video_caption_1 = require("../../models/video/video-caption");
const job_queue_1 = require("../job-queue");
const video_rates_1 = require("./video-rates");
const share_1 = require("./share");
const video_2 = require("../../helpers/video");
const activitypub_1 = require("../../helpers/activitypub");
const notifier_1 = require("../notifier");
const video_streaming_playlist_1 = require("../../models/video/video-streaming-playlist");
const video_streaming_playlist_type_1 = require("../../../shared/models/videos/video-streaming-playlist.type");
const account_video_rate_1 = require("../../models/account/account-video-rate");
const video_share_1 = require("../../models/video/video-share");
const video_comment_1 = require("../../models/video/video-comment");
const database_1 = require("../../initializers/database");
const thumbnail_1 = require("../thumbnail");
const thumbnail_type_1 = require("../../../shared/models/videos/thumbnail.type");
const path_1 = require("path");
const video_blacklist_1 = require("../video-blacklist");
const files_cache_1 = require("../files-cache");
const lodash_1 = require("lodash");
function federateVideoIfNeeded(videoArg, isNewVideo, transaction) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = videoArg;
        if ((video.isBlacklisted() === false || (isNewVideo === false && video.VideoBlacklist.unfederated === false)) &&
            video.hasPrivacyForFederation() && video.state === index_1.VideoState.PUBLISHED) {
            if (misc_1.isArray(video.VideoCaptions) === false) {
                video.VideoCaptions = yield video.$get('VideoCaptions', {
                    attributes: ['language'],
                    transaction
                });
            }
            if (isNewVideo) {
                yield send_1.sendCreateVideo(video, transaction);
                yield share_1.shareVideoByServerAndChannel(video, transaction);
            }
            else {
                yield send_1.sendUpdateVideo(video, transaction);
            }
        }
    });
}
exports.federateVideoIfNeeded = federateVideoIfNeeded;
function fetchRemoteVideo(videoUrl) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = {
            uri: videoUrl,
            method: 'GET',
            json: true,
            activityPub: true
        };
        logger_1.logger.info('Fetching remote video %s.', videoUrl);
        const { response, body } = yield requests_1.doRequest(options);
        if (videos_2.sanitizeAndCheckVideoTorrentObject(body) === false || activitypub_1.checkUrlsSameHost(body.id, videoUrl) !== true) {
            logger_1.logger.debug('Remote video JSON is not valid.', { body });
            return { response, videoObject: undefined };
        }
        return { response, videoObject: body };
    });
}
exports.fetchRemoteVideo = fetchRemoteVideo;
function fetchRemoteVideoDescription(video) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const host = video.VideoChannel.Account.Actor.Server.host;
        const path = video.getDescriptionAPIPath();
        const options = {
            uri: constants_1.REMOTE_SCHEME.HTTP + '://' + host + path,
            json: true
        };
        const { body } = yield requests_1.doRequest(options);
        return body.description ? body.description : '';
    });
}
exports.fetchRemoteVideoDescription = fetchRemoteVideoDescription;
function getOrCreateVideoChannelFromVideoObject(videoObject) {
    const channel = videoObject.attributedTo.find(a => a.type === 'Group');
    if (!channel)
        throw new Error('Cannot find associated video channel to video ' + videoObject.url);
    if (activitypub_1.checkUrlsSameHost(channel.id, videoObject.id) !== true) {
        throw new Error(`Video channel url ${channel.id} does not have the same host than video object id ${videoObject.id}`);
    }
    return actor_1.getOrCreateActorAndServerAndModel(channel.id, 'all');
}
exports.getOrCreateVideoChannelFromVideoObject = getOrCreateVideoChannelFromVideoObject;
function syncVideoExternalAttributes(video, fetchedVideo, syncParam) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Adding likes/dislikes/shares/comments of video %s.', video.uuid);
        const jobPayloads = [];
        if (syncParam.likes === true) {
            const handler = items => video_rates_1.createRates(items, video, 'like');
            const cleaner = crawlStartDate => account_video_rate_1.AccountVideoRateModel.cleanOldRatesOf(video.id, 'like', crawlStartDate);
            yield crawl_1.crawlCollectionPage(fetchedVideo.likes, handler, cleaner)
                .catch(err => logger_1.logger.error('Cannot add likes of video %s.', video.uuid, { err, rootUrl: fetchedVideo.likes }));
        }
        else {
            jobPayloads.push({ uri: fetchedVideo.likes, videoId: video.id, type: 'video-likes' });
        }
        if (syncParam.dislikes === true) {
            const handler = items => video_rates_1.createRates(items, video, 'dislike');
            const cleaner = crawlStartDate => account_video_rate_1.AccountVideoRateModel.cleanOldRatesOf(video.id, 'dislike', crawlStartDate);
            yield crawl_1.crawlCollectionPage(fetchedVideo.dislikes, handler, cleaner)
                .catch(err => logger_1.logger.error('Cannot add dislikes of video %s.', video.uuid, { err, rootUrl: fetchedVideo.dislikes }));
        }
        else {
            jobPayloads.push({ uri: fetchedVideo.dislikes, videoId: video.id, type: 'video-dislikes' });
        }
        if (syncParam.shares === true) {
            const handler = items => share_1.addVideoShares(items, video);
            const cleaner = crawlStartDate => video_share_1.VideoShareModel.cleanOldSharesOf(video.id, crawlStartDate);
            yield crawl_1.crawlCollectionPage(fetchedVideo.shares, handler, cleaner)
                .catch(err => logger_1.logger.error('Cannot add shares of video %s.', video.uuid, { err, rootUrl: fetchedVideo.shares }));
        }
        else {
            jobPayloads.push({ uri: fetchedVideo.shares, videoId: video.id, type: 'video-shares' });
        }
        if (syncParam.comments === true) {
            const handler = items => video_comments_1.addVideoComments(items);
            const cleaner = crawlStartDate => video_comment_1.VideoCommentModel.cleanOldCommentsOf(video.id, crawlStartDate);
            yield crawl_1.crawlCollectionPage(fetchedVideo.comments, handler, cleaner)
                .catch(err => logger_1.logger.error('Cannot add comments of video %s.', video.uuid, { err, rootUrl: fetchedVideo.comments }));
        }
        else {
            jobPayloads.push({ uri: fetchedVideo.comments, videoId: video.id, type: 'video-comments' });
        }
        yield Bluebird.map(jobPayloads, payload => job_queue_1.JobQueue.Instance.createJobWithPromise({ type: 'activitypub-http-fetcher', payload }));
    });
}
function getOrCreateVideoAndAccountAndChannel(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const syncParam = options.syncParam || { likes: true, dislikes: true, shares: true, comments: true, thumbnail: true, refreshVideo: false };
        const fetchType = options.fetchType || 'all';
        const allowRefresh = options.allowRefresh !== false;
        const videoUrl = activitypub_1.getAPId(options.videoObject);
        let videoFromDatabase = yield video_2.fetchVideoByUrl(videoUrl, fetchType);
        if (videoFromDatabase) {
            if (allowRefresh === true && videoFromDatabase.isOutdated()) {
                const refreshOptions = {
                    video: videoFromDatabase,
                    fetchedType: fetchType,
                    syncParam
                };
                if (syncParam.refreshVideo === true) {
                    videoFromDatabase = yield refreshVideoIfNeeded(refreshOptions);
                }
                else {
                    yield job_queue_1.JobQueue.Instance.createJobWithPromise({
                        type: 'activitypub-refresher',
                        payload: { type: 'video', url: videoFromDatabase.url }
                    });
                }
            }
            return { video: videoFromDatabase, created: false };
        }
        const { videoObject: fetchedVideo } = yield fetchRemoteVideo(videoUrl);
        if (!fetchedVideo)
            throw new Error('Cannot fetch remote video with url: ' + videoUrl);
        const actor = yield getOrCreateVideoChannelFromVideoObject(fetchedVideo);
        const videoChannel = actor.VideoChannel;
        try {
            const { autoBlacklisted, videoCreated } = yield database_utils_1.retryTransactionWrapper(createVideo, fetchedVideo, videoChannel, syncParam.thumbnail);
            yield syncVideoExternalAttributes(videoCreated, fetchedVideo, syncParam);
            return { video: videoCreated, created: true, autoBlacklisted };
        }
        catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                const fallbackVideo = yield video_2.fetchVideoByUrl(videoUrl, fetchType);
                if (fallbackVideo)
                    return { video: fallbackVideo, created: false };
            }
            throw err;
        }
    });
}
exports.getOrCreateVideoAndAccountAndChannel = getOrCreateVideoAndAccountAndChannel;
function updateVideoFromAP(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { video, videoObject, account, channel, overrideTo } = options;
        logger_1.logger.debug('Updating remote video "%s".', options.videoObject.uuid, { account, channel });
        let videoFieldsSave;
        const wasPrivateVideo = video.privacy === videos_1.VideoPrivacy.PRIVATE;
        const wasUnlistedVideo = video.privacy === videos_1.VideoPrivacy.UNLISTED;
        try {
            let thumbnailModel;
            try {
                thumbnailModel = yield thumbnail_1.createVideoMiniatureFromUrl(getThumbnailFromIcons(videoObject).url, video, thumbnail_type_1.ThumbnailType.MINIATURE);
            }
            catch (err) {
                logger_1.logger.warn('Cannot generate thumbnail of %s.', videoObject.id, { err });
            }
            const videoUpdated = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const sequelizeOptions = { transaction: t };
                videoFieldsSave = video.toJSON();
                const videoChannel = video.VideoChannel;
                if (videoChannel.Account.id !== account.id) {
                    throw new Error('Account ' + account.Actor.url + ' does not own video channel ' + videoChannel.Actor.url);
                }
                const to = overrideTo || videoObject.to;
                const videoData = yield videoActivityObjectToDBAttributes(channel, videoObject, to);
                video.name = videoData.name;
                video.uuid = videoData.uuid;
                video.url = videoData.url;
                video.category = videoData.category;
                video.licence = videoData.licence;
                video.language = videoData.language;
                video.description = videoData.description;
                video.support = videoData.support;
                video.nsfw = videoData.nsfw;
                video.commentsEnabled = videoData.commentsEnabled;
                video.downloadEnabled = videoData.downloadEnabled;
                video.waitTranscoding = videoData.waitTranscoding;
                video.state = videoData.state;
                video.duration = videoData.duration;
                video.createdAt = videoData.createdAt;
                video.publishedAt = videoData.publishedAt;
                video.originallyPublishedAt = videoData.originallyPublishedAt;
                video.privacy = videoData.privacy;
                video.channelId = videoData.channelId;
                video.views = videoData.views;
                const videoUpdated = yield video.save(sequelizeOptions);
                if (thumbnailModel)
                    yield videoUpdated.addAndSaveThumbnail(thumbnailModel, t);
                if (videoUpdated.getPreview()) {
                    const previewUrl = videoUpdated.getPreview().getFileUrl(videoUpdated);
                    const previewModel = thumbnail_1.createPlaceholderThumbnail(previewUrl, video, thumbnail_type_1.ThumbnailType.PREVIEW, constants_1.PREVIEWS_SIZE);
                    yield videoUpdated.addAndSaveThumbnail(previewModel, t);
                }
                {
                    const videoFileAttributes = videoFileActivityUrlToDBAttributes(videoUpdated, videoObject.url);
                    const newVideoFiles = videoFileAttributes.map(a => new video_file_1.VideoFileModel(a));
                    const destroyTasks = database_utils_1.deleteNonExistingModels(videoUpdated.VideoFiles, newVideoFiles, t);
                    yield Promise.all(destroyTasks);
                    const upsertTasks = newVideoFiles.map(f => video_file_1.VideoFileModel.customUpsert(f, 'video', t));
                    videoUpdated.VideoFiles = yield Promise.all(upsertTasks);
                }
                {
                    const streamingPlaylistAttributes = streamingPlaylistActivityUrlToDBAttributes(videoUpdated, videoObject, videoUpdated.VideoFiles);
                    const newStreamingPlaylists = streamingPlaylistAttributes.map(a => new video_streaming_playlist_1.VideoStreamingPlaylistModel(a));
                    const destroyTasks = database_utils_1.deleteNonExistingModels(videoUpdated.VideoStreamingPlaylists, newStreamingPlaylists, t);
                    yield Promise.all(destroyTasks);
                    let oldStreamingPlaylistFiles = [];
                    for (const videoStreamingPlaylist of videoUpdated.VideoStreamingPlaylists) {
                        oldStreamingPlaylistFiles = oldStreamingPlaylistFiles.concat(videoStreamingPlaylist.VideoFiles);
                    }
                    videoUpdated.VideoStreamingPlaylists = [];
                    for (const playlistAttributes of streamingPlaylistAttributes) {
                        const streamingPlaylistModel = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.upsert(playlistAttributes, { returning: true, transaction: t })
                            .then(([streamingPlaylist]) => streamingPlaylist);
                        const newVideoFiles = videoFileActivityUrlToDBAttributes(streamingPlaylistModel, playlistAttributes.tagAPObject)
                            .map(a => new video_file_1.VideoFileModel(a));
                        const destroyTasks = database_utils_1.deleteNonExistingModels(oldStreamingPlaylistFiles, newVideoFiles, t);
                        yield Promise.all(destroyTasks);
                        const upsertTasks = newVideoFiles.map(f => video_file_1.VideoFileModel.customUpsert(f, 'streaming-playlist', t));
                        streamingPlaylistModel.VideoFiles = yield Promise.all(upsertTasks);
                        videoUpdated.VideoStreamingPlaylists.push(streamingPlaylistModel);
                    }
                }
                {
                    const tags = videoObject.tag
                        .filter(isAPHashTagObject)
                        .map(tag => tag.name);
                    const tagInstances = yield tag_1.TagModel.findOrCreateTags(tags, t);
                    yield videoUpdated.$set('Tags', tagInstances, sequelizeOptions);
                }
                {
                    yield video_caption_1.VideoCaptionModel.deleteAllCaptionsOfRemoteVideo(videoUpdated.id, t);
                    const videoCaptionsPromises = videoObject.subtitleLanguage.map(c => {
                        return video_caption_1.VideoCaptionModel.insertOrReplaceLanguage(videoUpdated.id, c.identifier, c.url, t);
                    });
                    yield Promise.all(videoCaptionsPromises);
                }
                return videoUpdated;
            }));
            yield video_blacklist_1.autoBlacklistVideoIfNeeded({
                video: videoUpdated,
                user: undefined,
                isRemote: true,
                isNew: false,
                transaction: undefined
            });
            if (wasPrivateVideo || wasUnlistedVideo)
                notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(videoUpdated);
            logger_1.logger.info('Remote video with uuid %s updated', videoObject.uuid);
            return videoUpdated;
        }
        catch (err) {
            if (video !== undefined && videoFieldsSave !== undefined) {
                database_utils_1.resetSequelizeInstance(video, videoFieldsSave);
            }
            logger_1.logger.debug('Cannot update the remote video.', { err });
            throw err;
        }
    });
}
exports.updateVideoFromAP = updateVideoFromAP;
function refreshVideoIfNeeded(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!options.video.isOutdated())
            return options.video;
        const video = options.fetchedType === 'all'
            ? options.video
            : yield video_1.VideoModel.loadByUrlAndPopulateAccount(options.video.url);
        try {
            const { response, videoObject } = yield fetchRemoteVideo(video.url);
            if (response.statusCode === 404) {
                logger_1.logger.info('Cannot refresh remote video %s: video does not exist anymore. Deleting it.', video.url);
                yield video.destroy();
                return undefined;
            }
            if (videoObject === undefined) {
                logger_1.logger.warn('Cannot refresh remote video %s: invalid body.', video.url);
                yield video.setAsRefreshed();
                return video;
            }
            const channelActor = yield getOrCreateVideoChannelFromVideoObject(videoObject);
            const updateOptions = {
                video,
                videoObject,
                account: channelActor.VideoChannel.Account,
                channel: channelActor.VideoChannel
            };
            yield database_utils_1.retryTransactionWrapper(updateVideoFromAP, updateOptions);
            yield syncVideoExternalAttributes(video, videoObject, options.syncParam);
            files_cache_1.ActorFollowScoreCache.Instance.addGoodServerId(video.VideoChannel.Actor.serverId);
            return video;
        }
        catch (err) {
            logger_1.logger.warn('Cannot refresh video %s.', options.video.url, { err });
            files_cache_1.ActorFollowScoreCache.Instance.addBadServerId(video.VideoChannel.Actor.serverId);
            yield video.setAsRefreshed();
            return video;
        }
    });
}
exports.refreshVideoIfNeeded = refreshVideoIfNeeded;
function isAPVideoUrlObject(url) {
    const mimeTypes = Object.keys(constants_1.MIMETYPES.VIDEO.MIMETYPE_EXT);
    const urlMediaType = url.mediaType;
    return mimeTypes.includes(urlMediaType) && urlMediaType.startsWith('video/');
}
function isAPStreamingPlaylistUrlObject(url) {
    return url && url.mediaType === 'application/x-mpegURL';
}
function isAPPlaylistSegmentHashesUrlObject(tag) {
    return tag && tag.name === 'sha256' && tag.type === 'Link' && tag.mediaType === 'application/json';
}
function isAPMagnetUrlObject(url) {
    return url && url.mediaType === 'application/x-bittorrent;x-scheme-handler/magnet';
}
function isAPHashTagObject(url) {
    return url && url.type === 'Hashtag';
}
function createVideo(videoObject, channel, waitThumbnail = false) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.debug('Adding remote video %s.', videoObject.id);
        const videoData = yield videoActivityObjectToDBAttributes(channel, videoObject, videoObject.to);
        const video = video_1.VideoModel.build(videoData);
        const promiseThumbnail = thumbnail_1.createVideoMiniatureFromUrl(getThumbnailFromIcons(videoObject).url, video, thumbnail_type_1.ThumbnailType.MINIATURE)
            .catch(err => {
            logger_1.logger.error('Cannot create miniature from url.', { err });
            return undefined;
        });
        let thumbnailModel;
        if (waitThumbnail === true) {
            thumbnailModel = yield promiseThumbnail;
        }
        const { autoBlacklisted, videoCreated } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const sequelizeOptions = { transaction: t };
            const videoCreated = yield video.save(sequelizeOptions);
            videoCreated.VideoChannel = channel;
            if (thumbnailModel)
                yield videoCreated.addAndSaveThumbnail(thumbnailModel, t);
            const previewIcon = getPreviewFromIcons(videoObject);
            const previewUrl = previewIcon
                ? previewIcon.url
                : activitypub_1.buildRemoteVideoBaseUrl(videoCreated, path_1.join(constants_1.STATIC_PATHS.PREVIEWS, video.generatePreviewName()));
            const previewModel = thumbnail_1.createPlaceholderThumbnail(previewUrl, videoCreated, thumbnail_type_1.ThumbnailType.PREVIEW, constants_1.PREVIEWS_SIZE);
            if (thumbnailModel)
                yield videoCreated.addAndSaveThumbnail(previewModel, t);
            const videoFileAttributes = videoFileActivityUrlToDBAttributes(videoCreated, videoObject.url);
            const videoFilePromises = videoFileAttributes.map(f => video_file_1.VideoFileModel.create(f, { transaction: t }));
            const videoFiles = yield Promise.all(videoFilePromises);
            const streamingPlaylistsAttributes = streamingPlaylistActivityUrlToDBAttributes(videoCreated, videoObject, videoFiles);
            videoCreated.VideoStreamingPlaylists = [];
            for (const playlistAttributes of streamingPlaylistsAttributes) {
                const playlistModel = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.create(playlistAttributes, { transaction: t });
                const playlistFiles = videoFileActivityUrlToDBAttributes(playlistModel, playlistAttributes.tagAPObject);
                const videoFilePromises = playlistFiles.map(f => video_file_1.VideoFileModel.create(f, { transaction: t }));
                playlistModel.VideoFiles = yield Promise.all(videoFilePromises);
                videoCreated.VideoStreamingPlaylists.push(playlistModel);
            }
            const tags = videoObject.tag
                .filter(isAPHashTagObject)
                .map(t => t.name);
            const tagInstances = yield tag_1.TagModel.findOrCreateTags(tags, t);
            yield videoCreated.$set('Tags', tagInstances, sequelizeOptions);
            const videoCaptionsPromises = videoObject.subtitleLanguage.map(c => {
                return video_caption_1.VideoCaptionModel.insertOrReplaceLanguage(videoCreated.id, c.identifier, c.url, t);
            });
            yield Promise.all(videoCaptionsPromises);
            videoCreated.VideoFiles = videoFiles;
            videoCreated.Tags = tagInstances;
            const autoBlacklisted = yield video_blacklist_1.autoBlacklistVideoIfNeeded({
                video: videoCreated,
                user: undefined,
                isRemote: true,
                isNew: true,
                transaction: t
            });
            logger_1.logger.info('Remote video with uuid %s inserted.', videoObject.uuid);
            return { autoBlacklisted, videoCreated };
        }));
        if (waitThumbnail === false) {
            promiseThumbnail.then(thumbnailModel => {
                if (!thumbnailModel)
                    return;
                thumbnailModel = videoCreated.id;
                return thumbnailModel.save();
            });
        }
        return { autoBlacklisted, videoCreated };
    });
}
function videoActivityObjectToDBAttributes(videoChannel, videoObject, to = []) {
    var _a;
    const privacy = to.includes(constants_1.ACTIVITY_PUB.PUBLIC)
        ? videos_1.VideoPrivacy.PUBLIC
        : videos_1.VideoPrivacy.UNLISTED;
    const duration = videoObject.duration.replace(/[^\d]+/, '');
    const language = (_a = videoObject.language) === null || _a === void 0 ? void 0 : _a.identifier;
    const category = videoObject.category
        ? parseInt(videoObject.category.identifier, 10)
        : undefined;
    const licence = videoObject.licence
        ? parseInt(videoObject.licence.identifier, 10)
        : undefined;
    const description = videoObject.content || null;
    const support = videoObject.support || null;
    return {
        name: videoObject.name,
        uuid: videoObject.uuid,
        url: videoObject.id,
        category,
        licence,
        language,
        description,
        support,
        nsfw: videoObject.sensitive,
        commentsEnabled: videoObject.commentsEnabled,
        downloadEnabled: videoObject.downloadEnabled,
        waitTranscoding: videoObject.waitTranscoding,
        state: videoObject.state,
        channelId: videoChannel.id,
        duration: parseInt(duration, 10),
        createdAt: new Date(videoObject.published),
        publishedAt: new Date(videoObject.published),
        originallyPublishedAt: videoObject.originallyPublishedAt
            ? new Date(videoObject.originallyPublishedAt)
            : null,
        updatedAt: new Date(videoObject.updated),
        views: videoObject.views,
        likes: 0,
        dislikes: 0,
        remote: true,
        privacy
    };
}
function videoFileActivityUrlToDBAttributes(videoOrPlaylist, urls) {
    const fileUrls = urls.filter(u => isAPVideoUrlObject(u));
    if (fileUrls.length === 0)
        return [];
    const attributes = [];
    for (const fileUrl of fileUrls) {
        const magnet = urls.filter(isAPMagnetUrlObject)
            .find(u => u.height === fileUrl.height);
        if (!magnet)
            throw new Error('Cannot find associated magnet uri for file ' + fileUrl.href);
        const parsed = magnetUtil.decode(magnet.href);
        if (!parsed || videos_3.isVideoFileInfoHashValid(parsed.infoHash) === false) {
            throw new Error('Cannot parse magnet URI ' + magnet.href);
        }
        const metadata = urls.filter(videos_2.isAPVideoFileMetadataObject)
            .find(u => {
            return u.height === fileUrl.height &&
                u.fps === fileUrl.fps &&
                u.rel.includes(fileUrl.mediaType);
        });
        const mediaType = fileUrl.mediaType;
        const attribute = {
            extname: constants_1.MIMETYPES.VIDEO.MIMETYPE_EXT[mediaType],
            infoHash: parsed.infoHash,
            resolution: fileUrl.height,
            size: fileUrl.size,
            fps: fileUrl.fps || -1,
            metadataUrl: metadata === null || metadata === void 0 ? void 0 : metadata.href,
            videoId: videoOrPlaylist.playlistUrl ? null : videoOrPlaylist.id,
            videoStreamingPlaylistId: videoOrPlaylist.playlistUrl ? videoOrPlaylist.id : null
        };
        attributes.push(attribute);
    }
    return attributes;
}
function streamingPlaylistActivityUrlToDBAttributes(video, videoObject, videoFiles) {
    const playlistUrls = videoObject.url.filter(u => isAPStreamingPlaylistUrlObject(u));
    if (playlistUrls.length === 0)
        return [];
    const attributes = [];
    for (const playlistUrlObject of playlistUrls) {
        const segmentsSha256UrlObject = playlistUrlObject.tag.find(isAPPlaylistSegmentHashesUrlObject);
        let files = playlistUrlObject.tag.filter(u => isAPVideoUrlObject(u));
        if (files.length === 0)
            files = videoFiles;
        if (!segmentsSha256UrlObject) {
            logger_1.logger.warn('No segment sha256 URL found in AP playlist object.', { playlistUrl: playlistUrlObject });
            continue;
        }
        const attribute = {
            type: video_streaming_playlist_type_1.VideoStreamingPlaylistType.HLS,
            playlistUrl: playlistUrlObject.href,
            segmentsSha256Url: segmentsSha256UrlObject.href,
            p2pMediaLoaderInfohashes: video_streaming_playlist_1.VideoStreamingPlaylistModel.buildP2PMediaLoaderInfoHashes(playlistUrlObject.href, files),
            p2pMediaLoaderPeerVersion: constants_1.P2P_MEDIA_LOADER_PEER_VERSION,
            videoId: video.id,
            tagAPObject: playlistUrlObject.tag
        };
        attributes.push(attribute);
    }
    return attributes;
}
function getThumbnailFromIcons(videoObject) {
    let validIcons = videoObject.icon.filter(i => i.width > constants_1.THUMBNAILS_SIZE.minWidth);
    if (validIcons.length === 0)
        validIcons = videoObject.icon;
    return lodash_1.minBy(validIcons, 'width');
}
function getPreviewFromIcons(videoObject) {
    const validIcons = videoObject.icon.filter(i => i.width > constants_1.PREVIEWS_SIZE.minWidth);
    return lodash_1.maxBy(validIcons, 'width');
}
