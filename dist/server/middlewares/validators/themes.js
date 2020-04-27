"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const plugin_manager_1 = require("../../lib/plugins/plugin-manager");
const misc_1 = require("../../helpers/custom-validators/misc");
const serveThemeCSSValidator = [
    express_validator_1.param('themeName').custom(plugins_1.isPluginNameValid).withMessage('Should have a valid theme name'),
    express_validator_1.param('themeVersion').custom(plugins_1.isPluginVersionValid).withMessage('Should have a valid theme version'),
    express_validator_1.param('staticEndpoint').custom(misc_1.isSafePath).withMessage('Should have a valid static endpoint'),
    (req, res, next) => {
        logger_1.logger.debug('Checking serveThemeCSS parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const theme = plugin_manager_1.PluginManager.Instance.getRegisteredTheme(req.params.themeName);
        if (!theme || theme.version !== req.params.themeVersion) {
            return res.sendStatus(404);
        }
        if (theme.css.includes(req.params.staticEndpoint) === false) {
            return res.sendStatus(404);
        }
        res.locals.registeredPlugin = theme;
        return next();
    }
];
exports.serveThemeCSSValidator = serveThemeCSSValidator;
