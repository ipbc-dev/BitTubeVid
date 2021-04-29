"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const redundancy_1 = require("@shared/extra-utils/server/redundancy");
const extra_utils_1 = require("../../../../shared/extra-utils");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test redundancy constraints', function () {
    let remoteServer;
    let localServer;
    let servers;
    const remoteServerConfig = {
        redundancy: {
            videos: {
                check_interval: '1 second',
                strategies: [
                    {
                        strategy: 'recently-added',
                        min_lifetime: '1 hour',
                        size: '100MB',
                        min_views: 0
                    }
                ]
            }
        }
    };
    function uploadWrapper(videoName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.uploadVideo(localServer.url, localServer.accessToken, { name: 'to transcode', privacy: 3 });
            yield jobs_1.waitJobs([localServer]);
            yield extra_utils_1.updateVideo(localServer.url, localServer.accessToken, res.body.video.id, { name: videoName, privacy: 1 });
        });
    }
    function getTotalRedundanciesLocalServer() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield redundancy_1.listVideoRedundancies({
                url: localServer.url,
                accessToken: localServer.accessToken,
                target: 'my-videos'
            });
            return res.body.total;
        });
    }
    function getTotalRedundanciesRemoteServer() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield redundancy_1.listVideoRedundancies({
                url: remoteServer.url,
                accessToken: remoteServer.accessToken,
                target: 'remote-videos'
            });
            return res.body.total;
        });
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            {
                remoteServer = yield extra_utils_1.flushAndRunServer(1, remoteServerConfig);
            }
            {
                const config = {
                    remote_redundancy: {
                        videos: {
                            accept_from: 'nobody'
                        }
                    }
                };
                localServer = yield extra_utils_1.flushAndRunServer(2, config);
            }
            servers = [remoteServer, localServer];
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.uploadVideo(localServer.url, localServer.accessToken, { name: 'video 1 server 2' });
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.follow(remoteServer.url, [localServer.url], remoteServer.accessToken);
            yield jobs_1.waitJobs(servers);
            yield redundancy_1.updateRedundancy(remoteServer.url, remoteServer.accessToken, localServer.host, true);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have redundancy on server 1 but not on server 2 with a nobody filter', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.waitUntilLog(remoteServer, 'Duplicated ', 5);
            yield jobs_1.waitJobs(servers);
            {
                const total = yield getTotalRedundanciesRemoteServer();
                expect(total).to.equal(1);
            }
            {
                const total = yield getTotalRedundanciesLocalServer();
                expect(total).to.equal(0);
            }
        });
    });
    it('Should have redundancy on server 1 and on server 2 with an anybody filter', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const config = {
                remote_redundancy: {
                    videos: {
                        accept_from: 'anybody'
                    }
                }
            };
            yield extra_utils_1.killallServers([localServer]);
            yield extra_utils_1.reRunServer(localServer, config);
            yield uploadWrapper('video 2 server 2');
            yield extra_utils_1.waitUntilLog(remoteServer, 'Duplicated ', 10);
            yield jobs_1.waitJobs(servers);
            {
                const total = yield getTotalRedundanciesRemoteServer();
                expect(total).to.equal(2);
            }
            {
                const total = yield getTotalRedundanciesLocalServer();
                expect(total).to.equal(1);
            }
        });
    });
    it('Should have redundancy on server 1 but not on server 2 with a followings filter', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const config = {
                remote_redundancy: {
                    videos: {
                        accept_from: 'followings'
                    }
                }
            };
            yield extra_utils_1.killallServers([localServer]);
            yield extra_utils_1.reRunServer(localServer, config);
            yield uploadWrapper('video 3 server 2');
            yield extra_utils_1.waitUntilLog(remoteServer, 'Duplicated ', 15);
            yield jobs_1.waitJobs(servers);
            {
                const total = yield getTotalRedundanciesRemoteServer();
                expect(total).to.equal(3);
            }
            {
                const total = yield getTotalRedundanciesLocalServer();
                expect(total).to.equal(1);
            }
        });
    });
    it('Should have redundancy on server 1 and on server 2 with followings filter now server 2 follows server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            yield extra_utils_1.follow(localServer.url, [remoteServer.url], localServer.accessToken);
            yield jobs_1.waitJobs(servers);
            yield uploadWrapper('video 4 server 2');
            yield extra_utils_1.waitUntilLog(remoteServer, 'Duplicated ', 20);
            yield jobs_1.waitJobs(servers);
            {
                const total = yield getTotalRedundanciesRemoteServer();
                expect(total).to.equal(4);
            }
            {
                const total = yield getTotalRedundanciesLocalServer();
                expect(total).to.equal(2);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
