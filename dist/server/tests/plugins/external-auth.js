"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai_1 = require("chai");
const models_1 = require("@shared/models");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function loginExternal(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield extra_utils_1.getExternalAuth({
            url: options.server.url,
            npmName: options.npmName,
            npmVersion: '0.0.1',
            authName: options.authName,
            query: options.query,
            statusCodeExpected: options.statusCodeExpected || http_error_codes_1.HttpStatusCode.FOUND_302
        });
        if (res.status !== http_error_codes_1.HttpStatusCode.FOUND_302)
            return;
        const location = res.header.location;
        const { externalAuthToken } = extra_utils_1.decodeQueryString(location);
        const resLogin = yield extra_utils_1.loginUsingExternalToken(options.server, options.username, externalAuthToken, options.statusCodeExpectedStep2);
        return resLogin.body;
    });
}
describe('Test external auth plugins', function () {
    let server;
    let cyanAccessToken;
    let cyanRefreshToken;
    let kefkaAccessToken;
    let kefkaRefreshToken;
    let externalAuthToken;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            for (const suffix of ['one', 'two', 'three']) {
                yield extra_utils_1.installPlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    path: extra_utils_1.getPluginTestPath('-external-auth-' + suffix)
                });
            }
        });
    });
    it('Should display the correct configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const auths = config.plugin.registeredExternalAuths;
            chai_1.expect(auths).to.have.lengthOf(8);
            const auth2 = auths.find((a) => a.authName === 'external-auth-2');
            chai_1.expect(auth2).to.exist;
            chai_1.expect(auth2.authDisplayName).to.equal('External Auth 2');
            chai_1.expect(auth2.npmName).to.equal('peertube-plugin-test-external-auth-one');
        });
    });
    it('Should redirect for a Cyan login', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getExternalAuth({
                url: server.url,
                npmName: 'test-external-auth-one',
                npmVersion: '0.0.1',
                authName: 'external-auth-1',
                query: {
                    username: 'cyan'
                },
                statusCodeExpected: http_error_codes_1.HttpStatusCode.FOUND_302
            });
            const location = res.header.location;
            chai_1.expect(location.startsWith('/login?')).to.be.true;
            const searchParams = extra_utils_1.decodeQueryString(location);
            chai_1.expect(searchParams.externalAuthToken).to.exist;
            chai_1.expect(searchParams.username).to.equal('cyan');
            externalAuthToken = searchParams.externalAuthToken;
        });
    });
    it('Should reject auto external login with a missing or invalid token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.loginUsingExternalToken(server, 'cyan', '', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            yield extra_utils_1.loginUsingExternalToken(server, 'cyan', 'blabla', http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
        });
    });
    it('Should reject auto external login with a missing or invalid username', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.loginUsingExternalToken(server, '', externalAuthToken, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            yield extra_utils_1.loginUsingExternalToken(server, '', externalAuthToken, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
        });
    });
    it('Should reject auto external login with an expired token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            yield extra_utils_1.wait(5000);
            yield extra_utils_1.loginUsingExternalToken(server, 'cyan', externalAuthToken, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            yield servers_1.waitUntilLog(server, 'expired external auth token');
        });
    });
    it('Should auto login Cyan, create the user and use the token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield loginExternal({
                    server,
                    npmName: 'test-external-auth-one',
                    authName: 'external-auth-1',
                    query: {
                        username: 'cyan'
                    },
                    username: 'cyan'
                });
                cyanAccessToken = res.access_token;
                cyanRefreshToken = res.refresh_token;
            }
            {
                const res = yield extra_utils_1.getMyUserInformation(server.url, cyanAccessToken);
                const body = res.body;
                chai_1.expect(body.username).to.equal('cyan');
                chai_1.expect(body.account.displayName).to.equal('cyan');
                chai_1.expect(body.email).to.equal('cyan@example.com');
                chai_1.expect(body.role).to.equal(models_1.UserRole.USER);
            }
        });
    });
    it('Should auto login Kefka, create the user and use the token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield loginExternal({
                    server,
                    npmName: 'test-external-auth-one',
                    authName: 'external-auth-2',
                    username: 'kefka'
                });
                kefkaAccessToken = res.access_token;
                kefkaRefreshToken = res.refresh_token;
            }
            {
                const res = yield extra_utils_1.getMyUserInformation(server.url, kefkaAccessToken);
                const body = res.body;
                chai_1.expect(body.username).to.equal('kefka');
                chai_1.expect(body.account.displayName).to.equal('Kefka Palazzo');
                chai_1.expect(body.email).to.equal('kefka@example.com');
                chai_1.expect(body.role).to.equal(models_1.UserRole.ADMINISTRATOR);
            }
        });
    });
    it('Should refresh Cyan token, but not Kefka token', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const resRefresh = yield extra_utils_1.refreshToken(server, cyanRefreshToken);
                cyanAccessToken = resRefresh.body.access_token;
                cyanRefreshToken = resRefresh.body.refresh_token;
                const res = yield extra_utils_1.getMyUserInformation(server.url, cyanAccessToken);
                const user = res.body;
                chai_1.expect(user.username).to.equal('cyan');
            }
            {
                yield extra_utils_1.refreshToken(server, kefkaRefreshToken, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            }
        });
    });
    it('Should update Cyan profile', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateMyUser({
                url: server.url,
                accessToken: cyanAccessToken,
                displayName: 'Cyan Garamonde',
                description: 'Retainer to the king of Doma'
            });
            const res = yield extra_utils_1.getMyUserInformation(server.url, cyanAccessToken);
            const body = res.body;
            chai_1.expect(body.account.displayName).to.equal('Cyan Garamonde');
            chai_1.expect(body.account.description).to.equal('Retainer to the king of Doma');
        });
    });
    it('Should logout Cyan', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.logout(server.url, cyanAccessToken);
        });
    });
    it('Should have logged out Cyan', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.waitUntilLog(server, 'On logout cyan');
            yield extra_utils_1.getMyUserInformation(server.url, cyanAccessToken, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
        });
    });
    it('Should login Cyan and keep the old existing profile', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield loginExternal({
                    server,
                    npmName: 'test-external-auth-one',
                    authName: 'external-auth-1',
                    query: {
                        username: 'cyan'
                    },
                    username: 'cyan'
                });
                cyanAccessToken = res.access_token;
            }
            const res = yield extra_utils_1.getMyUserInformation(server.url, cyanAccessToken);
            const body = res.body;
            chai_1.expect(body.username).to.equal('cyan');
            chai_1.expect(body.account.displayName).to.equal('Cyan Garamonde');
            chai_1.expect(body.account.description).to.equal('Retainer to the king of Doma');
            chai_1.expect(body.role).to.equal(models_1.UserRole.USER);
        });
    });
    it('Should not update an external auth email', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateMyUser({
                url: server.url,
                accessToken: cyanAccessToken,
                email: 'toto@example.com',
                currentPassword: 'toto',
                statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
            });
        });
    });
    it('Should reject token of Kefka by the plugin hook', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.wait(5000);
            yield extra_utils_1.getMyUserInformation(server.url, kefkaAccessToken, http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
        });
    });
    it('Should unregister external-auth-2 and do not login existing Kefka', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updatePluginSettings({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-test-external-auth-one',
                settings: { disableKefka: true }
            });
            yield extra_utils_1.userLogin(server, { username: 'kefka', password: 'fake' }, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            yield loginExternal({
                server,
                npmName: 'test-external-auth-one',
                authName: 'external-auth-2',
                query: {
                    username: 'kefka'
                },
                username: 'kefka',
                statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
            });
        });
    });
    it('Should have disabled this auth', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const auths = config.plugin.registeredExternalAuths;
            chai_1.expect(auths).to.have.lengthOf(7);
            const auth1 = auths.find(a => a.authName === 'external-auth-2');
            chai_1.expect(auth1).to.not.exist;
        });
    });
    it('Should uninstall the plugin one and do not login Cyan', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-test-external-auth-one'
            });
            yield loginExternal({
                server,
                npmName: 'test-external-auth-one',
                authName: 'external-auth-1',
                query: {
                    username: 'cyan'
                },
                username: 'cyan',
                statusCodeExpected: http_error_codes_1.HttpStatusCode.NOT_FOUND_404
            });
            yield extra_utils_1.userLogin(server, { username: 'cyan', password: null }, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            yield extra_utils_1.userLogin(server, { username: 'cyan', password: '' }, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
            yield extra_utils_1.userLogin(server, { username: 'cyan', password: 'fake' }, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400);
        });
    });
    it('Should not login kefka with another plugin', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield loginExternal({
                server,
                npmName: 'test-external-auth-two',
                authName: 'external-auth-4',
                username: 'kefka2',
                statusCodeExpectedStep2: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
            });
            yield loginExternal({
                server,
                npmName: 'test-external-auth-two',
                authName: 'external-auth-4',
                username: 'kefka',
                statusCodeExpectedStep2: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
            });
        });
    });
    it('Should not login an existing user', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.createUser({
                url: server.url,
                accessToken: server.accessToken,
                username: 'existing_user',
                password: 'super_password'
            });
            yield loginExternal({
                server,
                npmName: 'test-external-auth-two',
                authName: 'external-auth-6',
                username: 'existing_user',
                statusCodeExpectedStep2: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
            });
        });
    });
    it('Should display the correct configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const auths = config.plugin.registeredExternalAuths;
            chai_1.expect(auths).to.have.lengthOf(6);
            const auth2 = auths.find((a) => a.authName === 'external-auth-2');
            chai_1.expect(auth2).to.not.exist;
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
    it('Should forward the redirectUrl if the plugin returns one', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const resLogin = yield loginExternal({
                server,
                npmName: 'test-external-auth-three',
                authName: 'external-auth-7',
                username: 'cid'
            });
            const resLogout = yield extra_utils_1.logout(server.url, resLogin.access_token);
            chai_1.expect(resLogout.body.redirectUrl).to.equal('https://example.com/redirectUrl');
        });
    });
    it('Should call the plugin\'s onLogout method with the request', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const resLogin = yield loginExternal({
                server,
                npmName: 'test-external-auth-three',
                authName: 'external-auth-8',
                username: 'cid'
            });
            const resLogout = yield extra_utils_1.logout(server.url, resLogin.access_token);
            chai_1.expect(resLogout.body.redirectUrl).to.equal('https://example.com/redirectUrl?access_token=' + resLogin.access_token);
        });
    });
});
