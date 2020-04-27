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
const plugin_1 = require("../../models/server/plugin");
const logger_1 = require("../../helpers/logger");
const path_1 = require("path");
const config_1 = require("../../initializers/config");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const fs_1 = require("fs");
const constants_1 = require("../../initializers/constants");
const plugin_type_1 = require("../../../shared/models/plugins/plugin.type");
const yarn_1 = require("./yarn");
const fs_extra_1 = require("fs-extra");
const server_hook_model_1 = require("../../../shared/models/plugins/server-hook.model");
const hooks_1 = require("../../../shared/core-utils/plugins/hooks");
const client_html_1 = require("../client-html");
class PluginManager {
    constructor() {
        this.registeredPlugins = {};
        this.settings = {};
        this.hooks = {};
        this.translations = {};
        this.updatedVideoConstants = {
            language: {},
            licence: {},
            category: {}
        };
    }
    isRegistered(npmName) {
        return !!this.getRegisteredPluginOrTheme(npmName);
    }
    getRegisteredPluginOrTheme(npmName) {
        return this.registeredPlugins[npmName];
    }
    getRegisteredPlugin(name) {
        const npmName = plugin_1.PluginModel.buildNpmName(name, plugin_type_1.PluginType.PLUGIN);
        const registered = this.getRegisteredPluginOrTheme(npmName);
        if (!registered || registered.type !== plugin_type_1.PluginType.PLUGIN)
            return undefined;
        return registered;
    }
    getRegisteredTheme(name) {
        const npmName = plugin_1.PluginModel.buildNpmName(name, plugin_type_1.PluginType.THEME);
        const registered = this.getRegisteredPluginOrTheme(npmName);
        if (!registered || registered.type !== plugin_type_1.PluginType.THEME)
            return undefined;
        return registered;
    }
    getRegisteredPlugins() {
        return this.getRegisteredPluginsOrThemes(plugin_type_1.PluginType.PLUGIN);
    }
    getRegisteredThemes() {
        return this.getRegisteredPluginsOrThemes(plugin_type_1.PluginType.THEME);
    }
    getRegisteredSettings(npmName) {
        return this.settings[npmName] || [];
    }
    getTranslations(locale) {
        return this.translations[locale] || {};
    }
    runHook(hookName, result, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hooks[hookName])
                return Promise.resolve(result);
            const hookType = hooks_1.getHookType(hookName);
            for (const hook of this.hooks[hookName]) {
                logger_1.logger.debug('Running hook %s of plugin %s.', hookName, hook.npmName);
                result = yield hooks_1.internalRunHook(hook.handler, hookType, result, params, err => {
                    logger_1.logger.error('Cannot run hook %s of plugin %s.', hookName, hook.pluginName, { err });
                });
            }
            return result;
        });
    }
    registerPluginsAndThemes() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.resetCSSGlobalFile();
            const plugins = yield plugin_1.PluginModel.listEnabledPluginsAndThemes();
            for (const plugin of plugins) {
                try {
                    yield this.registerPluginOrTheme(plugin);
                }
                catch (err) {
                    try {
                        yield this.unregister(plugin_1.PluginModel.buildNpmName(plugin.name, plugin.type));
                    }
                    catch (_a) {
                    }
                    logger_1.logger.error('Cannot register plugin %s, skipping.', plugin.name, { err });
                }
            }
            this.sortHooksByPriority();
        });
    }
    unregister(npmName) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Unregister plugin %s.', npmName);
            const plugin = this.getRegisteredPluginOrTheme(npmName);
            if (!plugin) {
                throw new Error(`Unknown plugin ${npmName} to unregister`);
            }
            delete this.registeredPlugins[plugin.npmName];
            delete this.settings[plugin.npmName];
            this.deleteTranslations(plugin.npmName);
            if (plugin.type === plugin_type_1.PluginType.PLUGIN) {
                yield plugin.unregister();
                for (const key of Object.keys(this.hooks)) {
                    this.hooks[key] = this.hooks[key].filter(h => h.npmName !== npmName);
                }
                this.reinitVideoConstants(plugin.npmName);
                logger_1.logger.info('Regenerating registered plugin CSS to global file.');
                yield this.regeneratePluginGlobalCSS();
            }
        });
    }
    install(toInstall, version, fromDisk = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let plugin;
            let npmName;
            logger_1.logger.info('Installing plugin %s.', toInstall);
            try {
                fromDisk
                    ? yield yarn_1.installNpmPluginFromDisk(toInstall)
                    : yield yarn_1.installNpmPlugin(toInstall, version);
                npmName = fromDisk ? path_1.basename(toInstall) : toInstall;
                const pluginType = plugin_1.PluginModel.getTypeFromNpmName(npmName);
                const pluginName = plugin_1.PluginModel.normalizePluginName(npmName);
                const packageJSON = yield this.getPackageJSON(pluginName, pluginType);
                this.sanitizeAndCheckPackageJSONOrThrow(packageJSON, pluginType);
                [plugin] = yield plugin_1.PluginModel.upsert({
                    name: pluginName,
                    description: packageJSON.description,
                    homepage: packageJSON.homepage,
                    type: pluginType,
                    version: packageJSON.version,
                    enabled: true,
                    uninstalled: false,
                    peertubeEngine: packageJSON.engine.peertube
                }, { returning: true });
            }
            catch (err) {
                logger_1.logger.error('Cannot install plugin %s, removing it...', toInstall, { err });
                try {
                    yield yarn_1.removeNpmPlugin(npmName);
                }
                catch (err) {
                    logger_1.logger.error('Cannot remove plugin %s after failed installation.', toInstall, { err });
                }
                throw err;
            }
            logger_1.logger.info('Successful installation of plugin %s.', toInstall);
            yield this.registerPluginOrTheme(plugin);
            return plugin;
        });
    }
    update(toUpdate, version, fromDisk = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const npmName = fromDisk ? path_1.basename(toUpdate) : toUpdate;
            logger_1.logger.info('Updating plugin %s.', npmName);
            yield this.unregister(npmName);
            return this.install(toUpdate, version, fromDisk);
        });
    }
    uninstall(npmName) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Uninstalling plugin %s.', npmName);
            try {
                yield this.unregister(npmName);
            }
            catch (err) {
                logger_1.logger.warn('Cannot unregister plugin %s.', npmName, { err });
            }
            const plugin = yield plugin_1.PluginModel.loadByNpmName(npmName);
            if (!plugin || plugin.uninstalled === true) {
                logger_1.logger.error('Cannot uninstall plugin %s: it does not exist or is already uninstalled.', npmName);
                return;
            }
            plugin.enabled = false;
            plugin.uninstalled = true;
            yield plugin.save();
            yield yarn_1.removeNpmPlugin(npmName);
            logger_1.logger.info('Plugin %s uninstalled.', npmName);
        });
    }
    registerPluginOrTheme(plugin) {
        return __awaiter(this, void 0, void 0, function* () {
            const npmName = plugin_1.PluginModel.buildNpmName(plugin.name, plugin.type);
            logger_1.logger.info('Registering plugin or theme %s.', npmName);
            const packageJSON = yield this.getPackageJSON(plugin.name, plugin.type);
            const pluginPath = this.getPluginPath(plugin.name, plugin.type);
            this.sanitizeAndCheckPackageJSONOrThrow(packageJSON, plugin.type);
            let library;
            if (plugin.type === plugin_type_1.PluginType.PLUGIN) {
                library = yield this.registerPlugin(plugin, pluginPath, packageJSON);
            }
            const clientScripts = {};
            for (const c of packageJSON.clientScripts) {
                clientScripts[c.script] = c;
            }
            this.registeredPlugins[npmName] = {
                npmName,
                name: plugin.name,
                type: plugin.type,
                version: plugin.version,
                description: plugin.description,
                peertubeEngine: plugin.peertubeEngine,
                path: pluginPath,
                staticDirs: packageJSON.staticDirs,
                clientScripts,
                css: packageJSON.css,
                unregister: library ? library.unregister : undefined
            };
            yield this.addTranslations(plugin, npmName, packageJSON.translations);
        });
    }
    registerPlugin(plugin, pluginPath, packageJSON) {
        return __awaiter(this, void 0, void 0, function* () {
            const npmName = plugin_1.PluginModel.buildNpmName(plugin.name, plugin.type);
            const modulePath = path_1.join(pluginPath, packageJSON.library);
            delete require.cache[modulePath];
            const library = require(modulePath);
            if (!plugins_1.isLibraryCodeValid(library)) {
                throw new Error('Library code is not valid (miss register or unregister function)');
            }
            const registerHelpers = this.getRegisterHelpers(npmName, plugin);
            library.register(registerHelpers)
                .catch(err => logger_1.logger.error('Cannot register plugin %s.', npmName, { err }));
            logger_1.logger.info('Add plugin %s CSS to global file.', npmName);
            yield this.addCSSToGlobalFile(pluginPath, packageJSON.css);
            return library;
        });
    }
    addTranslations(plugin, npmName, translationPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const locale of Object.keys(translationPaths)) {
                const path = translationPaths[locale];
                const json = yield fs_extra_1.readJSON(path_1.join(this.getPluginPath(plugin.name, plugin.type), path));
                if (!this.translations[locale])
                    this.translations[locale] = {};
                this.translations[locale][npmName] = json;
                logger_1.logger.info('Added locale %s of plugin %s.', locale, npmName);
            }
        });
    }
    deleteTranslations(npmName) {
        for (const locale of Object.keys(this.translations)) {
            delete this.translations[locale][npmName];
            logger_1.logger.info('Deleted locale %s of plugin %s.', locale, npmName);
        }
    }
    resetCSSGlobalFile() {
        client_html_1.ClientHtml.invalidCache();
        return fs_extra_1.outputFile(constants_1.PLUGIN_GLOBAL_CSS_PATH, '');
    }
    addCSSToGlobalFile(pluginPath, cssRelativePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const cssPath of cssRelativePaths) {
                yield this.concatFiles(path_1.join(pluginPath, cssPath), constants_1.PLUGIN_GLOBAL_CSS_PATH);
            }
            client_html_1.ClientHtml.invalidCache();
        });
    }
    concatFiles(input, output) {
        return new Promise((res, rej) => {
            const inputStream = fs_1.createReadStream(input);
            const outputStream = fs_1.createWriteStream(output, { flags: 'a' });
            inputStream.pipe(outputStream);
            inputStream.on('end', () => res());
            inputStream.on('error', err => rej(err));
        });
    }
    regeneratePluginGlobalCSS() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.resetCSSGlobalFile();
            for (const plugin of this.getRegisteredPlugins()) {
                yield this.addCSSToGlobalFile(plugin.path, plugin.css);
            }
        });
    }
    sortHooksByPriority() {
        for (const hookName of Object.keys(this.hooks)) {
            this.hooks[hookName].sort((a, b) => {
                return b.priority - a.priority;
            });
        }
    }
    getPackageJSON(pluginName, pluginType) {
        const pluginPath = path_1.join(this.getPluginPath(pluginName, pluginType), 'package.json');
        return fs_extra_1.readJSON(pluginPath);
    }
    getPluginPath(pluginName, pluginType) {
        const npmName = plugin_1.PluginModel.buildNpmName(pluginName, pluginType);
        return path_1.join(config_1.CONFIG.STORAGE.PLUGINS_DIR, 'node_modules', npmName);
    }
    getRegisteredPluginsOrThemes(type) {
        const plugins = [];
        for (const npmName of Object.keys(this.registeredPlugins)) {
            const plugin = this.registeredPlugins[npmName];
            if (plugin.type !== type)
                continue;
            plugins.push(plugin);
        }
        return plugins;
    }
    getRegisterHelpers(npmName, plugin) {
        const registerHook = (options) => {
            if (server_hook_model_1.serverHookObject[options.target] !== true) {
                logger_1.logger.warn('Unknown hook %s of plugin %s. Skipping.', options.target, npmName);
                return;
            }
            if (!this.hooks[options.target])
                this.hooks[options.target] = [];
            this.hooks[options.target].push({
                npmName,
                pluginName: plugin.name,
                handler: options.handler,
                priority: options.priority || 0
            });
        };
        const registerSetting = (options) => {
            if (!this.settings[npmName])
                this.settings[npmName] = [];
            this.settings[npmName].push(options);
        };
        const settingsManager = {
            getSetting: (name) => plugin_1.PluginModel.getSetting(plugin.name, plugin.type, name),
            setSetting: (name, value) => plugin_1.PluginModel.setSetting(plugin.name, plugin.type, name, value)
        };
        const storageManager = {
            getData: (key) => plugin_1.PluginModel.getData(plugin.name, plugin.type, key),
            storeData: (key, data) => plugin_1.PluginModel.storeData(plugin.name, plugin.type, key, data)
        };
        const videoLanguageManager = {
            addLanguage: (key, label) => this.addConstant({ npmName, type: 'language', obj: constants_1.VIDEO_LANGUAGES, key, label }),
            deleteLanguage: (key) => this.deleteConstant({ npmName, type: 'language', obj: constants_1.VIDEO_LANGUAGES, key })
        };
        const videoCategoryManager = {
            addCategory: (key, label) => this.addConstant({ npmName, type: 'category', obj: constants_1.VIDEO_CATEGORIES, key, label }),
            deleteCategory: (key) => this.deleteConstant({ npmName, type: 'category', obj: constants_1.VIDEO_CATEGORIES, key })
        };
        const videoLicenceManager = {
            addLicence: (key, label) => this.addConstant({ npmName, type: 'licence', obj: constants_1.VIDEO_LICENCES, key, label }),
            deleteLicence: (key) => this.deleteConstant({ npmName, type: 'licence', obj: constants_1.VIDEO_LICENCES, key })
        };
        const peertubeHelpers = {
            logger: logger_1.logger
        };
        return {
            registerHook,
            registerSetting,
            settingsManager,
            storageManager,
            videoLanguageManager,
            videoCategoryManager,
            videoLicenceManager,
            peertubeHelpers
        };
    }
    addConstant(parameters) {
        const { npmName, type, obj, key, label } = parameters;
        if (obj[key]) {
            logger_1.logger.warn('Cannot add %s %s by plugin %s: key already exists.', type, npmName, key);
            return false;
        }
        if (!this.updatedVideoConstants[type][npmName]) {
            this.updatedVideoConstants[type][npmName] = {
                added: [],
                deleted: []
            };
        }
        this.updatedVideoConstants[type][npmName].added.push({ key, label });
        obj[key] = label;
        return true;
    }
    deleteConstant(parameters) {
        const { npmName, type, obj, key } = parameters;
        if (!obj[key]) {
            logger_1.logger.warn('Cannot delete %s %s by plugin %s: key does not exist.', type, npmName, key);
            return false;
        }
        if (!this.updatedVideoConstants[type][npmName]) {
            this.updatedVideoConstants[type][npmName] = {
                added: [],
                deleted: []
            };
        }
        this.updatedVideoConstants[type][npmName].deleted.push({ key, label: obj[key] });
        delete obj[key];
        return true;
    }
    reinitVideoConstants(npmName) {
        const hash = {
            language: constants_1.VIDEO_LANGUAGES,
            licence: constants_1.VIDEO_LICENCES,
            category: constants_1.VIDEO_CATEGORIES
        };
        const types = ['language', 'licence', 'category'];
        for (const type of types) {
            const updatedConstants = this.updatedVideoConstants[type][npmName];
            if (!updatedConstants)
                continue;
            for (const added of updatedConstants.added) {
                delete hash[type][added.key];
            }
            for (const deleted of updatedConstants.deleted) {
                hash[type][deleted.key] = deleted.label;
            }
            delete this.updatedVideoConstants[type][npmName];
        }
    }
    sanitizeAndCheckPackageJSONOrThrow(packageJSON, pluginType) {
        if (!packageJSON.staticDirs)
            packageJSON.staticDirs = {};
        if (!packageJSON.css)
            packageJSON.css = [];
        if (!packageJSON.clientScripts)
            packageJSON.clientScripts = [];
        if (!packageJSON.translations)
            packageJSON.translations = {};
        const { result: packageJSONValid, badFields } = plugins_1.isPackageJSONValid(packageJSON, pluginType);
        if (!packageJSONValid) {
            const formattedFields = badFields.map(f => `"${f}"`)
                .join(', ');
            throw new Error(`PackageJSON is invalid (invalid fields: ${formattedFields}).`);
        }
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.PluginManager = PluginManager;
