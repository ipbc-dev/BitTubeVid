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
require("mocha");
const chai_1 = require("chai");
const blocklist_1 = require("@shared/extra-utils/users/blocklist");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
describe('Official plugin auto-mute', function () {
    const autoMuteListPath = '/plugins/auto-mute/router/api/v1/mute-list';
    let servers;
    let blocklistServer;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield servers_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            for (const server of servers) {
                yield extra_utils_1.installPlugin({
                    url: server.url,
                    accessToken: server.accessToken,
                    npmName: 'peertube-plugin-auto-mute'
                });
            }
            blocklistServer = new extra_utils_1.MockBlocklist();
            yield blocklistServer.initialize();
            yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video server 1' });
            yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video server 2' });
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should update plugin settings', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updatePluginSettings({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                npmName: 'peertube-plugin-auto-mute',
                settings: {
                    'blocklist-urls': 'http://localhost:42100/blocklist',
                    'check-seconds-interval': 1
                }
            });
        });
    });
    it('Should add a server blocklist', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            blocklistServer.replace({
                data: [
                    {
                        value: 'localhost:' + servers[1].port
                    }
                ]
            });
            yield extra_utils_1.wait(2000);
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            chai_1.expect(res.body.total).to.equal(1);
        });
    });
    it('Should remove a server blocklist', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            blocklistServer.replace({
                data: [
                    {
                        value: 'localhost:' + servers[1].port,
                        action: 'remove'
                    }
                ]
            });
            yield extra_utils_1.wait(2000);
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            chai_1.expect(res.body.total).to.equal(2);
        });
    });
    it('Should add an account blocklist', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            blocklistServer.replace({
                data: [
                    {
                        value: 'root@localhost:' + servers[1].port
                    }
                ]
            });
            yield extra_utils_1.wait(2000);
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            chai_1.expect(res.body.total).to.equal(1);
        });
    });
    it('Should remove an account blocklist', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            blocklistServer.replace({
                data: [
                    {
                        value: 'root@localhost:' + servers[1].port,
                        action: 'remove'
                    }
                ]
            });
            yield extra_utils_1.wait(2000);
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            chai_1.expect(res.body.total).to.equal(2);
        });
    });
    it('Should auto mute an account, manually unmute it and do not remute it automatically', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            const account = 'root@localhost:' + servers[1].port;
            blocklistServer.replace({
                data: [
                    {
                        value: account,
                        updatedAt: new Date().toISOString()
                    }
                ]
            });
            yield extra_utils_1.wait(2000);
            {
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                chai_1.expect(res.body.total).to.equal(1);
            }
            yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, account);
            {
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                chai_1.expect(res.body.total).to.equal(2);
            }
            servers_1.killallServers([servers[0]]);
            yield servers_1.reRunServer(servers[0]);
            yield extra_utils_1.wait(2000);
            {
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                chai_1.expect(res.body.total).to.equal(2);
            }
        });
    });
    it('Should not expose the auto mute list', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.makeGetRequest({
                url: servers[0].url,
                path: '/plugins/auto-mute/router/api/v1/mute-list',
                statusCodeExpected: 403
            });
        });
    });
    it('Should enable auto mute list', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updatePluginSettings({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                npmName: 'peertube-plugin-auto-mute',
                settings: {
                    'blocklist-urls': '',
                    'check-seconds-interval': 1,
                    'expose-mute-list': true
                }
            });
            yield extra_utils_1.makeGetRequest({
                url: servers[0].url,
                path: '/plugins/auto-mute/router/api/v1/mute-list',
                statusCodeExpected: 200
            });
        });
    });
    it('Should mute an account on server 1, and server 2 auto mutes it', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.updatePluginSettings({
                url: servers[1].url,
                accessToken: servers[1].accessToken,
                npmName: 'peertube-plugin-auto-mute',
                settings: {
                    'blocklist-urls': 'http://localhost:' + servers[0].port + autoMuteListPath,
                    'check-seconds-interval': 1,
                    'expose-mute-list': false
                }
            });
            yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, 'root@localhost:' + servers[1].port);
            yield blocklist_1.addServerToAccountBlocklist(servers[0].url, servers[0].accessToken, 'localhost:' + servers[1].port);
            const res = yield extra_utils_1.makeGetRequest({
                url: servers[0].url,
                path: '/plugins/auto-mute/router/api/v1/mute-list',
                statusCodeExpected: 200
            });
            const data = res.body.data;
            chai_1.expect(data).to.have.lengthOf(1);
            chai_1.expect(data[0].updatedAt).to.exist;
            chai_1.expect(data[0].value).to.equal('root@localhost:' + servers[1].port);
            yield extra_utils_1.wait(2000);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                chai_1.expect(res.body.total).to.equal(1);
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests(servers);
        });
    });
});
