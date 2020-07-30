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
    const video = res.locals.videoAll;
    const webserverUrl = constants_1.WEBSERVER.URL;
    const maxHeight = parseInt(req.query.maxheight, 10);
    const maxWidth = parseInt(req.query.maxwidth, 10);
    const embedUrl = webserverUrl + video.getEmbedStaticPath();
    let thumbnailUrl = webserverUrl + video.getPreviewStaticPath();
    let embedWidth = constants_1.EMBED_SIZE.width;
    let embedHeight = constants_1.EMBED_SIZE.height;
    if (maxHeight < embedHeight)
        embedHeight = maxHeight;
    if (maxWidth < embedWidth)
        embedWidth = maxWidth;
    if ((maxHeight !== undefined && maxHeight < constants_1.PREVIEWS_SIZE.height) ||
        (maxWidth !== undefined && maxWidth < constants_1.PREVIEWS_SIZE.width)) {
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
        title: video.name,
        author_name: video.VideoChannel.Account.name,
        author_url: video.VideoChannel.Account.Actor.url,
        provider_name: 'PeerTube',
        provider_url: webserverUrl
    };
    if (thumbnailUrl !== undefined) {
        json.thumbnail_url = thumbnailUrl;
        json.thumbnail_width = constants_1.PREVIEWS_SIZE.width;
        json.thumbnail_height = constants_1.PREVIEWS_SIZE.height;
    }
    return res.json(json);
}
function redirectToAccountUrl(req, res, next) {
    return res.redirect(res.locals.account.Actor.url);
}
