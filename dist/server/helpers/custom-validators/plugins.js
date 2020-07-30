"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNpmPluginNameValid = exports.isLibraryCodeValid = exports.isPluginDescriptionValid = exports.isPluginNameValid = exports.isPluginVersionValid = exports.isPluginHomepage = exports.isThemeNameValid = exports.isPackageJSONValid = exports.isPluginTypeValid = void 0;
const misc_1 = require("./misc");
const validator_1 = require("validator");
const plugin_type_1 = require("../../../shared/models/plugins/plugin.type");
const constants_1 = require("../../initializers/constants");
const misc_2 = require("./activitypub/misc");
const PLUGINS_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.PLUGINS;
function isPluginTypeValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value) && plugin_type_1.PluginType[value] !== undefined;
}
exports.isPluginTypeValid = isPluginTypeValid;
function isPluginNameValid(value) {
    return misc_1.exists(value) &&
        validator_1.default.isLength(value, PLUGINS_CONSTRAINTS_FIELDS.NAME) &&
        validator_1.default.matches(value, /^[a-z-0-9]+$/);
}
exports.isPluginNameValid = isPluginNameValid;
function isNpmPluginNameValid(value) {
    return misc_1.exists(value) &&
        validator_1.default.isLength(value, PLUGINS_CONSTRAINTS_FIELDS.NAME) &&
        validator_1.default.matches(value, /^[a-z\-._0-9]+$/) &&
        (value.startsWith('peertube-plugin-') || value.startsWith('peertube-theme-'));
}
exports.isNpmPluginNameValid = isNpmPluginNameValid;
function isPluginDescriptionValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, PLUGINS_CONSTRAINTS_FIELDS.DESCRIPTION);
}
exports.isPluginDescriptionValid = isPluginDescriptionValid;
function isPluginVersionValid(value) {
    if (!misc_1.exists(value))
        return false;
    const parts = (value + '').split('.');
    return parts.length === 3 && parts.every(p => validator_1.default.isInt(p));
}
exports.isPluginVersionValid = isPluginVersionValid;
function isPluginEngineValid(engine) {
    return misc_1.exists(engine) && misc_1.exists(engine.peertube);
}
function isPluginHomepage(value) {
    return misc_1.exists(value) && (!value || misc_2.isUrlValid(value));
}
exports.isPluginHomepage = isPluginHomepage;
function isPluginBugs(value) {
    return misc_1.exists(value) && (!value || misc_2.isUrlValid(value));
}
function areStaticDirectoriesValid(staticDirs) {
    if (!misc_1.exists(staticDirs) || typeof staticDirs !== 'object')
        return false;
    for (const key of Object.keys(staticDirs)) {
        if (!misc_1.isSafePath(staticDirs[key]))
            return false;
    }
    return true;
}
function areClientScriptsValid(clientScripts) {
    return misc_1.isArray(clientScripts) &&
        clientScripts.every(c => {
            return misc_1.isSafePath(c.script) && misc_1.isArray(c.scopes);
        });
}
function areTranslationPathsValid(translations) {
    if (!misc_1.exists(translations) || typeof translations !== 'object')
        return false;
    for (const key of Object.keys(translations)) {
        if (!misc_1.isSafePath(translations[key]))
            return false;
    }
    return true;
}
function areCSSPathsValid(css) {
    return misc_1.isArray(css) && css.every(c => misc_1.isSafePath(c));
}
function isThemeNameValid(name) {
    return isPluginNameValid(name);
}
exports.isThemeNameValid = isThemeNameValid;
function isPackageJSONValid(packageJSON, pluginType) {
    let result = true;
    const badFields = [];
    if (!isNpmPluginNameValid(packageJSON.name)) {
        result = false;
        badFields.push('name');
    }
    if (!isPluginDescriptionValid(packageJSON.description)) {
        result = false;
        badFields.push('description');
    }
    if (!isPluginEngineValid(packageJSON.engine)) {
        result = false;
        badFields.push('engine');
    }
    if (!isPluginHomepage(packageJSON.homepage)) {
        result = false;
        badFields.push('homepage');
    }
    if (!misc_1.exists(packageJSON.author)) {
        result = false;
        badFields.push('author');
    }
    if (!isPluginBugs(packageJSON.bugs)) {
        result = false;
        badFields.push('bugs');
    }
    if (pluginType === plugin_type_1.PluginType.PLUGIN && !misc_1.isSafePath(packageJSON.library)) {
        result = false;
        badFields.push('library');
    }
    if (!areStaticDirectoriesValid(packageJSON.staticDirs)) {
        result = false;
        badFields.push('staticDirs');
    }
    if (!areCSSPathsValid(packageJSON.css)) {
        result = false;
        badFields.push('css');
    }
    if (!areClientScriptsValid(packageJSON.clientScripts)) {
        result = false;
        badFields.push('clientScripts');
    }
    if (!areTranslationPathsValid(packageJSON.translations)) {
        result = false;
        badFields.push('translations');
    }
    return { result, badFields };
}
exports.isPackageJSONValid = isPackageJSONValid;
function isLibraryCodeValid(library) {
    return typeof library.register === 'function' &&
        typeof library.unregister === 'function';
}
exports.isLibraryCodeValid = isLibraryCodeValid;
