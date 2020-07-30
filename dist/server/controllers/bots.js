"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botsRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const middlewares_1 = require("../middlewares");
const constants_1 = require("../initializers/constants");
const sitemap_1 = require("sitemap");
const video_1 = require("../models/video/video");
const video_channel_1 = require("../models/video/video-channel");
const account_1 = require("../models/account/account");
const cache_1 = require("../middlewares/cache");
const express_utils_1 = require("../helpers/express-utils");
const lodash_1 = require("lodash");
const botsRouter = express.Router();
exports.botsRouter = botsRouter;
botsRouter.use('/sitemap.xml', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.SITEMAP)), middlewares_1.asyncMiddleware(getSitemap));
function getSitemap(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let urls = getSitemapBasicUrls();
        urls = urls.concat(yield getSitemapLocalVideoUrls());
        urls = urls.concat(yield getSitemapVideoChannelUrls());
        urls = urls.concat(yield getSitemapAccountUrls());
        const sitemapStream = new sitemap_1.SitemapStream({ hostname: constants_1.WEBSERVER.URL });
        for (const urlObj of urls) {
            sitemapStream.write(urlObj);
        }
        sitemapStream.end();
        const xml = yield sitemap_1.streamToPromise(sitemapStream);
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    });
}
function getSitemapVideoChannelUrls() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rows = yield video_channel_1.VideoChannelModel.listLocalsForSitemap('createdAt');
        return rows.map(channel => ({
            url: constants_1.WEBSERVER.URL + '/video-channels/' + channel.Actor.preferredUsername
        }));
    });
}
function getSitemapAccountUrls() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const rows = yield account_1.AccountModel.listLocalsForSitemap('createdAt');
        return rows.map(channel => ({
            url: constants_1.WEBSERVER.URL + '/accounts/' + channel.Actor.preferredUsername
        }));
    });
}
function getSitemapLocalVideoUrls() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { data } = yield video_1.VideoModel.listForApi({
            start: 0,
            count: undefined,
            sort: 'createdAt',
            includeLocalVideos: true,
            nsfw: express_utils_1.buildNSFWFilter(),
            filter: 'local',
            withFiles: false,
            countVideos: false
        });
        return data.map(v => ({
            url: constants_1.WEBSERVER.URL + '/videos/watch/' + v.uuid,
            video: [
                {
                    title: v.name,
                    description: lodash_1.truncate(v.description || v.name, { length: 2000, omission: '...' }),
                    player_loc: constants_1.WEBSERVER.URL + '/videos/embed/' + v.uuid,
                    thumbnail_loc: constants_1.WEBSERVER.URL + v.getMiniatureStaticPath()
                }
            ]
        }));
    });
}
function getSitemapBasicUrls() {
    const paths = [
        '/about/instance',
        '/videos/local'
    ];
    return paths.map(p => ({ url: constants_1.WEBSERVER.URL + p }));
}
