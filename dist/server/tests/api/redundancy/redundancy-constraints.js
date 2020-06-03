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
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const redundancy_1 = require("@shared/extra-utils/server/redundancy");
const expect = chai.expect;
describe('Test redundancy constraints', function () {
    let remoteServer;
    let localServer;
    let servers;
    function getTotalRedundanciesLocalServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield redundancy_1.listVideoRedundancies({
                url: localServer.url,
                accessToken: localServer.accessToken,
                target: 'my-videos'
            });
            return res.body.total;
        });
    }
    function getTotalRedundanciesRemoteServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield redundancy_1.listVideoRedundancies({
                url: remoteServer.url,
                accessToken: remoteServer.accessToken,
                target: 'remote-videos'
            });
            return res.body.total;
        });
    }
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            {
                const config = {
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
                remoteServer = yield extra_utils_1.flushAndRunServer(1, config);
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
            yield extra_utils_1.uploadVideo(localServer.url, localServer.accessToken, { name: 'video 2 server 2' });
            yield jobs_1.waitJobs(servers);
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
        return __awaiter(this, void 0, void 0, function* () {
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
            yield extra_utils_1.uploadVideo(localServer.url, localServer.accessToken, { name: 'video 3 server 2' });
            yield jobs_1.waitJobs(servers);
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
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            yield extra_utils_1.follow(localServer.url, [remoteServer.url], localServer.accessToken);
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.uploadVideo(localServer.url, localServer.accessToken, { name: 'video 4 server 2' });
            yield jobs_1.waitJobs(servers);
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
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
