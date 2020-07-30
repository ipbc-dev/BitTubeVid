"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const plugin_type_1 = require("../../../../shared/models/plugins/plugin.type");
const expect = chai.expect;
describe('Test plugins', function () {
    let server = null;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const configOverride = {
                plugins: {
                    index: { check_latest_versions_interval: '5 seconds' }
                }
            };
            server = yield extra_utils_1.flushAndRunServer(1, configOverride);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    it('Should list and search available plugins and themes', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            {
                const res = yield extra_utils_1.listAvailablePlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    count: 1,
                    start: 0,
                    pluginType: plugin_type_1.PluginType.THEME,
                    search: 'background-red'
                });
                expect(res.body.total).to.be.at.least(1);
                expect(res.body.data).to.have.lengthOf(1);
            }
            {
                const res1 = yield extra_utils_1.listAvailablePlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    count: 2,
                    start: 0,
                    sort: 'npmName'
                });
                const data1 = res1.body.data;
                expect(res1.body.total).to.be.at.least(2);
                expect(data1).to.have.lengthOf(2);
                const res2 = yield extra_utils_1.listAvailablePlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    count: 2,
                    start: 0,
                    sort: '-npmName'
                });
                const data2 = res2.body.data;
                expect(res2.body.total).to.be.at.least(2);
                expect(data2).to.have.lengthOf(2);
                expect(data1[0].npmName).to.not.equal(data2[0].npmName);
            }
            {
                const res = yield extra_utils_1.listAvailablePlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    count: 10,
                    start: 0,
                    pluginType: plugin_type_1.PluginType.THEME,
                    search: 'background-red',
                    currentPeerTubeEngine: '1.0.0'
                });
                const data = res.body.data;
                const p = data.find(p => p.npmName === 'peertube-theme-background-red');
                expect(p).to.be.undefined;
            }
        });
    });
    it('Should have an empty global css', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPluginsCSS(server.url);
            expect(res.text).to.be.empty;
        });
    });
    it('Should install a plugin and a theme', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-hello-world'
            });
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-theme-background-red'
            });
        });
    });
    it('Should have the correct global css', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPluginsCSS(server.url);
            expect(res.text).to.contain('background-color: red');
        });
    });
    it('Should have the plugin loaded in the configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const theme = config.theme.registered.find(r => r.name === 'background-red');
            expect(theme).to.not.be.undefined;
            const plugin = config.plugin.registered.find(r => r.name === 'hello-world');
            expect(plugin).to.not.be.undefined;
        });
    });
    it('Should update the default theme in the configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, { theme: { default: 'background-red' } });
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            expect(config.theme.default).to.equal('background-red');
        });
    });
    it('Should update my default theme', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateMyUser({
                url: server.url,
                accessToken: server.accessToken,
                theme: 'background-red'
            });
            const res = yield extra_utils_1.getMyUserInformation(server.url, server.accessToken);
            expect(res.body.theme).to.equal('background-red');
        });
    });
    it('Should list plugins and themes', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield extra_utils_1.listPlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    count: 1,
                    start: 0,
                    pluginType: plugin_type_1.PluginType.THEME
                });
                const data = res.body.data;
                expect(res.body.total).to.be.at.least(1);
                expect(data).to.have.lengthOf(1);
                expect(data[0].name).to.equal('background-red');
            }
            {
                const res = yield extra_utils_1.listPlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    count: 2,
                    start: 0,
                    sort: 'name'
                });
                const data = res.body.data;
                expect(data[0].name).to.equal('background-red');
                expect(data[1].name).to.equal('hello-world');
            }
            {
                const res = yield extra_utils_1.listPlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    count: 2,
                    start: 1,
                    sort: 'name'
                });
                const data = res.body.data;
                expect(data[0].name).to.equal('hello-world');
            }
        });
    });
    it('Should get registered settings', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPluginRegisteredSettings({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-hello-world'
            });
            const registeredSettings = res.body.registeredSettings;
            expect(registeredSettings).to.have.length.at.least(1);
            const adminNameSettings = registeredSettings.find(s => s.name === 'admin-name');
            expect(adminNameSettings).to.not.be.undefined;
        });
    });
    it('Should get public settings', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPublicSettings({ url: server.url, npmName: 'peertube-plugin-hello-world' });
            const publicSettings = res.body.publicSettings;
            expect(Object.keys(publicSettings)).to.have.lengthOf(1);
            expect(Object.keys(publicSettings)).to.deep.equal(['user-name']);
            expect(publicSettings['user-name']).to.be.null;
        });
    });
    it('Should update the settings', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const settings = {
                'admin-name': 'Cid'
            };
            yield extra_utils_1.updatePluginSettings({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-hello-world',
                settings
            });
        });
    });
    it('Should have watched settings changes', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.waitUntilLog(server, 'Settings changed!');
        });
    });
    it('Should get a plugin and a theme', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield extra_utils_1.getPlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    npmName: 'peertube-plugin-hello-world'
                });
                const plugin = res.body;
                expect(plugin.type).to.equal(plugin_type_1.PluginType.PLUGIN);
                expect(plugin.name).to.equal('hello-world');
                expect(plugin.description).to.exist;
                expect(plugin.homepage).to.exist;
                expect(plugin.uninstalled).to.be.false;
                expect(plugin.enabled).to.be.true;
                expect(plugin.description).to.exist;
                expect(plugin.version).to.exist;
                expect(plugin.peertubeEngine).to.exist;
                expect(plugin.createdAt).to.exist;
                expect(plugin.settings).to.not.be.undefined;
                expect(plugin.settings['admin-name']).to.equal('Cid');
            }
            {
                const res = yield extra_utils_1.getPlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    npmName: 'peertube-theme-background-red'
                });
                const plugin = res.body;
                expect(plugin.type).to.equal(plugin_type_1.PluginType.THEME);
                expect(plugin.name).to.equal('background-red');
                expect(plugin.description).to.exist;
                expect(plugin.homepage).to.exist;
                expect(plugin.uninstalled).to.be.false;
                expect(plugin.enabled).to.be.true;
                expect(plugin.description).to.exist;
                expect(plugin.version).to.exist;
                expect(plugin.peertubeEngine).to.exist;
                expect(plugin.createdAt).to.exist;
                expect(plugin.settings).to.be.null;
            }
        });
    });
    it('Should update the plugin and the theme', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.wait(6000);
            yield extra_utils_1.setPluginVersion(server.internalServerNumber, 'hello-world', '0.0.1');
            const packageJSON = yield extra_utils_1.getPluginPackageJSON(server, 'peertube-plugin-hello-world');
            const oldVersion = packageJSON.version;
            packageJSON.version = '0.0.1';
            yield extra_utils_1.updatePluginPackageJSON(server, 'peertube-plugin-hello-world', packageJSON);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server);
            {
                const res = yield extra_utils_1.listPlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    pluginType: plugin_type_1.PluginType.PLUGIN
                });
                const plugin = res.body.data[0];
                expect(plugin.version).to.equal('0.0.1');
                expect(plugin.latestVersion).to.exist;
                expect(plugin.latestVersion).to.not.equal('0.0.1');
            }
            {
                yield extra_utils_1.updatePlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    npmName: 'peertube-plugin-hello-world'
                });
                const res = yield extra_utils_1.listPlugins({
                    url: server.url,
                    accessToken: server.accessToken,
                    pluginType: plugin_type_1.PluginType.PLUGIN
                });
                const plugin = res.body.data[0];
                expect(plugin.version).to.equal(oldVersion);
                const updatedPackageJSON = yield extra_utils_1.getPluginPackageJSON(server, 'peertube-plugin-hello-world');
                expect(updatedPackageJSON.version).to.equal(oldVersion);
            }
        });
    });
    it('Should uninstall the plugin', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-hello-world'
            });
            const res = yield extra_utils_1.listPlugins({
                url: server.url,
                accessToken: server.accessToken,
                pluginType: plugin_type_1.PluginType.PLUGIN
            });
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should have an empty global css', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPluginsCSS(server.url);
            expect(res.text).to.be.empty;
        });
    });
    it('Should list uninstalled plugins', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.listPlugins({
                url: server.url,
                accessToken: server.accessToken,
                pluginType: plugin_type_1.PluginType.PLUGIN,
                uninstalled: true
            });
            expect(res.body.total).to.equal(1);
            expect(res.body.data).to.have.lengthOf(1);
            const plugin = res.body.data[0];
            expect(plugin.name).to.equal('hello-world');
            expect(plugin.enabled).to.be.false;
            expect(plugin.uninstalled).to.be.true;
        });
    });
    it('Should uninstall the theme', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-theme-background-red'
            });
        });
    });
    it('Should have updated the configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            expect(config.theme.default).to.equal('default');
            const theme = config.theme.registered.find(r => r.name === 'background-red');
            expect(theme).to.be.undefined;
            const plugin = config.plugin.registered.find(r => r.name === 'hello-world');
            expect(plugin).to.be.undefined;
        });
    });
    it('Should have updated the user theme', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getMyUserInformation(server.url, server.accessToken);
            expect(res.body.theme).to.equal('instance-default');
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.closeAllSequelize([server]);
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
