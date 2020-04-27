"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const constants_1 = require("../initializers/constants");
const path_1 = require("path");
const plugin_manager_1 = require("../lib/plugins/plugin-manager");
const plugins_1 = require("../middlewares/validators/plugins");
const themes_1 = require("../middlewares/validators/themes");
const plugin_type_1 = require("../../shared/models/plugins/plugin.type");
const core_utils_1 = require("../helpers/core-utils");
const i18n_1 = require("../../shared/models/i18n");
const sendFileOptions = {
    maxAge: '30 days',
    immutable: !core_utils_1.isTestInstance()
};
const pluginsRouter = express.Router();
exports.pluginsRouter = pluginsRouter;
pluginsRouter.get('/plugins/global.css', servePluginGlobalCSS);
pluginsRouter.get('/plugins/translations/:locale.json', getPluginTranslations);
pluginsRouter.get('/plugins/:pluginName/:pluginVersion/static/:staticEndpoint(*)', plugins_1.servePluginStaticDirectoryValidator(plugin_type_1.PluginType.PLUGIN), servePluginStaticDirectory);
pluginsRouter.get('/plugins/:pluginName/:pluginVersion/client-scripts/:staticEndpoint(*)', plugins_1.servePluginStaticDirectoryValidator(plugin_type_1.PluginType.PLUGIN), servePluginClientScripts);
pluginsRouter.get('/themes/:pluginName/:pluginVersion/static/:staticEndpoint(*)', plugins_1.servePluginStaticDirectoryValidator(plugin_type_1.PluginType.THEME), servePluginStaticDirectory);
pluginsRouter.get('/themes/:pluginName/:pluginVersion/client-scripts/:staticEndpoint(*)', plugins_1.servePluginStaticDirectoryValidator(plugin_type_1.PluginType.THEME), servePluginClientScripts);
pluginsRouter.get('/themes/:themeName/:themeVersion/css/:staticEndpoint(*)', themes_1.serveThemeCSSValidator, serveThemeCSSDirectory);
function servePluginGlobalCSS(req, res) {
    const globalCSSOptions = req.query.hash
        ? sendFileOptions
        : {};
    return res.sendFile(constants_1.PLUGIN_GLOBAL_CSS_PATH, globalCSSOptions);
}
function getPluginTranslations(req, res) {
    const locale = req.params.locale;
    if (i18n_1.is18nLocale(locale)) {
        const completeLocale = i18n_1.getCompleteLocale(locale);
        const json = plugin_manager_1.PluginManager.Instance.getTranslations(completeLocale);
        return res.json(json);
    }
    return res.sendStatus(404);
}
function servePluginStaticDirectory(req, res) {
    const plugin = res.locals.registeredPlugin;
    const staticEndpoint = req.params.staticEndpoint;
    const [directory, ...file] = staticEndpoint.split('/');
    const staticPath = plugin.staticDirs[directory];
    if (!staticPath) {
        return res.sendStatus(404);
    }
    const filepath = file.join('/');
    return res.sendFile(path_1.join(plugin.path, staticPath, filepath), sendFileOptions);
}
function servePluginClientScripts(req, res) {
    const plugin = res.locals.registeredPlugin;
    const staticEndpoint = req.params.staticEndpoint;
    const file = plugin.clientScripts[staticEndpoint];
    if (!file) {
        return res.sendStatus(404);
    }
    return res.sendFile(path_1.join(plugin.path, staticEndpoint), sendFileOptions);
}
function serveThemeCSSDirectory(req, res) {
    const plugin = res.locals.registeredPlugin;
    const staticEndpoint = req.params.staticEndpoint;
    if (plugin.css.includes(staticEndpoint) === false) {
        return res.sendStatus(404);
    }
    return res.sendFile(path_1.join(plugin.path, staticEndpoint), sendFileOptions);
}
