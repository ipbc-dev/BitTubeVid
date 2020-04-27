"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const constants_1 = require("../initializers/constants");
const middlewares_1 = require("../middlewares");
const video_1 = require("../models/video/video");
const Feed = require("pfeed");
const cache_1 = require("../middlewares/cache");
const video_comment_1 = require("../models/video/video-comment");
const express_utils_1 = require("../helpers/express-utils");
const config_1 = require("../initializers/config");
const feedsRouter = express.Router();
exports.feedsRouter = feedsRouter;
feedsRouter.get('/feeds/video-comments.:format', middlewares_1.feedsFormatValidator, middlewares_1.setFeedFormatContentType, middlewares_1.asyncMiddleware(cache_1.cacheRoute({
    headerBlacklist: [
        'Content-Type'
    ]
})(constants_1.ROUTE_CACHE_LIFETIME.FEEDS)), middlewares_1.asyncMiddleware(middlewares_1.videoCommentsFeedsValidator), middlewares_1.asyncMiddleware(generateVideoCommentsFeed));
feedsRouter.get('/feeds/videos.:format', middlewares_1.videosSortValidator, middlewares_1.setDefaultSort, middlewares_1.feedsFormatValidator, middlewares_1.setFeedFormatContentType, middlewares_1.asyncMiddleware(cache_1.cacheRoute({
    headerBlacklist: [
        'Content-Type'
    ]
})(constants_1.ROUTE_CACHE_LIFETIME.FEEDS)), middlewares_1.commonVideosFiltersValidator, middlewares_1.asyncMiddleware(middlewares_1.videoFeedsValidator), middlewares_1.asyncMiddleware(generateVideoFeed));
function generateVideoCommentsFeed(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = 0;
        const video = res.locals.videoAll;
        const videoId = video ? video.id : undefined;
        const comments = yield video_comment_1.VideoCommentModel.listForFeed(start, constants_1.FEEDS.COUNT, videoId);
        const name = video ? video.name : config_1.CONFIG.INSTANCE.NAME;
        const description = video ? video.description : config_1.CONFIG.INSTANCE.DESCRIPTION;
        const feed = initFeed(name, description);
        comments.forEach(comment => {
            const link = constants_1.WEBSERVER.URL + comment.getCommentStaticPath();
            let title = comment.Video.name;
            const author = [];
            if (comment.Account) {
                title += ` - ${comment.Account.getDisplayName()}`;
                author.push({
                    name: comment.Account.getDisplayName(),
                    link: comment.Account.Actor.url
                });
            }
            feed.addItem({
                title,
                id: comment.url,
                link,
                content: comment.text,
                author,
                date: comment.createdAt
            });
        });
        return sendFeed(feed, req, res);
    });
}
function generateVideoFeed(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = 0;
        const account = res.locals.account;
        const videoChannel = res.locals.videoChannel;
        const nsfw = express_utils_1.buildNSFWFilter(res, req.query.nsfw);
        let name;
        let description;
        if (videoChannel) {
            name = videoChannel.getDisplayName();
            description = videoChannel.description;
        }
        else if (account) {
            name = account.getDisplayName();
            description = account.description;
        }
        else {
            name = config_1.CONFIG.INSTANCE.NAME;
            description = config_1.CONFIG.INSTANCE.DESCRIPTION;
        }
        const feed = initFeed(name, description);
        const resultList = yield video_1.VideoModel.listForApi({
            start,
            count: constants_1.FEEDS.COUNT,
            sort: req.query.sort,
            includeLocalVideos: true,
            nsfw,
            filter: req.query.filter,
            withFiles: true,
            accountId: account ? account.id : null,
            videoChannelId: videoChannel ? videoChannel.id : null
        });
        resultList.data.forEach(video => {
            const formattedVideoFiles = video.getFormattedVideoFilesJSON();
            const torrents = formattedVideoFiles.map(videoFile => ({
                title: video.name,
                url: videoFile.torrentUrl,
                size_in_bytes: videoFile.size
            }));
            const videos = formattedVideoFiles.map(videoFile => {
                const result = {
                    type: 'video/mp4',
                    medium: 'video',
                    height: videoFile.resolution.label.replace('p', ''),
                    fileSize: videoFile.size,
                    url: videoFile.fileUrl,
                    framerate: videoFile.fps,
                    duration: video.duration
                };
                if (video.language)
                    Object.assign(result, { lang: video.language });
                return result;
            });
            const categories = [];
            if (video.category) {
                categories.push({
                    value: video.category,
                    label: video_1.VideoModel.getCategoryLabel(video.category)
                });
            }
            feed.addItem({
                title: video.name,
                id: video.url,
                link: constants_1.WEBSERVER.URL + '/videos/watch/' + video.uuid,
                description: video.getTruncatedDescription(),
                content: video.description,
                author: [
                    {
                        name: video.VideoChannel.Account.getDisplayName(),
                        link: video.VideoChannel.Account.Actor.url
                    }
                ],
                date: video.publishedAt,
                nsfw: video.nsfw,
                torrent: torrents,
                videos,
                embed: {
                    url: video.getEmbedStaticPath(),
                    allowFullscreen: true
                },
                player: {
                    url: video.getWatchStaticPath()
                },
                categories,
                community: {
                    statistics: {
                        views: video.views
                    }
                },
                thumbnail: [
                    {
                        url: constants_1.WEBSERVER.URL + video.getMiniatureStaticPath(),
                        height: constants_1.THUMBNAILS_SIZE.height,
                        width: constants_1.THUMBNAILS_SIZE.width
                    }
                ]
            });
        });
        return sendFeed(feed, req, res);
    });
}
function initFeed(name, description) {
    const webserverUrl = constants_1.WEBSERVER.URL;
    return new Feed({
        title: name,
        description,
        id: webserverUrl,
        link: webserverUrl,
        image: webserverUrl + '/client/assets/images/icons/icon-96x96.png',
        favicon: webserverUrl + '/client/assets/images/favicon.png',
        copyright: `All rights reserved, unless otherwise specified in the terms specified at ${webserverUrl}/about` +
            ` and potential licenses granted by each content's rightholder.`,
        generator: `Toraifōsu`,
        feedLinks: {
            json: `${webserverUrl}/feeds/videos.json`,
            atom: `${webserverUrl}/feeds/videos.atom`,
            rss: `${webserverUrl}/feeds/videos.xml`
        },
        author: {
            name: 'Instance admin of ' + config_1.CONFIG.INSTANCE.NAME,
            email: config_1.CONFIG.ADMIN.EMAIL,
            link: `${webserverUrl}/about`
        }
    });
}
function sendFeed(feed, req, res) {
    const format = req.params.format;
    if (format === 'atom' || format === 'atom1') {
        return res.send(feed.atom1()).end();
    }
    if (format === 'json' || format === 'json1') {
        return res.send(feed.json1()).end();
    }
    if (format === 'rss' || format === 'rss2') {
        return res.send(feed.rss2()).end();
    }
    if (req.query.format === 'atom' || req.query.format === 'atom1') {
        return res.send(feed.atom1()).end();
    }
    return res.send(feed.rss2()).end();
}
