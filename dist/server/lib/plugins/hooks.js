"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hooks = void 0;
const tslib_1 = require("tslib");
const plugin_manager_1 = require("./plugin-manager");
const logger_1 = require("../../helpers/logger");
const Hooks = {
    wrapObject: (result, hookName) => {
        return plugin_manager_1.PluginManager.Instance.runHook(hookName, result);
    },
    wrapPromiseFun: (fun, params, hookName) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const result = yield fun(params);
        return plugin_manager_1.PluginManager.Instance.runHook(hookName, result, params);
    }),
    wrapFun: (fun, params, hookName) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const result = fun(params);
        return plugin_manager_1.PluginManager.Instance.runHook(hookName, result, params);
    }),
    runAction: (hookName, params) => {
        plugin_manager_1.PluginManager.Instance.runHook(hookName, undefined, params)
            .catch(err => logger_1.logger.error('Fatal hook error.', { err }));
    }
};
exports.Hooks = Hooks;
