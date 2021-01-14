"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExternalAuth = exports.getPublicSettings = exports.getPluginTestPath = exports.getPluginPackageJSON = exports.updatePluginPackageJSON = exports.getPackageJSONPath = exports.getPluginRegisteredSettings = exports.updatePluginSettings = exports.testHelloWorldRegisteredSettings = exports.uninstallPlugin = exports.getPlugin = exports.updatePlugin = exports.getPluginsCSS = exports.getPluginTranslations = exports.installPlugin = exports.listAvailablePlugins = exports.listPlugins = void 0;
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const miscs_1 = require("../miscs/miscs");
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function listPlugins(parameters) {
    const { url, accessToken, start, count, sort, pluginType, uninstalled, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
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
    const { url, accessToken, start, count, sort, pluginType, search, currentPeerTubeEngine, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
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
    const { url, accessToken, npmName, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
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
    const { url, accessToken, npmName, settings, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204 } = parameters;
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
    const { url, accessToken, npmName, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
    const path = '/api/v1/plugins/' + npmName + '/registered-settings';
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        statusCodeExpected: expectedStatus
    });
}
exports.getPluginRegisteredSettings = getPluginRegisteredSettings;
function testHelloWorldRegisteredSettings(server) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield getPluginRegisteredSettings({
            url: server.url,
            accessToken: server.accessToken,
            npmName: 'peertube-plugin-hello-world'
        });
        const registeredSettings = res.body.registeredSettings;
        chai_1.expect(registeredSettings).to.have.length.at.least(1);
        const adminNameSettings = registeredSettings.find(s => s.name === 'admin-name');
        chai_1.expect(adminNameSettings).to.not.be.undefined;
    });
}
exports.testHelloWorldRegisteredSettings = testHelloWorldRegisteredSettings;
function getPublicSettings(parameters) {
    const { url, npmName, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
    const path = '/api/v1/plugins/' + npmName + '/public-settings';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: expectedStatus
    });
}
exports.getPublicSettings = getPublicSettings;
function getPluginTranslations(parameters) {
    const { url, locale, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
    const path = '/plugins/translations/' + locale + '.json';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: expectedStatus
    });
}
exports.getPluginTranslations = getPluginTranslations;
function installPlugin(parameters) {
    const { url, accessToken, npmName, path, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
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
    const { url, accessToken, npmName, path, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
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
    const { url, accessToken, npmName, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204 } = parameters;
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
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getPluginsCSS = getPluginsCSS;
function getPackageJSONPath(server, npmName) {
    return miscs_1.buildServerDirectory(server, path_1.join('plugins', 'node_modules', npmName, 'package.json'));
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
function getExternalAuth(options) {
    const { url, npmName, npmVersion, authName, statusCodeExpected, query } = options;
    const path = '/plugins/' + npmName + '/' + npmVersion + '/auth/' + authName;
    return requests_1.makeGetRequest({
        url,
        path,
        query,
        statusCodeExpected: statusCodeExpected || http_error_codes_1.HttpStatusCode.OK_200,
        redirects: 0
    });
}
exports.getExternalAuth = getExternalAuth;
