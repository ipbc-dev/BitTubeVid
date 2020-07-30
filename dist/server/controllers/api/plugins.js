"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const utils_1 = require("../../helpers/utils");
const middlewares_1 = require("../../middlewares");
const validators_1 = require("../../middlewares/validators");
const plugin_1 = require("../../models/server/plugin");
const users_1 = require("../../../shared/models/users");
const plugins_1 = require("../../middlewares/validators/plugins");
const plugin_manager_1 = require("../../lib/plugins/plugin-manager");
const logger_1 = require("../../helpers/logger");
const plugin_index_1 = require("../../lib/plugins/plugin-index");
const pluginRouter = express.Router();
exports.pluginRouter = pluginRouter;
pluginRouter.get('/available', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), plugins_1.listAvailablePluginsValidator, middlewares_1.paginationValidator, validators_1.availablePluginsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listAvailablePlugins));
pluginRouter.get('/', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), plugins_1.listPluginsValidator, middlewares_1.paginationValidator, validators_1.pluginsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listPlugins));
pluginRouter.get('/:npmName/registered-settings', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), middlewares_1.asyncMiddleware(plugins_1.existingPluginValidator), getPluginRegisteredSettings);
pluginRouter.get('/:npmName/public-settings', middlewares_1.asyncMiddleware(plugins_1.existingPluginValidator), getPublicPluginSettings);
pluginRouter.put('/:npmName/settings', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), plugins_1.updatePluginSettingsValidator, middlewares_1.asyncMiddleware(plugins_1.existingPluginValidator), middlewares_1.asyncMiddleware(updatePluginSettings));
pluginRouter.get('/:npmName', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), middlewares_1.asyncMiddleware(plugins_1.existingPluginValidator), getPlugin);
pluginRouter.post('/install', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), plugins_1.installOrUpdatePluginValidator, middlewares_1.asyncMiddleware(installPlugin));
pluginRouter.post('/update', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), plugins_1.installOrUpdatePluginValidator, middlewares_1.asyncMiddleware(updatePlugin));
pluginRouter.post('/uninstall', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_PLUGINS), plugins_1.uninstallPluginValidator, middlewares_1.asyncMiddleware(uninstallPlugin));
function listPlugins(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pluginType = req.query.pluginType;
        const uninstalled = req.query.uninstalled;
        const resultList = yield plugin_1.PluginModel.listForApi({
            pluginType,
            uninstalled,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function getPlugin(req, res) {
    const plugin = res.locals.plugin;
    return res.json(plugin.toFormattedJSON());
}
function installPlugin(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const fromDisk = !!body.path;
        const toInstall = body.npmName || body.path;
        try {
            const plugin = yield plugin_manager_1.PluginManager.Instance.install(toInstall, undefined, fromDisk);
            return res.json(plugin.toFormattedJSON());
        }
        catch (err) {
            logger_1.logger.warn('Cannot install plugin %s.', toInstall, { err });
            return res.sendStatus(400);
        }
    });
}
function updatePlugin(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const fromDisk = !!body.path;
        const toUpdate = body.npmName || body.path;
        try {
            const plugin = yield plugin_manager_1.PluginManager.Instance.update(toUpdate, undefined, fromDisk);
            return res.json(plugin.toFormattedJSON());
        }
        catch (err) {
            logger_1.logger.warn('Cannot update plugin %s.', toUpdate, { err });
            return res.sendStatus(400);
        }
    });
}
function uninstallPlugin(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        yield plugin_manager_1.PluginManager.Instance.uninstall(body.npmName);
        return res.sendStatus(204);
    });
}
function getPublicPluginSettings(req, res) {
    const plugin = res.locals.plugin;
    const registeredSettings = plugin_manager_1.PluginManager.Instance.getRegisteredSettings(req.params.npmName);
    const publicSettings = plugin.getPublicSettings(registeredSettings);
    const json = { publicSettings };
    return res.json(json);
}
function getPluginRegisteredSettings(req, res) {
    const registeredSettings = plugin_manager_1.PluginManager.Instance.getRegisteredSettings(req.params.npmName);
    const json = { registeredSettings };
    return res.json(json);
}
function updatePluginSettings(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const plugin = res.locals.plugin;
        plugin.settings = req.body.settings;
        yield plugin.save();
        yield plugin_manager_1.PluginManager.Instance.onSettingsChanged(plugin.name, plugin.settings);
        return res.sendStatus(204);
    });
}
function listAvailablePlugins(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const query = req.query;
        const resultList = yield plugin_index_1.listAvailablePluginsFromIndex(query);
        if (!resultList) {
            return res.status(503)
                .json({ error: 'Plugin index unavailable. Please retry later' })
                .end();
        }
        return res.json(resultList);
    });
}
