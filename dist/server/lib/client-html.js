"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveIndexHTML = exports.sendHTML = exports.ClientHtml = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const validator_1 = require("validator");
const i18n_1 = require("../../shared/core-utils/i18n/i18n");
const http_error_codes_1 = require("../../shared/core-utils/miscs/http-error-codes");
const core_utils_1 = require("../helpers/core-utils");
const logger_1 = require("../helpers/logger");
const config_1 = require("../initializers/config");
const constants_1 = require("../initializers/constants");
const account_1 = require("../models/account/account");
const video_1 = require("../models/video/video");
const video_channel_1 = require("../models/video/video-channel");
const video_format_utils_1 = require("../models/video/video-format-utils");
const video_playlist_1 = require("../models/video/video-playlist");
class ClientHtml {
    static invalidCache() {
        logger_1.logger.info('Cleaning HTML cache.');
        ClientHtml.htmlCache = {};
    }
    static getDefaultHTMLPage(req, res, paramLang) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const html = paramLang
                ? yield ClientHtml.getIndexHTML(req, res, paramLang)
                : yield ClientHtml.getIndexHTML(req, res);
            let customHtml = ClientHtml.addTitleTag(html);
            customHtml = ClientHtml.addDescriptionTag(customHtml);
            return customHtml;
        });
    }
    static getWatchHTMLPage(videoId, req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!validator_1.default.isInt(videoId) && !validator_1.default.isUUID(videoId, 4)) {
                res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                return ClientHtml.getIndexHTML(req, res);
            }
            const [html, video] = yield Promise.all([
                ClientHtml.getIndexHTML(req, res),
                video_1.VideoModel.loadWithBlacklist(videoId)
            ]);
            if (!video || video.privacy === 3 || video.privacy === 4 || video.VideoBlacklist) {
                res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                return html;
            }
            let customHtml = ClientHtml.addTitleTag(html, core_utils_1.escapeHTML(video.name));
            customHtml = ClientHtml.addDescriptionTag(customHtml, core_utils_1.escapeHTML(video.description));
            const url = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
            const originUrl = video.url;
            const title = core_utils_1.escapeHTML(video.name);
            const siteName = core_utils_1.escapeHTML(config_1.CONFIG.INSTANCE.NAME);
            const description = core_utils_1.escapeHTML(video.description);
            const image = {
                url: constants_1.WEBSERVER.URL + video.getPreviewStaticPath()
            };
            const embed = {
                url: constants_1.WEBSERVER.URL + video.getEmbedStaticPath(),
                createdAt: video.createdAt.toISOString(),
                duration: video_format_utils_1.getActivityStreamDuration(video.duration),
                views: video.views
            };
            const ogType = 'video';
            const twitterCard = config_1.CONFIG.SERVICES.TWITTER.WHITELISTED ? 'player' : 'summary_large_image';
            const schemaType = 'VideoObject';
            customHtml = ClientHtml.addTags(customHtml, {
                url,
                originUrl,
                siteName,
                title,
                description,
                image,
                embed,
                ogType,
                twitterCard,
                schemaType
            });
            return customHtml;
        });
    }
    static getWatchPlaylistHTMLPage(videoPlaylistId, req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!validator_1.default.isInt(videoPlaylistId) && !validator_1.default.isUUID(videoPlaylistId, 4)) {
                res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                return ClientHtml.getIndexHTML(req, res);
            }
            const [html, videoPlaylist] = yield Promise.all([
                ClientHtml.getIndexHTML(req, res),
                video_playlist_1.VideoPlaylistModel.loadWithAccountAndChannel(videoPlaylistId, null)
            ]);
            if (!videoPlaylist || videoPlaylist.privacy === 3) {
                res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                return html;
            }
            let customHtml = ClientHtml.addTitleTag(html, core_utils_1.escapeHTML(videoPlaylist.name));
            customHtml = ClientHtml.addDescriptionTag(customHtml, core_utils_1.escapeHTML(videoPlaylist.description));
            const url = videoPlaylist.getWatchUrl();
            const originUrl = videoPlaylist.url;
            const title = core_utils_1.escapeHTML(videoPlaylist.name);
            const siteName = core_utils_1.escapeHTML(config_1.CONFIG.INSTANCE.NAME);
            const description = core_utils_1.escapeHTML(videoPlaylist.description);
            const image = {
                url: videoPlaylist.getThumbnailUrl()
            };
            const embed = {
                url: constants_1.WEBSERVER.URL + videoPlaylist.getEmbedStaticPath(),
                createdAt: videoPlaylist.createdAt.toISOString()
            };
            const list = {
                numberOfItems: videoPlaylist.get('videosLength')
            };
            const ogType = 'video';
            const twitterCard = config_1.CONFIG.SERVICES.TWITTER.WHITELISTED ? 'player' : 'summary';
            const schemaType = 'ItemList';
            customHtml = ClientHtml.addTags(customHtml, {
                url,
                originUrl,
                siteName,
                embed,
                title,
                description,
                image,
                list,
                ogType,
                twitterCard,
                schemaType
            });
            return customHtml;
        });
    }
    static getAccountHTMLPage(nameWithHost, req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.getAccountOrChannelHTMLPage(() => account_1.AccountModel.loadByNameWithHost(nameWithHost), req, res);
        });
    }
    static getVideoChannelHTMLPage(nameWithHost, req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.getAccountOrChannelHTMLPage(() => video_channel_1.VideoChannelModel.loadByNameWithHostAndPopulateAccount(nameWithHost), req, res);
        });
    }
    static getEmbedHTML() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const path = ClientHtml.getEmbedPath();
            if (!core_utils_1.isTestInstance() && ClientHtml.htmlCache[path])
                return ClientHtml.htmlCache[path];
            const buffer = yield fs_extra_1.readFile(path);
            let html = buffer.toString();
            html = yield ClientHtml.addAsyncPluginCSS(html);
            html = ClientHtml.addCustomCSS(html);
            html = ClientHtml.addTitleTag(html);
            ClientHtml.htmlCache[path] = html;
            return html;
        });
    }
    static getAccountOrChannelHTMLPage(loader, req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const [html, entity] = yield Promise.all([
                ClientHtml.getIndexHTML(req, res),
                loader()
            ]);
            if (!entity) {
                res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
                return ClientHtml.getIndexHTML(req, res);
            }
            let customHtml = ClientHtml.addTitleTag(html, core_utils_1.escapeHTML(entity.getDisplayName()));
            customHtml = ClientHtml.addDescriptionTag(customHtml, core_utils_1.escapeHTML(entity.description));
            const url = entity.getLocalUrl();
            const originUrl = entity.Actor.url;
            const siteName = core_utils_1.escapeHTML(config_1.CONFIG.INSTANCE.NAME);
            const title = core_utils_1.escapeHTML(entity.getDisplayName());
            const description = core_utils_1.escapeHTML(entity.description);
            const image = {
                url: entity.Actor.getAvatarUrl(),
                width: constants_1.AVATARS_SIZE.width,
                height: constants_1.AVATARS_SIZE.height
            };
            const ogType = 'website';
            const twitterCard = 'summary';
            const schemaType = 'ProfilePage';
            customHtml = ClientHtml.addTags(customHtml, {
                url,
                originUrl,
                title,
                siteName,
                description,
                image,
                ogType,
                twitterCard,
                schemaType
            });
            return customHtml;
        });
    }
    static getIndexHTML(req, res, paramLang) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const path = ClientHtml.getIndexPath(req, res, paramLang);
            if (!core_utils_1.isTestInstance() && ClientHtml.htmlCache[path])
                return ClientHtml.htmlCache[path];
            const buffer = yield fs_extra_1.readFile(path);
            let html = buffer.toString();
            if (paramLang)
                html = ClientHtml.addHtmlLang(html, paramLang);
            html = ClientHtml.addManifestContentHash(html);
            html = ClientHtml.addFaviconContentHash(html);
            html = ClientHtml.addLogoContentHash(html);
            html = ClientHtml.addCustomCSS(html);
            html = yield ClientHtml.addAsyncPluginCSS(html);
            ClientHtml.htmlCache[path] = html;
            return html;
        });
    }
    static getIndexPath(req, res, paramLang) {
        let lang;
        if (paramLang && i18n_1.is18nLocale(paramLang)) {
            lang = paramLang;
            res.cookie('clientLanguage', lang, {
                secure: constants_1.WEBSERVER.SCHEME === 'https',
                sameSite: 'none',
                maxAge: 1000 * 3600 * 24 * 90
            });
        }
        else if (req.cookies.clientLanguage && i18n_1.is18nLocale(req.cookies.clientLanguage)) {
            lang = req.cookies.clientLanguage;
        }
        else {
            lang = req.acceptsLanguages(i18n_1.POSSIBLE_LOCALES) || i18n_1.getDefaultLocale();
        }
        return path_1.join(__dirname, '../../../client/dist/' + i18n_1.buildFileLocale(lang) + '/index.html');
    }
    static getEmbedPath() {
        return path_1.join(__dirname, '../../../client/dist/standalone/videos/embed.html');
    }
    static addHtmlLang(htmlStringPage, paramLang) {
        return htmlStringPage.replace('<html>', `<html lang="${paramLang}">`);
    }
    static addManifestContentHash(htmlStringPage) {
        return htmlStringPage.replace('[manifestContentHash]', constants_1.FILES_CONTENT_HASH.MANIFEST);
    }
    static addFaviconContentHash(htmlStringPage) {
        return htmlStringPage.replace('[faviconContentHash]', constants_1.FILES_CONTENT_HASH.FAVICON);
    }
    static addLogoContentHash(htmlStringPage) {
        return htmlStringPage.replace('[logoContentHash]', constants_1.FILES_CONTENT_HASH.LOGO);
    }
    static addTitleTag(htmlStringPage, title) {
        let text = title || config_1.CONFIG.INSTANCE.NAME;
        if (title)
            text += ` - ${config_1.CONFIG.INSTANCE.NAME}`;
        const titleTag = `<title>${text}</title>`;
        return htmlStringPage.replace(constants_1.CUSTOM_HTML_TAG_COMMENTS.TITLE, titleTag);
    }
    static addDescriptionTag(htmlStringPage, description) {
        const content = description || config_1.CONFIG.INSTANCE.SHORT_DESCRIPTION;
        const descriptionTag = `<meta name="description" content="${content}" />`;
        return htmlStringPage.replace(constants_1.CUSTOM_HTML_TAG_COMMENTS.DESCRIPTION, descriptionTag);
    }
    static addCustomCSS(htmlStringPage) {
        const styleTag = `<style class="custom-css-style">${config_1.CONFIG.INSTANCE.CUSTOMIZATIONS.CSS}</style>`;
        return htmlStringPage.replace(constants_1.CUSTOM_HTML_TAG_COMMENTS.CUSTOM_CSS, styleTag);
    }
    static addAsyncPluginCSS(htmlStringPage) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const globalCSSContent = yield fs_extra_1.readFile(constants_1.PLUGIN_GLOBAL_CSS_PATH);
            if (globalCSSContent.byteLength === 0)
                return htmlStringPage;
            const fileHash = core_utils_1.sha256(globalCSSContent);
            const linkTag = `<link rel="stylesheet" href="/plugins/global.css?hash=${fileHash}" />`;
            return htmlStringPage.replace('</head>', linkTag + '</head>');
        });
    }
    static generateOpenGraphMetaTags(tags) {
        const metaTags = {
            'og:type': tags.ogType,
            'og:site_name': tags.siteName,
            'og:title': tags.title,
            'og:image': tags.image.url
        };
        if (tags.image.width && tags.image.height) {
            metaTags['og:image:width'] = tags.image.width;
            metaTags['og:image:height'] = tags.image.height;
        }
        metaTags['og:url'] = tags.url;
        metaTags['og:description'] = tags.description;
        if (tags.embed) {
            metaTags['og:video:url'] = tags.embed.url;
            metaTags['og:video:secure_url'] = tags.embed.url;
            metaTags['og:video:type'] = 'text/html';
            metaTags['og:video:width'] = constants_1.EMBED_SIZE.width;
            metaTags['og:video:height'] = constants_1.EMBED_SIZE.height;
        }
        return metaTags;
    }
    static generateStandardMetaTags(tags) {
        return {
            name: tags.title,
            description: tags.description,
            image: tags.image.url
        };
    }
    static generateTwitterCardMetaTags(tags) {
        const metaTags = {
            'twitter:card': tags.twitterCard,
            'twitter:site': config_1.CONFIG.SERVICES.TWITTER.USERNAME,
            'twitter:title': tags.title,
            'twitter:description': tags.description,
            'twitter:image': tags.image.url
        };
        if (tags.image.width && tags.image.height) {
            metaTags['twitter:image:width'] = tags.image.width;
            metaTags['twitter:image:height'] = tags.image.height;
        }
        if (tags.twitterCard === 'player') {
            metaTags['twitter:player'] = tags.embed.url;
            metaTags['twitter:player:width'] = constants_1.EMBED_SIZE.width;
            metaTags['twitter:player:height'] = constants_1.EMBED_SIZE.height;
        }
        return metaTags;
    }
    static generateSchemaTags(tags) {
        const schema = {
            '@context': 'http://schema.org',
            '@type': tags.schemaType,
            'name': tags.title,
            'description': tags.description,
            'image': tags.image.url,
            'url': tags.url
        };
        if (tags.list) {
            schema['numberOfItems'] = tags.list.numberOfItems;
            schema['thumbnailUrl'] = tags.image.url;
        }
        if (tags.embed) {
            schema['embedUrl'] = tags.embed.url;
            schema['uploadDate'] = tags.embed.createdAt;
            if (tags.embed.duration)
                schema['duration'] = tags.embed.duration;
            if (tags.embed.views)
                schema['iterationCount'] = tags.embed.views;
            schema['thumbnailUrl'] = tags.image.url;
            schema['contentUrl'] = tags.url;
        }
        return schema;
    }
    static addTags(htmlStringPage, tagsValues) {
        const openGraphMetaTags = this.generateOpenGraphMetaTags(tagsValues);
        const standardMetaTags = this.generateStandardMetaTags(tagsValues);
        const twitterCardMetaTags = this.generateTwitterCardMetaTags(tagsValues);
        const schemaTags = this.generateSchemaTags(tagsValues);
        const { url, title, embed, originUrl } = tagsValues;
        const oembedLinkTags = [];
        if (embed) {
            oembedLinkTags.push({
                type: 'application/json+oembed',
                href: constants_1.WEBSERVER.URL + '/services/oembed?url=' + encodeURIComponent(url),
                title
            });
        }
        let tagsString = '';
        Object.keys(openGraphMetaTags).forEach(tagName => {
            const tagValue = openGraphMetaTags[tagName];
            tagsString += `<meta property="${tagName}" content="${tagValue}" />`;
        });
        Object.keys(standardMetaTags).forEach(tagName => {
            const tagValue = standardMetaTags[tagName];
            tagsString += `<meta property="${tagName}" content="${tagValue}" />`;
        });
        Object.keys(twitterCardMetaTags).forEach(tagName => {
            const tagValue = twitterCardMetaTags[tagName];
            tagsString += `<meta property="${tagName}" content="${tagValue}" />`;
        });
        for (const oembedLinkTag of oembedLinkTags) {
            tagsString += `<link rel="alternate" type="${oembedLinkTag.type}" href="${oembedLinkTag.href}" title="${oembedLinkTag.title}" />`;
        }
        if (schemaTags) {
            tagsString += `<script type="application/ld+json">${JSON.stringify(schemaTags)}</script>`;
        }
        tagsString += `<link rel="canonical" href="${originUrl}" />`;
        return htmlStringPage.replace(constants_1.CUSTOM_HTML_TAG_COMMENTS.META_TAGS, tagsString);
    }
}
exports.ClientHtml = ClientHtml;
ClientHtml.htmlCache = {};
function sendHTML(html, res) {
    res.set('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
}
exports.sendHTML = sendHTML;
function serveIndexHTML(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (req.accepts(constants_1.ACCEPT_HEADERS) === 'html' ||
            !req.headers.accept) {
            try {
                yield generateHTMLPage(req, res, req.params.language);
                return;
            }
            catch (err) {
                logger_1.logger.error('Cannot generate HTML page.', err);
                return res.sendStatus(http_error_codes_1.HttpStatusCode.INTERNAL_SERVER_ERROR_500);
            }
        }
        return res.sendStatus(http_error_codes_1.HttpStatusCode.NOT_ACCEPTABLE_406);
    });
}
exports.serveIndexHTML = serveIndexHTML;
function generateHTMLPage(req, res, paramLang) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield ClientHtml.getDefaultHTMLPage(req, res, paramLang);
        return sendHTML(html, res);
    });
}
