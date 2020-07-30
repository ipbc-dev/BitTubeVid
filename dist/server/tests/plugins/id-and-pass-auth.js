"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const servers_1 = require("../../../shared/extra-utils/server/servers");
const extra_utils_1 = require("../../../shared/extra-utils");
const models_1 = require("@shared/models");
const chai_1 = require("chai");
describe('Test id and pass auth plugins', function () {
    let server;
    let crashAccessToken;
    let crashRefreshToken;
    let lagunaAccessToken;
    let lagunaRefreshToken;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            for (const suffix of ['one', 'two', 'three']) {
                yield extra_utils_1.installPlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    path: extra_utils_1.getPluginTestPath('-id-pass-auth-' + suffix)
                });
            }
        });
    });
    it('Should display the correct configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const auths = config.plugin.registeredIdAndPassAuths;
            chai_1.expect(auths).to.have.lengthOf(8);
            const crashAuth = auths.find(a => a.authName === 'crash-auth');
            chai_1.expect(crashAuth).to.exist;
            chai_1.expect(crashAuth.npmName).to.equal('peertube-plugin-test-id-pass-auth-one');
            chai_1.expect(crashAuth.weight).to.equal(50);
        });
    });
    it('Should not login', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.userLogin(server, { username: 'toto', password: 'password' }, 400);
        });
    });
    it('Should login Spyro, create the user and use the token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const accessToken = yield extra_utils_1.userLogin(server, { username: 'spyro', password: 'spyro password' });
            const res = yield extra_utils_1.getMyUserInformation(server.url, accessToken);
            const body = res.body;
            chai_1.expect(body.username).to.equal('spyro');
            chai_1.expect(body.account.displayName).to.equal('Spyro the Dragon');
            chai_1.expect(body.role).to.equal(models_1.UserRole.USER);
        });
    });
    it('Should login Crash, create the user and use the token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield extra_utils_1.login(server.url, server.client, { username: 'crash', password: 'crash password' });
                crashAccessToken = res.body.access_token;
                crashRefreshToken = res.body.refresh_token;
            }
            {
                const res = yield extra_utils_1.getMyUserInformation(server.url, crashAccessToken);
                const body = res.body;
                chai_1.expect(body.username).to.equal('crash');
                chai_1.expect(body.account.displayName).to.equal('Crash Bandicoot');
                chai_1.expect(body.role).to.equal(models_1.UserRole.MODERATOR);
            }
        });
    });
    it('Should login the first Laguna, create the user and use the token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield extra_utils_1.login(server.url, server.client, { username: 'laguna', password: 'laguna password' });
                lagunaAccessToken = res.body.access_token;
                lagunaRefreshToken = res.body.refresh_token;
            }
            {
                const res = yield extra_utils_1.getMyUserInformation(server.url, lagunaAccessToken);
                const body = res.body;
                chai_1.expect(body.username).to.equal('laguna');
                chai_1.expect(body.account.displayName).to.equal('laguna');
                chai_1.expect(body.role).to.equal(models_1.UserRole.USER);
            }
        });
    });
    it('Should refresh crash token, but not laguna token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const resRefresh = yield extra_utils_1.refreshToken(server, crashRefreshToken);
                crashAccessToken = resRefresh.body.access_token;
                crashRefreshToken = resRefresh.body.refresh_token;
                const res = yield extra_utils_1.getMyUserInformation(server.url, crashAccessToken);
                const user = res.body;
                chai_1.expect(user.username).to.equal('crash');
            }
            {
                yield extra_utils_1.refreshToken(server, lagunaRefreshToken, 400);
            }
        });
    });
    it('Should update Crash profile', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateMyUser({
                url: server.url,
                accessToken: crashAccessToken,
                displayName: 'Beautiful Crash',
                description: 'Mutant eastern barred bandicoot'
            });
            const res = yield extra_utils_1.getMyUserInformation(server.url, crashAccessToken);
            const body = res.body;
            chai_1.expect(body.account.displayName).to.equal('Beautiful Crash');
            chai_1.expect(body.account.description).to.equal('Mutant eastern barred bandicoot');
        });
    });
    it('Should logout Crash', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.logout(server.url, crashAccessToken);
        });
    });
    it('Should have logged out Crash', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.waitUntilLog(server, 'On logout for auth 1 - 2');
            yield extra_utils_1.getMyUserInformation(server.url, crashAccessToken, 401);
        });
    });
    it('Should login Crash and keep the old existing profile', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            crashAccessToken = yield extra_utils_1.userLogin(server, { username: 'crash', password: 'crash password' });
            const res = yield extra_utils_1.getMyUserInformation(server.url, crashAccessToken);
            const body = res.body;
            chai_1.expect(body.username).to.equal('crash');
            chai_1.expect(body.account.displayName).to.equal('Beautiful Crash');
            chai_1.expect(body.account.description).to.equal('Mutant eastern barred bandicoot');
            chai_1.expect(body.role).to.equal(models_1.UserRole.MODERATOR);
        });
    });
    it('Should reject token of laguna by the plugin hook', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.wait(5000);
            yield extra_utils_1.getMyUserInformation(server.url, lagunaAccessToken, 401);
        });
    });
    it('Should reject an invalid username, email, role or display name', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.userLogin(server, { username: 'ward', password: 'ward password' }, 400);
            yield servers_1.waitUntilLog(server, 'valid username');
            yield extra_utils_1.userLogin(server, { username: 'kiros', password: 'kiros password' }, 400);
            yield servers_1.waitUntilLog(server, 'valid display name');
            yield extra_utils_1.userLogin(server, { username: 'raine', password: 'raine password' }, 400);
            yield servers_1.waitUntilLog(server, 'valid role');
            yield extra_utils_1.userLogin(server, { username: 'ellone', password: 'elonne password' }, 400);
            yield servers_1.waitUntilLog(server, 'valid email');
        });
    });
    it('Should unregister spyro-auth and do not login existing Spyro', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updatePluginSettings({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-test-id-pass-auth-one',
                settings: { disableSpyro: true }
            });
            yield extra_utils_1.userLogin(server, { username: 'spyro', password: 'spyro password' }, 400);
            yield extra_utils_1.userLogin(server, { username: 'spyro', password: 'fake' }, 400);
        });
    });
    it('Should have disabled this auth', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const auths = config.plugin.registeredIdAndPassAuths;
            chai_1.expect(auths).to.have.lengthOf(7);
            const spyroAuth = auths.find(a => a.authName === 'spyro-auth');
            chai_1.expect(spyroAuth).to.not.exist;
        });
    });
    it('Should uninstall the plugin one and do not login existing Crash', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-test-id-pass-auth-one'
            });
            yield extra_utils_1.userLogin(server, { username: 'crash', password: 'crash password' }, 400);
        });
    });
    it('Should display the correct configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const auths = config.plugin.registeredIdAndPassAuths;
            chai_1.expect(auths).to.have.lengthOf(6);
            const crashAuth = auths.find(a => a.authName === 'crash-auth');
            chai_1.expect(crashAuth).to.not.exist;
        });
    });
    it('Should display plugin auth information in users list', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getUsersList(server.url, server.accessToken);
            const users = res.body.data;
            const root = users.find(u => u.username === 'root');
            const crash = users.find(u => u.username === 'crash');
            const laguna = users.find(u => u.username === 'laguna');
            chai_1.expect(root.pluginAuth).to.be.null;
            chai_1.expect(crash.pluginAuth).to.equal('peertube-plugin-test-id-pass-auth-one');
            chai_1.expect(laguna.pluginAuth).to.equal('peertube-plugin-test-id-pass-auth-two');
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
