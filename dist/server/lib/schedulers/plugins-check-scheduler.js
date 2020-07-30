"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginsCheckScheduler = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../helpers/logger");
const abstract_scheduler_1 = require("./abstract-scheduler");
const constants_1 = require("../../initializers/constants");
const config_1 = require("../../initializers/config");
const plugin_1 = require("../../models/server/plugin");
const lodash_1 = require("lodash");
const plugin_index_1 = require("../plugins/plugin-index");
const miscs_1 = require("../../../shared/core-utils/miscs/miscs");
class PluginsCheckScheduler extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = constants_1.SCHEDULER_INTERVALS_MS.checkPlugins;
    }
    internalExecute() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.checkLatestPluginsVersion();
        });
    }
    checkLatestPluginsVersion() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (config_1.CONFIG.PLUGINS.INDEX.ENABLED === false)
                return;
            logger_1.logger.info('Checking latest plugins version.');
            const plugins = yield plugin_1.PluginModel.listInstalled();
            const chunks = lodash_1.chunk(plugins, 10);
            for (const chunk of chunks) {
                const pluginIndex = {};
                for (const plugin of chunk) {
                    pluginIndex[plugin_1.PluginModel.buildNpmName(plugin.name, plugin.type)] = plugin;
                }
                const npmNames = Object.keys(pluginIndex);
                try {
                    const results = yield plugin_index_1.getLatestPluginsVersion(npmNames);
                    for (const result of results) {
                        const plugin = pluginIndex[result.npmName];
                        if (!result.latestVersion)
                            continue;
                        if (!plugin.latestVersion ||
                            (plugin.latestVersion !== result.latestVersion && miscs_1.compareSemVer(plugin.latestVersion, result.latestVersion) < 0)) {
                            plugin.latestVersion = result.latestVersion;
                            yield plugin.save();
                            logger_1.logger.info('Plugin %s has a new latest version %s.', result.npmName, plugin.latestVersion);
                        }
                    }
                }
                catch (err) {
                    logger_1.logger.error('Cannot get latest plugins version.', { npmNames, err });
                }
            }
        });
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.PluginsCheckScheduler = PluginsCheckScheduler;
