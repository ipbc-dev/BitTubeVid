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
const plugin_manager_1 = require("./plugin-manager");
const logger_1 = require("../../helpers/logger");
const Hooks = {
    wrapObject: (result, hookName) => {
        return plugin_manager_1.PluginManager.Instance.runHook(hookName, result);
    },
    wrapPromiseFun: (fun, params, hookName) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield fun(params);
        return plugin_manager_1.PluginManager.Instance.runHook(hookName, result, params);
    }),
    wrapFun: (fun, params, hookName) => __awaiter(void 0, void 0, void 0, function* () {
        const result = fun(params);
        return plugin_manager_1.PluginManager.Instance.runHook(hookName, result, params);
    }),
    runAction: (hookName, params) => {
        plugin_manager_1.PluginManager.Instance.runHook(hookName, params)
            .catch(err => logger_1.logger.error('Fatal hook error.', { err }));
    }
};
exports.Hooks = Hooks;
