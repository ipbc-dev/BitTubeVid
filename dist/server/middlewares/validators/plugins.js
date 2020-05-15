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
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const plugin_manager_1 = require("../../lib/plugins/plugin-manager");
const misc_1 = require("../../helpers/custom-validators/misc");
const plugin_1 = require("../../models/server/plugin");
const config_1 = require("../../initializers/config");
const servePluginStaticDirectoryValidator = (pluginType) => [
    express_validator_1.param('pluginName').custom(plugins_1.isPluginNameValid).withMessage('Should have a valid plugin name'),
    express_validator_1.param('pluginVersion').custom(plugins_1.isPluginVersionValid).withMessage('Should have a valid plugin version'),
    express_validator_1.param('staticEndpoint').custom(misc_1.isSafePath).withMessage('Should have a valid static endpoint'),
    (req, res, next) => {
        logger_1.logger.debug('Checking servePluginStaticDirectory parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const npmName = plugin_1.PluginModel.buildNpmName(req.params.pluginName, pluginType);
        const plugin = plugin_manager_1.PluginManager.Instance.getRegisteredPluginOrTheme(npmName);
        if (!plugin || plugin.version !== req.params.pluginVersion) {
            return res.sendStatus(404);
        }
        res.locals.registeredPlugin = plugin;
        return next();
    }
];
exports.servePluginStaticDirectoryValidator = servePluginStaticDirectoryValidator;
const listPluginsValidator = [
    express_validator_1.query('pluginType')
        .optional()
        .custom(plugins_1.isPluginTypeValid).withMessage('Should have a valid plugin type'),
    express_validator_1.query('uninstalled')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull)
        .custom(misc_1.isBooleanValid).withMessage('Should have a valid uninstalled attribute'),
    (req, res, next) => {
        logger_1.logger.debug('Checking listPluginsValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.listPluginsValidator = listPluginsValidator;
const installOrUpdatePluginValidator = [
    express_validator_1.body('npmName')
        .optional()
        .custom(plugins_1.isNpmPluginNameValid).withMessage('Should have a valid npm name'),
    express_validator_1.body('path')
        .optional()
        .custom(misc_1.isSafePath).withMessage('Should have a valid safe path'),
    (req, res, next) => {
        logger_1.logger.debug('Checking installOrUpdatePluginValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const body = req.body;
        if (!body.path && !body.npmName) {
            return res.status(400)
                .json({ error: 'Should have either a npmName or a path' })
                .end();
        }
        return next();
    }
];
exports.installOrUpdatePluginValidator = installOrUpdatePluginValidator;
const uninstallPluginValidator = [
    express_validator_1.body('npmName').custom(plugins_1.isNpmPluginNameValid).withMessage('Should have a valid npm name'),
    (req, res, next) => {
        logger_1.logger.debug('Checking uninstallPluginValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.uninstallPluginValidator = uninstallPluginValidator;
const existingPluginValidator = [
    express_validator_1.param('npmName').custom(plugins_1.isNpmPluginNameValid).withMessage('Should have a valid plugin name'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking enabledPluginValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const plugin = yield plugin_1.PluginModel.loadByNpmName(req.params.npmName);
        if (!plugin) {
            return res.status(404)
                .json({ error: 'Plugin not found' })
                .end();
        }
        res.locals.plugin = plugin;
        return next();
    })
];
exports.existingPluginValidator = existingPluginValidator;
const updatePluginSettingsValidator = [
    express_validator_1.body('settings').exists().withMessage('Should have settings'),
    (req, res, next) => {
        logger_1.logger.debug('Checking enabledPluginValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.updatePluginSettingsValidator = updatePluginSettingsValidator;
const listAvailablePluginsValidator = [
    express_validator_1.query('search')
        .optional()
        .exists().withMessage('Should have a valid search'),
    express_validator_1.query('pluginType')
        .optional()
        .custom(plugins_1.isPluginTypeValid).withMessage('Should have a valid plugin type'),
    express_validator_1.query('currentPeerTubeEngine')
        .optional()
        .custom(plugins_1.isPluginVersionValid).withMessage('Should have a valid current peertube engine'),
    (req, res, next) => {
        logger_1.logger.debug('Checking enabledPluginValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (config_1.CONFIG.PLUGINS.INDEX.ENABLED === false) {
            return res.status(400)
                .json({ error: 'Plugin index is not enabled' })
                .end();
        }
        return next();
    }
];
exports.listAvailablePluginsValidator = listAvailablePluginsValidator;
