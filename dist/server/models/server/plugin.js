"use strict";
var PluginModel_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginModel = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const plugin_type_1 = require("../../../shared/models/plugins/plugin.type");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const utils_1 = require("../utils");
let PluginModel = PluginModel_1 = class PluginModel extends sequelize_typescript_1.Model {
    static listEnabledPluginsAndThemes() {
        const query = {
            where: {
                enabled: true,
                uninstalled: false
            }
        };
        return PluginModel_1.findAll(query);
    }
    static loadByNpmName(npmName) {
        const name = this.normalizePluginName(npmName);
        const type = this.getTypeFromNpmName(npmName);
        const query = {
            where: {
                name,
                type
            }
        };
        return PluginModel_1.findOne(query);
    }
    static getSetting(pluginName, pluginType, settingName, registeredSettings) {
        const query = {
            attributes: ['settings'],
            where: {
                name: pluginName,
                type: pluginType
            }
        };
        return PluginModel_1.findOne(query)
            .then(p => {
            if (!p || !p.settings || p.settings === undefined) {
                const registered = registeredSettings.find(s => s.name === settingName);
                if (!registered || registered.default === undefined)
                    return undefined;
                return registered.default;
            }
            return p.settings[settingName];
        });
    }
    static getSettings(pluginName, pluginType, settingNames, registeredSettings) {
        const query = {
            attributes: ['settings'],
            where: {
                name: pluginName,
                type: pluginType
            }
        };
        return PluginModel_1.findOne(query)
            .then(p => {
            const result = {};
            for (const name of settingNames) {
                if (!p || !p.settings || p.settings[name] === undefined) {
                    const registered = registeredSettings.find(s => s.name === name);
                    if ((registered === null || registered === void 0 ? void 0 : registered.default) !== undefined) {
                        result[name] = registered.default;
                    }
                }
                else {
                    result[name] = p.settings[name];
                }
            }
            return result;
        });
    }
    static setSetting(pluginName, pluginType, settingName, settingValue) {
        const query = {
            where: {
                name: pluginName,
                type: pluginType
            }
        };
        const toSave = {
            [`settings.${settingName}`]: settingValue
        };
        return PluginModel_1.update(toSave, query)
            .then(() => undefined);
    }
    static getData(pluginName, pluginType, key) {
        const query = {
            raw: true,
            attributes: [[sequelize_1.json('storage.' + key), 'value']],
            where: {
                name: pluginName,
                type: pluginType
            }
        };
        return PluginModel_1.findOne(query)
            .then((c) => {
            if (!c)
                return undefined;
            const value = c.value;
            if (typeof value === 'string' && value.startsWith('{')) {
                try {
                    return JSON.parse(value);
                }
                catch (_a) {
                    return value;
                }
            }
            return c.value;
        });
    }
    static storeData(pluginName, pluginType, key, data) {
        const query = 'UPDATE "plugin" SET "storage" = jsonb_set(coalesce("storage", \'{}\'), :key, :data::jsonb) ' +
            'WHERE "name" = :pluginName AND "type" = :pluginType';
        const jsonPath = '{' + key + '}';
        const options = {
            replacements: { pluginName, pluginType, key: jsonPath, data: JSON.stringify(data) },
            type: sequelize_1.QueryTypes.UPDATE
        };
        return PluginModel_1.sequelize.query(query, options)
            .then(() => undefined);
    }
    static listForApi(options) {
        const { uninstalled = false } = options;
        const query = {
            offset: options.start,
            limit: options.count,
            order: utils_1.getSort(options.sort),
            where: {
                uninstalled
            }
        };
        if (options.pluginType)
            query.where['type'] = options.pluginType;
        return PluginModel_1
            .findAndCountAll(query)
            .then(({ rows, count }) => {
            return { total: count, data: rows };
        });
    }
    static listInstalled() {
        const query = {
            where: {
                uninstalled: false
            }
        };
        return PluginModel_1.findAll(query);
    }
    static normalizePluginName(npmName) {
        return npmName.replace(/^peertube-((theme)|(plugin))-/, '');
    }
    static getTypeFromNpmName(npmName) {
        return npmName.startsWith('peertube-plugin-')
            ? plugin_type_1.PluginType.PLUGIN
            : plugin_type_1.PluginType.THEME;
    }
    static buildNpmName(name, type) {
        if (type === plugin_type_1.PluginType.THEME)
            return 'peertube-theme-' + name;
        return 'peertube-plugin-' + name;
    }
    getPublicSettings(registeredSettings) {
        const result = {};
        const settings = this.settings || {};
        for (const r of registeredSettings) {
            if (r.private !== false)
                continue;
            result[r.name] = settings[r.name] || r.default || null;
        }
        return result;
    }
    toFormattedJSON() {
        return {
            name: this.name,
            type: this.type,
            version: this.version,
            latestVersion: this.latestVersion,
            enabled: this.enabled,
            uninstalled: this.uninstalled,
            peertubeEngine: this.peertubeEngine,
            description: this.description,
            homepage: this.homepage,
            settings: this.settings,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('PluginName', value => utils_1.throwIfNotValid(value, plugins_1.isPluginNameValid, 'name')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], PluginModel.prototype, "name", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('PluginType', value => utils_1.throwIfNotValid(value, plugins_1.isPluginTypeValid, 'type')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], PluginModel.prototype, "type", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('PluginVersion', value => utils_1.throwIfNotValid(value, plugins_1.isPluginVersionValid, 'version')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], PluginModel.prototype, "version", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('PluginLatestVersion', value => utils_1.throwIfNotValid(value, plugins_1.isPluginVersionValid, 'version')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], PluginModel.prototype, "latestVersion", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], PluginModel.prototype, "enabled", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], PluginModel.prototype, "uninstalled", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], PluginModel.prototype, "peertubeEngine", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Is('PluginDescription', value => utils_1.throwIfNotValid(value, plugins_1.isPluginDescriptionValid, 'description')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], PluginModel.prototype, "description", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Is('PluginHomepage', value => utils_1.throwIfNotValid(value, plugins_1.isPluginHomepage, 'homepage')),
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], PluginModel.prototype, "homepage", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.JSONB),
    tslib_1.__metadata("design:type", Object)
], PluginModel.prototype, "settings", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.AllowNull(true),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.JSONB),
    tslib_1.__metadata("design:type", Object)
], PluginModel.prototype, "storage", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], PluginModel.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], PluginModel.prototype, "updatedAt", void 0);
PluginModel = PluginModel_1 = tslib_1.__decorate([
    sequelize_typescript_1.DefaultScope(() => ({
        attributes: {
            exclude: ['storage']
        }
    })),
    sequelize_typescript_1.Table({
        tableName: 'plugin',
        indexes: [
            {
                fields: ['name', 'type'],
                unique: true
            }
        ]
    })
], PluginModel);
exports.PluginModel = PluginModel;
