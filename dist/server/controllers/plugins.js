"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginsRouter = void 0;
const express = require("express");
const constants_1 = require("../initializers/constants");
const path_1 = require("path");
const plugin_manager_1 = require("../lib/plugins/plugin-manager");
const plugins_1 = require("../middlewares/validators/plugins");
const themes_1 = require("../middlewares/validators/themes");
const plugin_type_1 = require("../../shared/models/plugins/plugin.type");
const core_utils_1 = require("../helpers/core-utils");
const i18n_1 = require("../../shared/models/i18n");
const logger_1 = require("@server/helpers/logger");
const sendFileOptions = {
    maxAge: '30 days',
    immutable: !core_utils_1.isTestInstance()
};
const pluginsRouter = express.Router();
exports.pluginsRouter = pluginsRouter;
pluginsRouter.get('/plugins/global.css', servePluginGlobalCSS);
pluginsRouter.get('/plugins/translations/:locale.json', getPluginTranslations);
pluginsRouter.get('/plugins/:pluginName/:pluginVersion/auth/:authName', plugins_1.getPluginValidator(plugin_type_1.PluginType.PLUGIN), plugins_1.getExternalAuthValidator, handleAuthInPlugin);
pluginsRouter.get('/plugins/:pluginName/:pluginVersion/static/:staticEndpoint(*)', plugins_1.getPluginValidator(plugin_type_1.PluginType.PLUGIN), plugins_1.pluginStaticDirectoryValidator, servePluginStaticDirectory);
pluginsRouter.get('/plugins/:pluginName/:pluginVersion/client-scripts/:staticEndpoint(*)', plugins_1.getPluginValidator(plugin_type_1.PluginType.PLUGIN), plugins_1.pluginStaticDirectoryValidator, servePluginClientScripts);
pluginsRouter.use('/plugins/:pluginName/router', plugins_1.getPluginValidator(plugin_type_1.PluginType.PLUGIN, false), servePluginCustomRoutes);
pluginsRouter.use('/plugins/:pluginName/:pluginVersion/router', plugins_1.getPluginValidator(plugin_type_1.PluginType.PLUGIN), servePluginCustomRoutes);
pluginsRouter.get('/themes/:pluginName/:pluginVersion/static/:staticEndpoint(*)', plugins_1.getPluginValidator(plugin_type_1.PluginType.THEME), plugins_1.pluginStaticDirectoryValidator, servePluginStaticDirectory);
pluginsRouter.get('/themes/:pluginName/:pluginVersion/client-scripts/:staticEndpoint(*)', plugins_1.getPluginValidator(plugin_type_1.PluginType.THEME), plugins_1.pluginStaticDirectoryValidator, servePluginClientScripts);
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
    if (!staticPath)
        return res.sendStatus(404);
    const filepath = file.join('/');
    return res.sendFile(path_1.join(plugin.path, staticPath, filepath), sendFileOptions);
}
function servePluginCustomRoutes(req, res, next) {
    const plugin = res.locals.registeredPlugin;
    const router = plugin_manager_1.PluginManager.Instance.getRouter(plugin.npmName);
    if (!router)
        return res.sendStatus(404);
    return router(req, res, next);
}
function servePluginClientScripts(req, res) {
    const plugin = res.locals.registeredPlugin;
    const staticEndpoint = req.params.staticEndpoint;
    const file = plugin.clientScripts[staticEndpoint];
    if (!file)
        return res.sendStatus(404);
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
function handleAuthInPlugin(req, res) {
    const authOptions = res.locals.externalAuth;
    try {
        logger_1.logger.debug('Forwarding auth plugin request in %s of plugin %s.', authOptions.authName, res.locals.registeredPlugin.npmName);
        authOptions.onAuthRequest(req, res);
    }
    catch (err) {
        logger_1.logger.error('Forward request error in auth %s of plugin %s.', authOptions.authName, res.locals.registeredPlugin.npmName, { err });
    }
}
