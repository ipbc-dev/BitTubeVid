"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientsRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const config_1 = require("@server/initializers/config");
const core_utils_1 = require("@shared/core-utils");
const i18n_1 = require("@shared/core-utils/i18n");
const core_utils_2 = require("../helpers/core-utils");
const constants_1 = require("../initializers/constants");
const client_html_1 = require("../lib/client-html");
const middlewares_1 = require("../middlewares");
const clientsRouter = express.Router();
exports.clientsRouter = clientsRouter;
const distPath = path_1.join(core_utils_2.root(), 'client', 'dist');
const testEmbedPath = path_1.join(distPath, 'standalone', 'videos', 'test-embed.html');
clientsRouter.use('/videos/watch/playlist/:id', middlewares_1.asyncMiddleware(generateWatchPlaylistHtmlPage));
clientsRouter.use('/videos/watch/:id', middlewares_1.asyncMiddleware(generateWatchHtmlPage));
clientsRouter.use('/accounts/:nameWithHost', middlewares_1.asyncMiddleware(generateAccountHtmlPage));
clientsRouter.use('/video-channels/:nameWithHost', middlewares_1.asyncMiddleware(generateVideoChannelHtmlPage));
const embedMiddlewares = [
    config_1.CONFIG.CSP.ENABLED
        ? middlewares_1.embedCSP
        : (req, res, next) => next(),
    (req, res, next) => {
        res.removeHeader('X-Frame-Options');
        res.setHeader('Cache-Control', 'public, max-age=0');
        next();
    },
    middlewares_1.asyncMiddleware(generateEmbedHtmlPage)
];
clientsRouter.use('/videos/embed', ...embedMiddlewares);
clientsRouter.use('/video-playlists/embed', ...embedMiddlewares);
const testEmbedController = (req, res) => res.sendFile(testEmbedPath);
clientsRouter.use('/videos/test-embed', testEmbedController);
clientsRouter.use('/video-playlists/test-embed', testEmbedController);
clientsRouter.get('/manifest.webmanifest', middlewares_1.asyncMiddleware(generateManifest));
const staticClientOverrides = [
    'assets/images/logo.svg',
    'assets/images/favicon.png',
    'assets/images/icons/icon-36x36.png',
    'assets/images/icons/icon-48x48.png',
    'assets/images/icons/icon-72x72.png',
    'assets/images/icons/icon-96x96.png',
    'assets/images/icons/icon-144x144.png',
    'assets/images/icons/icon-192x192.png',
    'assets/images/icons/icon-512x512.png'
];
for (const staticClientOverride of staticClientOverrides) {
    const overridePhysicalPath = path_1.join(config_1.CONFIG.STORAGE.CLIENT_OVERRIDES_DIR, staticClientOverride);
    clientsRouter.use(`/client/${staticClientOverride}`, middlewares_1.asyncMiddleware(serveClientOverride(overridePhysicalPath)));
}
clientsRouter.use('/client/locales/:locale/:file.json', serveServerTranslations);
clientsRouter.use('/client', express.static(distPath, { maxAge: constants_1.STATIC_MAX_AGE.CLIENT }));
clientsRouter.use('/client/*', (req, res) => {
    res.sendStatus(core_utils_1.HttpStatusCode.NOT_FOUND_404);
});
clientsRouter.use('/(:language)?', middlewares_1.asyncMiddleware(client_html_1.serveIndexHTML));
function serveServerTranslations(req, res) {
    const locale = req.params.locale;
    const file = req.params.file;
    if (i18n_1.is18nLocale(locale) && i18n_1.LOCALE_FILES.includes(file)) {
        const completeLocale = i18n_1.getCompleteLocale(locale);
        const completeFileLocale = i18n_1.buildFileLocale(completeLocale);
        const path = path_1.join(__dirname, `../../../client/dist/locale/${file}.${completeFileLocale}.json`);
        return res.sendFile(path, { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
    }
    return res.sendStatus(core_utils_1.HttpStatusCode.NOT_FOUND_404);
}
function generateEmbedHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getEmbedHTML();
        return client_html_1.sendHTML(html, res);
    });
}
function generateWatchHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getWatchHTMLPage(req.params.id + '', req, res);
        return client_html_1.sendHTML(html, res);
    });
}
function generateWatchPlaylistHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getWatchPlaylistHTMLPage(req.params.id + '', req, res);
        return client_html_1.sendHTML(html, res);
    });
}
function generateAccountHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getAccountHTMLPage(req.params.nameWithHost, req, res);
        return client_html_1.sendHTML(html, res);
    });
}
function generateVideoChannelHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getVideoChannelHTMLPage(req.params.nameWithHost, req, res);
        return client_html_1.sendHTML(html, res);
    });
}
function generateManifest(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const manifestPhysicalPath = path_1.join(core_utils_2.root(), 'client', 'dist', 'manifest.webmanifest');
        const manifestJson = yield fs_extra_1.readFile(manifestPhysicalPath, 'utf8');
        const manifest = JSON.parse(manifestJson);
        manifest.name = config_1.CONFIG.INSTANCE.NAME;
        manifest.short_name = config_1.CONFIG.INSTANCE.NAME;
        manifest.description = config_1.CONFIG.INSTANCE.SHORT_DESCRIPTION;
        res.json(manifest);
    });
}
function serveClientOverride(path) {
    return (req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.promises.access(path, fs_1.constants.F_OK);
            res.sendFile(path, { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
        }
        catch (_a) {
            next();
        }
    });
}
