"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const plugin_type_1 = require("../../../../shared/models/plugins/plugin.type");
describe('Test server plugins API validators', function () {
    let server;
    let userAccessToken = null;
    const npmPlugin = 'peertube-plugin-hello-world';
    const pluginName = 'hello-world';
    let npmVersion;
    const themePlugin = 'peertube-theme-background-red';
    const themeName = 'background-red';
    let themeVersion;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const user = {
                username: 'user1',
                password: 'password'
            };
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(server, user);
            {
                const res = yield extra_utils_1.installPlugin({ url: server.url, accessToken: server.accessToken, npmName: npmPlugin });
                const plugin = res.body;
                npmVersion = plugin.version;
            }
            {
                const res = yield extra_utils_1.installPlugin({ url: server.url, accessToken: server.accessToken, npmName: themePlugin });
                const plugin = res.body;
                themeVersion = plugin.version;
            }
        });
    });
    describe('With static plugin routes', function () {
        it('Should fail with an unknown plugin name/plugin version', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const paths = [
                    '/plugins/' + pluginName + '/0.0.1/auth/fake-auth',
                    '/plugins/' + pluginName + '/0.0.1/static/images/chocobo.png',
                    '/plugins/' + pluginName + '/0.0.1/client-scripts/client/common-client-plugin.js',
                    '/themes/' + themeName + '/0.0.1/static/images/chocobo.png',
                    '/themes/' + themeName + '/0.0.1/client-scripts/client/video-watch-client-plugin.js',
                    '/themes/' + themeName + '/0.0.1/css/assets/style1.css'
                ];
                for (const p of paths) {
                    yield extra_utils_1.makeGetRequest({ url: server.url, path: p, statusCodeExpected: 404 });
                }
            });
        });
        it('Should fail when requesting a plugin in the theme path', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/themes/' + pluginName + '/' + npmVersion + '/static/images/chocobo.png',
                    statusCodeExpected: 404
                });
            });
        });
        it('Should fail with invalid versions', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const paths = [
                    '/plugins/' + pluginName + '/0.0.1.1/auth/fake-auth',
                    '/plugins/' + pluginName + '/0.0.1.1/static/images/chocobo.png',
                    '/plugins/' + pluginName + '/0.1/client-scripts/client/common-client-plugin.js',
                    '/themes/' + themeName + '/1/static/images/chocobo.png',
                    '/themes/' + themeName + '/0.0.1000a/client-scripts/client/video-watch-client-plugin.js',
                    '/themes/' + themeName + '/0.a.1/css/assets/style1.css'
                ];
                for (const p of paths) {
                    yield extra_utils_1.makeGetRequest({ url: server.url, path: p, statusCodeExpected: 400 });
                }
            });
        });
        it('Should fail with invalid paths', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const paths = [
                    '/plugins/' + pluginName + '/' + npmVersion + '/static/images/../chocobo.png',
                    '/plugins/' + pluginName + '/' + npmVersion + '/client-scripts/../client/common-client-plugin.js',
                    '/themes/' + themeName + '/' + themeVersion + '/static/../images/chocobo.png',
                    '/themes/' + themeName + '/' + themeVersion + '/client-scripts/client/video-watch-client-plugin.js/..',
                    '/themes/' + themeName + '/' + themeVersion + '/css/../assets/style1.css'
                ];
                for (const p of paths) {
                    yield extra_utils_1.makeGetRequest({ url: server.url, path: p, statusCodeExpected: 400 });
                }
            });
        });
        it('Should fail with an unknown auth name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/plugins/' + pluginName + '/' + npmVersion + '/auth/bad-auth';
                yield extra_utils_1.makeGetRequest({ url: server.url, path, statusCodeExpected: 404 });
            });
        });
        it('Should fail with an unknown static file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const paths = [
                    '/plugins/' + pluginName + '/' + npmVersion + '/static/fake/chocobo.png',
                    '/plugins/' + pluginName + '/' + npmVersion + '/client-scripts/client/fake.js',
                    '/themes/' + themeName + '/' + themeVersion + '/static/fake/chocobo.png',
                    '/themes/' + themeName + '/' + themeVersion + '/client-scripts/client/fake.js'
                ];
                for (const p of paths) {
                    yield extra_utils_1.makeGetRequest({ url: server.url, path: p, statusCodeExpected: 404 });
                }
            });
        });
        it('Should fail with an unknown CSS file', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/themes/' + themeName + '/' + themeVersion + '/css/assets/fake.css',
                    statusCodeExpected: 404
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const paths = [
                    '/plugins/' + pluginName + '/' + npmVersion + '/static/images/chocobo.png',
                    '/plugins/' + pluginName + '/' + npmVersion + '/client-scripts/client/common-client-plugin.js',
                    '/themes/' + themeName + '/' + themeVersion + '/static/images/chocobo.png',
                    '/themes/' + themeName + '/' + themeVersion + '/client-scripts/client/video-watch-client-plugin.js',
                    '/themes/' + themeName + '/' + themeVersion + '/css/assets/style1.css'
                ];
                for (const p of paths) {
                    yield extra_utils_1.makeGetRequest({ url: server.url, path: p, statusCodeExpected: 200 });
                }
                const authPath = '/plugins/' + pluginName + '/' + npmVersion + '/auth/fake-auth';
                yield extra_utils_1.makeGetRequest({ url: server.url, path: authPath, statusCodeExpected: 302 });
            });
        });
    });
    describe('When listing available plugins/themes', function () {
        const path = '/api/v1/plugins/available';
        const baseQuery = {
            search: 'super search',
            pluginType: plugin_type_1.PluginType.PLUGIN,
            currentPeerTubeEngine: '1.2.3'
        };
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: 'fake_token',
                    query: baseQuery,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    query: baseQuery,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an invalid plugin type', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const query = extra_utils_1.immutableAssign(baseQuery, { pluginType: 5 });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query
                });
            });
        });
        it('Should fail with an invalid current peertube engine', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const query = extra_utils_1.immutableAssign(baseQuery, { currentPeerTubeEngine: '1.0' });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query
                });
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query: baseQuery,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When listing local plugins/themes', function () {
        const path = '/api/v1/plugins';
        const baseQuery = {
            pluginType: plugin_type_1.PluginType.THEME
        };
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: 'fake_token',
                    query: baseQuery,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    query: baseQuery,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail with a bad start pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadStartPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with a bad count pagination', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadCountPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an incorrect sort', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.checkBadSortPagination(server.url, path, server.accessToken);
            });
        });
        it('Should fail with an invalid plugin type', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const query = extra_utils_1.immutableAssign(baseQuery, { pluginType: 5 });
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query
                });
            });
        });
        it('Should success with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: server.accessToken,
                    query: baseQuery,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When getting a plugin or the registered settings or public settings', function () {
        const path = '/api/v1/plugins/';
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of [npmPlugin, `${npmPlugin}/registered-settings`]) {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path: path + suffix,
                        token: 'fake_token',
                        statusCodeExpected: 401
                    });
                }
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of [npmPlugin, `${npmPlugin}/registered-settings`]) {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path: path + suffix,
                        token: userAccessToken,
                        statusCodeExpected: 403
                    });
                }
            });
        });
        it('Should fail with an invalid npm name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of ['toto', 'toto/registered-settings', 'toto/public-settings']) {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path: path + suffix,
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                }
                for (const suffix of ['peertube-plugin-TOTO', 'peertube-plugin-TOTO/registered-settings', 'peertube-plugin-TOTO/public-settings']) {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path: path + suffix,
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                }
            });
        });
        it('Should fail with an unknown plugin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of ['peertube-plugin-toto', 'peertube-plugin-toto/registered-settings', 'peertube-plugin-toto/public-settings']) {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path: path + suffix,
                        token: server.accessToken,
                        statusCodeExpected: 404
                    });
                }
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of [npmPlugin, `${npmPlugin}/registered-settings`, `${npmPlugin}/public-settings`]) {
                    yield extra_utils_1.makeGetRequest({
                        url: server.url,
                        path: path + suffix,
                        token: server.accessToken,
                        statusCodeExpected: 200
                    });
                }
            });
        });
    });
    describe('When updating plugin settings', function () {
        const path = '/api/v1/plugins/';
        const settings = { setting1: 'value1' };
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + npmPlugin + '/settings',
                    fields: { settings },
                    token: 'fake_token',
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + npmPlugin + '/settings',
                    fields: { settings },
                    token: userAccessToken,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail with an invalid npm name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + 'toto/settings',
                    fields: { settings },
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + 'peertube-plugin-TOTO/settings',
                    fields: { settings },
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with an unknown plugin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + 'peertube-plugin-toto/settings',
                    fields: { settings },
                    token: server.accessToken,
                    statusCodeExpected: 404
                });
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path: path + npmPlugin + '/settings',
                    fields: { settings },
                    token: server.accessToken,
                    statusCodeExpected: 204
                });
            });
        });
    });
    describe('When installing/updating/uninstalling a plugin', function () {
        const path = '/api/v1/plugins/';
        it('Should fail with an invalid token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of ['install', 'update', 'uninstall']) {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + suffix,
                        fields: { npmName: npmPlugin },
                        token: 'fake_token',
                        statusCodeExpected: 401
                    });
                }
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of ['install', 'update', 'uninstall']) {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + suffix,
                        fields: { npmName: npmPlugin },
                        token: userAccessToken,
                        statusCodeExpected: 403
                    });
                }
            });
        });
        it('Should fail with an invalid npm name', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const suffix of ['install', 'update', 'uninstall']) {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + suffix,
                        fields: { npmName: 'toto' },
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                }
                for (const suffix of ['install', 'update', 'uninstall']) {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + suffix,
                        fields: { npmName: 'peertube-plugin-TOTO' },
                        token: server.accessToken,
                        statusCodeExpected: 400
                    });
                }
            });
        });
        it('Should succeed with the correct parameters', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const it = [
                    { suffix: 'install', status: 200 },
                    { suffix: 'update', status: 200 },
                    { suffix: 'uninstall', status: 204 }
                ];
                for (const obj of it) {
                    yield extra_utils_1.makePostBodyRequest({
                        url: server.url,
                        path: path + obj.suffix,
                        fields: { npmName: npmPlugin },
                        token: server.accessToken,
                        statusCodeExpected: obj.status
                    });
                }
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
