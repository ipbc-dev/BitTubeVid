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
const i18n_1 = require("../../shared/models/i18n/i18n");
const constants_1 = require("../initializers/constants");
const path_1 = require("path");
const core_utils_1 = require("../helpers/core-utils");
const video_1 = require("../models/video/video");
const validator_1 = require("validator");
const videos_1 = require("../../shared/models/videos");
const fs_extra_1 = require("fs-extra");
const video_format_utils_1 = require("../models/video/video-format-utils");
const account_1 = require("../models/account/account");
const video_channel_1 = require("../models/video/video-channel");
const config_1 = require("../initializers/config");
const logger_1 = require("../helpers/logger");
class ClientHtml {
    static invalidCache() {
        logger_1.logger.info('Cleaning HTML cache.');
        ClientHtml.htmlCache = {};
    }
    static getDefaultHTMLPage(req, res, paramLang) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = paramLang
                ? yield ClientHtml.getIndexHTML(req, res, paramLang)
                : yield ClientHtml.getIndexHTML(req, res);
            let customHtml = ClientHtml.addTitleTag(html);
            customHtml = ClientHtml.addDescriptionTag(customHtml);
            return customHtml;
        });
    }
    static getWatchHTMLPage(videoId, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!validator_1.default.isInt(videoId) && !validator_1.default.isUUID(videoId, 4)) {
                res.status(404);
                return ClientHtml.getIndexHTML(req, res);
            }
            const [html, video] = yield Promise.all([
                ClientHtml.getIndexHTML(req, res),
                video_1.VideoModel.loadWithBlacklist(videoId)
            ]);
            if (!video || video.privacy === videos_1.VideoPrivacy.PRIVATE || video.privacy === videos_1.VideoPrivacy.INTERNAL || video.VideoBlacklist) {
                res.status(404);
                return html;
            }
            let customHtml = ClientHtml.addTitleTag(html, core_utils_1.escapeHTML(video.name));
            customHtml = ClientHtml.addDescriptionTag(customHtml, core_utils_1.escapeHTML(video.description));
            customHtml = ClientHtml.addVideoOpenGraphAndOEmbedTags(customHtml, video);
            return customHtml;
        });
    }
    static getAccountHTMLPage(nameWithHost, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getAccountOrChannelHTMLPage(() => account_1.AccountModel.loadByNameWithHost(nameWithHost), req, res);
        });
    }
    static getVideoChannelHTMLPage(nameWithHost, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getAccountOrChannelHTMLPage(() => video_channel_1.VideoChannelModel.loadByNameWithHostAndPopulateAccount(nameWithHost), req, res);
        });
    }
    static getAccountOrChannelHTMLPage(loader, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const [html, entity] = yield Promise.all([
                ClientHtml.getIndexHTML(req, res),
                loader()
            ]);
            if (!entity) {
                res.status(404);
                return ClientHtml.getIndexHTML(req, res);
            }
            let customHtml = ClientHtml.addTitleTag(html, core_utils_1.escapeHTML(entity.getDisplayName()));
            customHtml = ClientHtml.addDescriptionTag(customHtml, core_utils_1.escapeHTML(entity.description));
            customHtml = ClientHtml.addAccountOrChannelMetaTags(customHtml, entity);
            return customHtml;
        });
    }
    static getIndexHTML(req, res, paramLang) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = ClientHtml.getIndexPath(req, res, paramLang);
            if (ClientHtml.htmlCache[path])
                return ClientHtml.htmlCache[path];
            const buffer = yield fs_extra_1.readFile(path);
            let html = buffer.toString();
            if (paramLang)
                html = ClientHtml.addHtmlLang(html, paramLang);
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
    static addHtmlLang(htmlStringPage, paramLang) {
        return htmlStringPage.replace('<html>', `<html lang="${paramLang}">`);
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
        return __awaiter(this, void 0, void 0, function* () {
            const globalCSSContent = yield fs_extra_1.readFile(constants_1.PLUGIN_GLOBAL_CSS_PATH);
            if (globalCSSContent.byteLength === 0)
                return htmlStringPage;
            const fileHash = core_utils_1.sha256(globalCSSContent);
            const linkTag = `<link rel="stylesheet" href="/plugins/global.css?hash=${fileHash}" />`;
            return htmlStringPage.replace('</head>', linkTag + '</head>');
        });
    }
    static addVideoOpenGraphAndOEmbedTags(htmlStringPage, video) {
        const previewUrl = constants_1.WEBSERVER.URL + video.getPreviewStaticPath();
        const videoUrl = constants_1.WEBSERVER.URL + video.getWatchStaticPath();
        const videoNameEscaped = core_utils_1.escapeHTML(video.name);
        const videoDescriptionEscaped = core_utils_1.escapeHTML(video.description);
        const embedUrl = constants_1.WEBSERVER.URL + video.getEmbedStaticPath();
        const openGraphMetaTags = {
            'og:type': 'video',
            'og:title': videoNameEscaped,
            'og:image': previewUrl,
            'og:url': videoUrl,
            'og:description': videoDescriptionEscaped,
            'og:video:url': embedUrl,
            'og:video:secure_url': embedUrl,
            'og:video:type': 'text/html',
            'og:video:width': constants_1.EMBED_SIZE.width,
            'og:video:height': constants_1.EMBED_SIZE.height,
            'name': videoNameEscaped,
            'description': videoDescriptionEscaped,
            'image': previewUrl,
            'twitter:card': config_1.CONFIG.SERVICES.TWITTER.WHITELISTED ? 'player' : 'summary_large_image',
            'twitter:site': config_1.CONFIG.SERVICES.TWITTER.USERNAME,
            'twitter:title': videoNameEscaped,
            'twitter:description': videoDescriptionEscaped,
            'twitter:image': previewUrl,
            'twitter:player': embedUrl,
            'twitter:player:width': constants_1.EMBED_SIZE.width,
            'twitter:player:height': constants_1.EMBED_SIZE.height
        };
        const oembedLinkTags = [
            {
                type: 'application/json+oembed',
                href: constants_1.WEBSERVER.URL + '/services/oembed?url=' + encodeURIComponent(videoUrl),
                title: videoNameEscaped
            }
        ];
        const schemaTags = {
            '@context': 'http://schema.org',
            '@type': 'VideoObject',
            'name': videoNameEscaped,
            'description': videoDescriptionEscaped,
            'thumbnailUrl': previewUrl,
            'uploadDate': video.createdAt.toISOString(),
            'duration': video_format_utils_1.getActivityStreamDuration(video.duration),
            'contentUrl': videoUrl,
            'embedUrl': embedUrl,
            'interactionCount': video.views
        };
        let tagsString = '';
        Object.keys(openGraphMetaTags).forEach(tagName => {
            const tagValue = openGraphMetaTags[tagName];
            tagsString += `<meta property="${tagName}" content="${tagValue}" />`;
        });
        for (const oembedLinkTag of oembedLinkTags) {
            tagsString += `<link rel="alternate" type="${oembedLinkTag.type}" href="${oembedLinkTag.href}" title="${oembedLinkTag.title}" />`;
        }
        tagsString += `<script type="application/ld+json">${JSON.stringify(schemaTags)}</script>`;
        tagsString += `<link rel="canonical" href="${video.url}" />`;
        return this.addOpenGraphAndOEmbedTags(htmlStringPage, tagsString);
    }
    static addAccountOrChannelMetaTags(htmlStringPage, entity) {
        const metaTags = `<link rel="canonical" href="${entity.Actor.url}" />`;
        return this.addOpenGraphAndOEmbedTags(htmlStringPage, metaTags);
    }
    static addOpenGraphAndOEmbedTags(htmlStringPage, metaTags) {
        return htmlStringPage.replace(constants_1.CUSTOM_HTML_TAG_COMMENTS.META_TAGS, metaTags);
    }
}
exports.ClientHtml = ClientHtml;
ClientHtml.htmlCache = {};
