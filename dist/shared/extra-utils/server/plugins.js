"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_1 = require("../requests/requests");
const fs_extra_1 = require("fs-extra");
const miscs_1 = require("../miscs/miscs");
const path_1 = require("path");
function listPlugins(parameters) {
    const { url, accessToken, start, count, sort, pluginType, uninstalled, expectedStatus = 200 } = parameters;
    const path = '/api/v1/plugins';
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        query: {
            start,
            count,
            sort,
            pluginType,
            uninstalled
        },
        statusCodeExpected: expectedStatus
    });
}
exports.listPlugins = listPlugins;
function listAvailablePlugins(parameters) {
    const { url, accessToken, start, count, sort, pluginType, search, currentPeerTubeEngine, expectedStatus = 200 } = parameters;
    const path = '/api/v1/plugins/available';
    const query = {
        start,
        count,
        sort,
        pluginType,
        currentPeerTubeEngine,
        search
    };
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        query,
        statusCodeExpected: expectedStatus
    });
}
exports.listAvailablePlugins = listAvailablePlugins;
function getPlugin(parameters) {
    const { url, accessToken, npmName, expectedStatus = 200 } = parameters;
    const path = '/api/v1/plugins/' + npmName;
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        statusCodeExpected: expectedStatus
    });
}
exports.getPlugin = getPlugin;
function updatePluginSettings(parameters) {
    const { url, accessToken, npmName, settings, expectedStatus = 204 } = parameters;
    const path = '/api/v1/plugins/' + npmName + '/settings';
    return requests_1.makePutBodyRequest({
        url,
        path,
        token: accessToken,
        fields: { settings },
        statusCodeExpected: expectedStatus
    });
}
exports.updatePluginSettings = updatePluginSettings;
function getPluginRegisteredSettings(parameters) {
    const { url, accessToken, npmName, expectedStatus = 200 } = parameters;
    const path = '/api/v1/plugins/' + npmName + '/registered-settings';
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        statusCodeExpected: expectedStatus
    });
}
exports.getPluginRegisteredSettings = getPluginRegisteredSettings;
function getPublicSettings(parameters) {
    const { url, npmName, expectedStatus = 200 } = parameters;
    const path = '/api/v1/plugins/' + npmName + '/public-settings';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: expectedStatus
    });
}
exports.getPublicSettings = getPublicSettings;
function getPluginTranslations(parameters) {
    const { url, locale, expectedStatus = 200 } = parameters;
    const path = '/plugins/translations/' + locale + '.json';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: expectedStatus
    });
}
exports.getPluginTranslations = getPluginTranslations;
function installPlugin(parameters) {
    const { url, accessToken, npmName, path, expectedStatus = 200 } = parameters;
    const apiPath = '/api/v1/plugins/install';
    return requests_1.makePostBodyRequest({
        url,
        path: apiPath,
        token: accessToken,
        fields: { npmName, path },
        statusCodeExpected: expectedStatus
    });
}
exports.installPlugin = installPlugin;
function updatePlugin(parameters) {
    const { url, accessToken, npmName, path, expectedStatus = 200 } = parameters;
    const apiPath = '/api/v1/plugins/update';
    return requests_1.makePostBodyRequest({
        url,
        path: apiPath,
        token: accessToken,
        fields: { npmName, path },
        statusCodeExpected: expectedStatus
    });
}
exports.updatePlugin = updatePlugin;
function uninstallPlugin(parameters) {
    const { url, accessToken, npmName, expectedStatus = 204 } = parameters;
    const apiPath = '/api/v1/plugins/uninstall';
    return requests_1.makePostBodyRequest({
        url,
        path: apiPath,
        token: accessToken,
        fields: { npmName },
        statusCodeExpected: expectedStatus
    });
}
exports.uninstallPlugin = uninstallPlugin;
function getPluginsCSS(url) {
    const path = '/plugins/global.css';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: 200
    });
}
exports.getPluginsCSS = getPluginsCSS;
function getPackageJSONPath(server, npmName) {
    return path_1.join(miscs_1.root(), 'test' + server.internalServerNumber, 'plugins', 'node_modules', npmName, 'package.json');
}
exports.getPackageJSONPath = getPackageJSONPath;
function updatePluginPackageJSON(server, npmName, json) {
    const path = getPackageJSONPath(server, npmName);
    return fs_extra_1.writeJSON(path, json);
}
exports.updatePluginPackageJSON = updatePluginPackageJSON;
function getPluginPackageJSON(server, npmName) {
    const path = getPackageJSONPath(server, npmName);
    return fs_extra_1.readJSON(path);
}
exports.getPluginPackageJSON = getPluginPackageJSON;
function getPluginTestPath(suffix = '') {
    return path_1.join(miscs_1.root(), 'server', 'tests', 'fixtures', 'peertube-plugin-test' + suffix);
}
exports.getPluginTestPath = getPluginTestPath;
