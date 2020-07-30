"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
const chai_1 = require("chai");
function postCommand(server, command, bodyArg) {
    const body = { command };
    if (bodyArg)
        Object.assign(body, bodyArg);
    return extra_utils_1.makePostBodyRequest({
        url: server.url,
        path: '/plugins/test-four/router/commander',
        fields: body,
        statusCodeExpected: 204
    });
}
describe('Test plugin helpers', function () {
    let servers;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield servers_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.installPlugin({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                path: extra_utils_1.getPluginTestPath('-four')
            });
        });
    });
    describe('Logger', function () {
        it('Should have logged things', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield servers_1.waitUntilLog(servers[0], 'localhost:' + servers[0].port + ' peertube-plugin-test-four', 1, false);
                yield servers_1.waitUntilLog(servers[0], 'Hello world from plugin four', 1);
            });
        });
    });
    describe('Database', function () {
        it('Should have made a query', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield servers_1.waitUntilLog(servers[0], `root email is admin${servers[0].internalServerNumber}@example.com`);
            });
        });
    });
    describe('Config', function () {
        it('Should have the correct webserver url', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield servers_1.waitUntilLog(servers[0], `server url is http://localhost:${servers[0].port}`);
            });
        });
    });
    describe('Server', function () {
        it('Should get the server actor', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield servers_1.waitUntilLog(servers[0], 'server actor name is peertube');
            });
        });
    });
    describe('Moderation', function () {
        let videoUUIDServer1;
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                {
                    const res = yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video server 1' });
                    videoUUIDServer1 = res.uuid;
                }
                {
                    yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video server 2' });
                }
                yield extra_utils_1.waitJobs(servers);
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const videos = res.body.data;
                chai_1.expect(videos).to.have.lengthOf(2);
            });
        });
        it('Should mute server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield postCommand(servers[0], 'blockServer', { hostToBlock: `localhost:${servers[1].port}` });
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const videos = res.body.data;
                chai_1.expect(videos).to.have.lengthOf(1);
                chai_1.expect(videos[0].name).to.equal('video server 1');
            });
        });
        it('Should unmute server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield postCommand(servers[0], 'unblockServer', { hostToUnblock: `localhost:${servers[1].port}` });
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const videos = res.body.data;
                chai_1.expect(videos).to.have.lengthOf(2);
            });
        });
        it('Should mute account of server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield postCommand(servers[0], 'blockAccount', { handleToBlock: `root@localhost:${servers[1].port}` });
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const videos = res.body.data;
                chai_1.expect(videos).to.have.lengthOf(1);
                chai_1.expect(videos[0].name).to.equal('video server 1');
            });
        });
        it('Should unmute account of server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield postCommand(servers[0], 'unblockAccount', { handleToUnblock: `root@localhost:${servers[1].port}` });
                const res = yield extra_utils_1.getVideosList(servers[0].url);
                const videos = res.body.data;
                chai_1.expect(videos).to.have.lengthOf(2);
            });
        });
        it('Should blacklist video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield postCommand(servers[0], 'blacklist', { videoUUID: videoUUIDServer1, unfederate: true });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    chai_1.expect(videos).to.have.lengthOf(1);
                    chai_1.expect(videos[0].name).to.equal('video server 2');
                }
            });
        });
        it('Should unblacklist video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield postCommand(servers[0], 'unblacklist', { videoUUID: videoUUIDServer1 });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const videos = res.body.data;
                    chai_1.expect(videos).to.have.lengthOf(2);
                }
            });
        });
    });
    describe('Videos', function () {
        let videoUUID;
        before(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video1' });
            videoUUID = res.uuid;
        }));
        it('Should remove a video after a view', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield extra_utils_1.getVideo(servers[0].url, videoUUID);
                yield extra_utils_1.viewVideo(servers[0].url, videoUUID);
                yield servers_1.waitUntilLog(servers[0], 'Video deleted by plugin four.');
                try {
                    yield extra_utils_1.getVideo(servers[0].url, videoUUID);
                    throw new Error('Video exists');
                }
                catch (err) {
                    if (err.message.includes('exists'))
                        throw err;
                }
                yield extra_utils_1.checkVideoFilesWereRemoved(videoUUID, servers[0].internalServerNumber);
            });
        });
        it('Should have fetched the video by URL', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield servers_1.waitUntilLog(servers[0], `video from DB uuid is ${videoUUID}`);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests(servers);
        });
    });
});
