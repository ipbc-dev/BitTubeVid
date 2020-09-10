"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesRouter = void 0;
const express = require("express");
const constants_1 = require("../initializers/constants");
const middlewares_1 = require("../middlewares");
const validators_1 = require("../middlewares/validators");
const servicesRouter = express.Router();
exports.servicesRouter = servicesRouter;
servicesRouter.use('/oembed', middlewares_1.asyncMiddleware(middlewares_1.oembedValidator), generateOEmbed);
servicesRouter.use('/redirect/accounts/:accountName', middlewares_1.asyncMiddleware(validators_1.accountNameWithHostGetValidator), redirectToAccountUrl);
function generateOEmbed(req, res) {
    if (res.locals.videoAll)
        return generateVideoOEmbed(req, res);
    return generatePlaylistOEmbed(req, res);
}
function generatePlaylistOEmbed(req, res) {
    const playlist = res.locals.videoPlaylistSummary;
    const json = buildOEmbed({
        channel: playlist.VideoChannel,
        title: playlist.name,
        embedPath: playlist.getEmbedStaticPath(),
        previewPath: playlist.getThumbnailStaticPath(),
        previewSize: constants_1.THUMBNAILS_SIZE,
        req
    });
    return res.json(json);
}
function generateVideoOEmbed(req, res) {
    const video = res.locals.videoAll;
    const json = buildOEmbed({
        channel: video.VideoChannel,
        title: video.name,
        embedPath: video.getEmbedStaticPath(),
        previewPath: video.getPreviewStaticPath(),
        previewSize: constants_1.PREVIEWS_SIZE,
        req
    });
    return res.json(json);
}
function buildOEmbed(options) {
    const { req, previewSize, previewPath, title, channel, embedPath } = options;
    const webserverUrl = constants_1.WEBSERVER.URL;
    const maxHeight = parseInt(req.query.maxheight, 10);
    const maxWidth = parseInt(req.query.maxwidth, 10);
    const embedUrl = webserverUrl + embedPath;
    let embedWidth = constants_1.EMBED_SIZE.width;
    let embedHeight = constants_1.EMBED_SIZE.height;
    let thumbnailUrl = previewPath
        ? webserverUrl + previewPath
        : undefined;
    if (maxHeight < embedHeight)
        embedHeight = maxHeight;
    if (maxWidth < embedWidth)
        embedWidth = maxWidth;
    if ((maxHeight !== undefined && maxHeight < previewSize.height) ||
        (maxWidth !== undefined && maxWidth < previewSize.width)) {
        thumbnailUrl = undefined;
    }
    const html = `<iframe width="${embedWidth}" height="${embedHeight}" sandbox="allow-same-origin allow-scripts" ` +
        `src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    const json = {
        type: 'video',
        version: '1.0',
        html,
        width: embedWidth,
        height: embedHeight,
        title: title,
        author_name: channel.name,
        author_url: channel.Actor.url,
        provider_name: 'PeerTube',
        provider_url: webserverUrl
    };
    if (thumbnailUrl !== undefined) {
        json.thumbnail_url = thumbnailUrl;
        json.thumbnail_width = previewSize.width;
        json.thumbnail_height = previewSize.height;
    }
    return json;
}
function redirectToAccountUrl(req, res, next) {
    return res.redirect(res.locals.account.Actor.url);
}
