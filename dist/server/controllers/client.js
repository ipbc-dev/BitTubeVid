"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientsRouter = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const express = require("express");
const path_1 = require("path");
const core_utils_1 = require("../helpers/core-utils");
const constants_1 = require("../initializers/constants");
const middlewares_1 = require("../middlewares");
const i18n_1 = require("../../shared/models/i18n/i18n");
const client_html_1 = require("../lib/client-html");
const logger_1 = require("../helpers/logger");
const config_1 = require("@server/initializers/config");
const clientsRouter = express.Router();
exports.clientsRouter = clientsRouter;
const distPath = path_1.join(core_utils_1.root(), 'client', 'dist');
const embedPath = path_1.join(distPath, 'standalone', 'videos', 'embed.html');
const testEmbedPath = path_1.join(distPath, 'standalone', 'videos', 'test-embed.html');
clientsRouter.use('/videos/watch/:id', middlewares_1.asyncMiddleware(generateWatchHtmlPage));
clientsRouter.use('/accounts/:nameWithHost', middlewares_1.asyncMiddleware(generateAccountHtmlPage));
clientsRouter.use('/video-channels/:nameWithHost', middlewares_1.asyncMiddleware(generateVideoChannelHtmlPage));
const embedCSPMiddleware = config_1.CONFIG.CSP.ENABLED
    ? middlewares_1.embedCSP
    : (req, res, next) => next();
clientsRouter.use('/videos/embed', embedCSPMiddleware, (req, res) => {
    res.removeHeader('X-Frame-Options');
    res.sendFile(embedPath, { maxAge: 0 });
});
clientsRouter.use('/videos/test-embed', (req, res) => res.sendFile(testEmbedPath));
const staticClientFiles = [
    'ngsw-worker.js',
    'ngsw.json'
];
for (const staticClientFile of staticClientFiles) {
    const path = path_1.join(core_utils_1.root(), 'client', 'dist', staticClientFile);
    clientsRouter.get(`/${staticClientFile}`, (req, res) => {
        res.sendFile(path, { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
    });
}
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
    res.sendStatus(404);
});
clientsRouter.use('/(:language)?', middlewares_1.asyncMiddleware(serveIndexHTML));
function serveServerTranslations(req, res) {
    const locale = req.params.locale;
    const file = req.params.file;
    if (i18n_1.is18nLocale(locale) && i18n_1.LOCALE_FILES.includes(file)) {
        const completeLocale = i18n_1.getCompleteLocale(locale);
        const completeFileLocale = i18n_1.buildFileLocale(completeLocale);
        const path = path_1.join(__dirname, `../../../client/dist/locale/${file}.${completeFileLocale}.json`);
        return res.sendFile(path, { maxAge: constants_1.STATIC_MAX_AGE.SERVER });
    }
    return res.sendStatus(404);
}
function serveIndexHTML(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (req.accepts(constants_1.ACCEPT_HEADERS) === 'html') {
            try {
                yield generateHTMLPage(req, res, req.params.language);
                return;
            }
            catch (err) {
                logger_1.logger.error('Cannot generate HTML page.', err);
            }
        }
        return res.status(404).end();
    });
}
function generateHTMLPage(req, res, paramLang) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getDefaultHTMLPage(req, res, paramLang);
        return sendHTML(html, res);
    });
}
function generateWatchHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getWatchHTMLPage(req.params.id + '', req, res);
        return sendHTML(html, res);
    });
}
function generateAccountHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getAccountHTMLPage(req.params.nameWithHost, req, res);
        return sendHTML(html, res);
    });
}
function generateVideoChannelHtmlPage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const html = yield client_html_1.ClientHtml.getVideoChannelHTMLPage(req.params.nameWithHost, req, res);
        return sendHTML(html, res);
    });
}
function sendHTML(html, res) {
    res.set('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
}
function generateManifest(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const manifestPhysicalPath = path_1.join(core_utils_1.root(), 'client', 'dist', 'manifest.webmanifest');
        const manifestJson = yield fs_1.promises.readFile(manifestPhysicalPath, 'utf8');
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
