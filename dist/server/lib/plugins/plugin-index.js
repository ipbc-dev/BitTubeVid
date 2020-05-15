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
const requests_1 = require("../../helpers/requests");
const config_1 = require("../../initializers/config");
const plugin_1 = require("../../models/server/plugin");
const plugin_manager_1 = require("./plugin-manager");
const logger_1 = require("../../helpers/logger");
const constants_1 = require("../../initializers/constants");
function listAvailablePluginsFromIndex(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { start = 0, count = 20, search, sort = 'npmName', pluginType } = options;
        const qs = {
            start,
            count,
            sort,
            pluginType,
            search,
            currentPeerTubeEngine: options.currentPeerTubeEngine || constants_1.PEERTUBE_VERSION
        };
        const uri = config_1.CONFIG.PLUGINS.INDEX.URL + '/api/v1/plugins';
        try {
            const { body } = yield requests_1.doRequest({ uri, qs, json: true });
            logger_1.logger.debug('Got result from BitTube index.', { body });
            yield addInstanceInformation(body);
            return body;
        }
        catch (err) {
            logger_1.logger.error('Cannot list available plugins from index %s.', uri, { err });
            return undefined;
        }
    });
}
exports.listAvailablePluginsFromIndex = listAvailablePluginsFromIndex;
function addInstanceInformation(result) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const d of result.data) {
            d.installed = plugin_manager_1.PluginManager.Instance.isRegistered(d.npmName);
            d.name = plugin_1.PluginModel.normalizePluginName(d.npmName);
        }
        return result;
    });
}
function getLatestPluginsVersion(npmNames) {
    return __awaiter(this, void 0, void 0, function* () {
        const bodyRequest = {
            npmNames,
            currentPeerTubeEngine: constants_1.PEERTUBE_VERSION
        };
        const uri = config_1.CONFIG.PLUGINS.INDEX.URL + '/api/v1/plugins/latest-version';
        const { body } = yield requests_1.doRequest({ uri, body: bodyRequest, json: true, method: 'POST' });
        return body;
    });
}
exports.getLatestPluginsVersion = getLatestPluginsVersion;
