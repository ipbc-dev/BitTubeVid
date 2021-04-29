"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai_1 = require("chai");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
describe('Official plugin auth-ldap', function () {
    let server;
    let accessToken;
    let userId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-auth-ldap'
            });
        });
    });
    it('Should not login with without LDAP settings', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.userLogin(server, { username: 'fry', password: 'fry' }, 400);
        });
    });
    it('Should not login with bad LDAP settings', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updatePluginSettings({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-auth-ldap',
                settings: {
                    'bind-credentials': 'GoodNewsEveryone',
                    'bind-dn': 'cn=admin,dc=planetexpress,dc=com',
                    'insecure-tls': false,
                    'mail-property': 'mail',
                    'search-base': 'ou=people,dc=planetexpress,dc=com',
                    'search-filter': '(|(mail={{username}})(uid={{username}}))',
                    'url': 'ldap://localhost:390',
                    'username-property': 'uid'
                }
            });
            yield extra_utils_1.userLogin(server, { username: 'fry', password: 'fry' }, 400);
        });
    });
    it('Should not login with good LDAP settings but wrong username/password', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updatePluginSettings({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-auth-ldap',
                settings: {
                    'bind-credentials': 'GoodNewsEveryone',
                    'bind-dn': 'cn=admin,dc=planetexpress,dc=com',
                    'insecure-tls': false,
                    'mail-property': 'mail',
                    'search-base': 'ou=people,dc=planetexpress,dc=com',
                    'search-filter': '(|(mail={{username}})(uid={{username}}))',
                    'url': 'ldap://localhost:10389',
                    'username-property': 'uid'
                }
            });
            yield extra_utils_1.userLogin(server, { username: 'fry', password: 'bad password' }, 400);
            yield extra_utils_1.userLogin(server, { username: 'fryr', password: 'fry' }, 400);
        });
    });
    it('Should login with the appropriate username/password', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            accessToken = yield extra_utils_1.userLogin(server, { username: 'fry', password: 'fry' });
        });
    });
    it('Should login with the appropriate email/password', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            accessToken = yield extra_utils_1.userLogin(server, { username: 'fry@planetexpress.com', password: 'fry' });
        });
    });
    it('Should login get my profile', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getMyUserInformation(server.url, accessToken);
            const body = res.body;
            chai_1.expect(body.username).to.equal('fry');
            chai_1.expect(body.email).to.equal('fry@planetexpress.com');
            userId = body.id;
        });
    });
    it('Should upload a video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uploadVideo(server.url, accessToken, { name: 'my super video' });
        });
    });
    it('Should not be able to login if the user is banned', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.blockUser(server.url, userId, server.accessToken);
            yield extra_utils_1.userLogin(server, { username: 'fry@planetexpress.com', password: 'fry' }, 400);
        });
    });
    it('Should be able to login if the user is unbanned', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.unblockUser(server.url, userId, server.accessToken);
            yield extra_utils_1.userLogin(server, { username: 'fry@planetexpress.com', password: 'fry' });
        });
    });
    it('Should not login if the plugin is uninstalled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({ url: server.url, accessToken: server.accessToken, npmName: 'peertube-plugin-auth-ldap' });
            yield extra_utils_1.userLogin(server, { username: 'fry@planetexpress.com', password: 'fry' }, 400);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
