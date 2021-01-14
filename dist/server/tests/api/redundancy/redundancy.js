"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const magnetUtil = require("magnet-uri");
const redundancy_1 = require("../../../../shared/extra-utils/server/redundancy");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const stats_1 = require("../../../../shared/extra-utils/server/stats");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
let servers = [];
let video1Server2UUID;
let video1Server2Id;
function checkMagnetWebseeds(file, baseWebseeds, server) {
    const parsed = magnetUtil.decode(file.magnetUri);
    for (const ws of baseWebseeds) {
        const found = parsed.urlList.find(url => url === `${ws}-${file.resolution.id}.mp4`);
        expect(found, `Webseed ${ws} not found in ${file.magnetUri} on server ${server.url}`).to.not.be.undefined;
    }
    expect(parsed.urlList).to.have.lengthOf(baseWebseeds.length);
}
function flushAndRunServers(strategy, additionalParams = {}) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const strategies = [];
        if (strategy !== null) {
            strategies.push(extra_utils_1.immutableAssign({
                min_lifetime: '1 hour',
                strategy: strategy,
                size: '400KB'
            }, additionalParams));
        }
        const config = {
            transcoding: {
                hls: {
                    enabled: true
                }
            },
            redundancy: {
                videos: {
                    check_interval: '5 seconds',
                    strategies
                }
            }
        };
        servers = yield extra_utils_1.flushAndRunMultipleServers(3, config);
        yield extra_utils_1.setAccessTokensToServers(servers);
        {
            const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video 1 server 2' });
            video1Server2UUID = res.body.video.uuid;
            video1Server2Id = res.body.video.id;
            yield extra_utils_1.viewVideo(servers[1].url, video1Server2UUID);
        }
        yield jobs_1.waitJobs(servers);
        yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        yield extra_utils_1.doubleFollow(servers[0], servers[2]);
        yield extra_utils_1.doubleFollow(servers[1], servers[2]);
        yield jobs_1.waitJobs(servers);
    });
}
function check1WebSeed(videoUUID) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!videoUUID)
            videoUUID = video1Server2UUID;
        const webseeds = [
            `http://localhost:${servers[1].port}/static/webseed/${videoUUID}`
        ];
        for (const server of servers) {
            const res = yield extra_utils_1.getVideoWithToken(server.url, server.accessToken, videoUUID);
            const video = res.body;
            for (const f of video.files) {
                checkMagnetWebseeds(f, webseeds, server);
            }
        }
    });
}
function check2Webseeds(videoUUID) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!videoUUID)
            videoUUID = video1Server2UUID;
        const webseeds = [
            `http://localhost:${servers[0].port}/static/redundancy/${videoUUID}`,
            `http://localhost:${servers[1].port}/static/webseed/${videoUUID}`
        ];
        for (const server of servers) {
            const res = yield extra_utils_1.getVideo(server.url, videoUUID);
            const video = res.body;
            for (const file of video.files) {
                checkMagnetWebseeds(file, webseeds, server);
                yield extra_utils_1.makeGetRequest({
                    url: servers[0].url,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200,
                    path: '/static/redundancy/' + `${videoUUID}-${file.resolution.id}.mp4`,
                    contentType: null
                });
                yield extra_utils_1.makeGetRequest({
                    url: servers[1].url,
                    statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200,
                    path: `/static/webseed/${videoUUID}-${file.resolution.id}.mp4`,
                    contentType: null
                });
            }
        }
        const directories = [
            'test' + servers[0].internalServerNumber + '/redundancy',
            'test' + servers[1].internalServerNumber + '/videos'
        ];
        for (const directory of directories) {
            const files = yield fs_extra_1.readdir(path_1.join(extra_utils_1.root(), directory));
            expect(files).to.have.length.at.least(4);
            for (const resolution of [240, 360, 480, 720]) {
                expect(files.find(f => f === `${videoUUID}-${resolution}.mp4`)).to.not.be.undefined;
            }
        }
    });
}
function check0PlaylistRedundancies(videoUUID) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!videoUUID)
            videoUUID = video1Server2UUID;
        for (const server of servers) {
            const res = yield extra_utils_1.getVideoWithToken(server.url, server.accessToken, videoUUID);
            const video = res.body;
            expect(video.streamingPlaylists).to.be.an('array');
            expect(video.streamingPlaylists).to.have.lengthOf(1);
            expect(video.streamingPlaylists[0].redundancies).to.have.lengthOf(0);
        }
    });
}
function check1PlaylistRedundancies(videoUUID) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!videoUUID)
            videoUUID = video1Server2UUID;
        for (const server of servers) {
            const res = yield extra_utils_1.getVideo(server.url, videoUUID);
            const video = res.body;
            expect(video.streamingPlaylists).to.have.lengthOf(1);
            expect(video.streamingPlaylists[0].redundancies).to.have.lengthOf(1);
            const redundancy = video.streamingPlaylists[0].redundancies[0];
            expect(redundancy.baseUrl).to.equal(servers[0].url + '/static/redundancy/hls/' + videoUUID);
        }
        const baseUrlPlaylist = servers[1].url + '/static/streaming-playlists/hls';
        const baseUrlSegment = servers[0].url + '/static/redundancy/hls';
        const res = yield extra_utils_1.getVideo(servers[0].url, videoUUID);
        const hlsPlaylist = res.body.streamingPlaylists[0];
        for (const resolution of [240, 360, 480, 720]) {
            yield extra_utils_1.checkSegmentHash(baseUrlPlaylist, baseUrlSegment, videoUUID, resolution, hlsPlaylist);
        }
        const directories = [
            'test' + servers[0].internalServerNumber + '/redundancy/hls',
            'test' + servers[1].internalServerNumber + '/streaming-playlists/hls'
        ];
        for (const directory of directories) {
            const files = yield fs_extra_1.readdir(path_1.join(extra_utils_1.root(), directory, videoUUID));
            expect(files).to.have.length.at.least(4);
            for (const resolution of [240, 360, 480, 720]) {
                const filename = `${videoUUID}-${resolution}-fragmented.mp4`;
                expect(files.find(f => f === filename)).to.not.be.undefined;
            }
        }
    });
}
function checkStatsGlobal(strategy) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let totalSize = null;
        let statsLength = 1;
        if (strategy !== 'manual') {
            totalSize = 409600;
            statsLength = 2;
        }
        const res = yield stats_1.getStats(servers[0].url);
        const data = res.body;
        expect(data.videosRedundancy).to.have.lengthOf(statsLength);
        const stat = data.videosRedundancy[0];
        expect(stat.strategy).to.equal(strategy);
        expect(stat.totalSize).to.equal(totalSize);
        return stat;
    });
}
function checkStatsWith2Webseed(strategy) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const stat = yield checkStatsGlobal(strategy);
        expect(stat.totalUsed).to.be.at.least(1).and.below(409601);
        expect(stat.totalVideoFiles).to.equal(4);
        expect(stat.totalVideos).to.equal(1);
    });
}
function checkStatsWith1Webseed(strategy) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const stat = yield checkStatsGlobal(strategy);
        expect(stat.totalUsed).to.equal(0);
        expect(stat.totalVideoFiles).to.equal(0);
        expect(stat.totalVideos).to.equal(0);
    });
}
function enableRedundancyOnServer1() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield redundancy_1.updateRedundancy(servers[0].url, servers[0].accessToken, servers[1].host, true);
        const res = yield extra_utils_1.getFollowingListPaginationAndSort({ url: servers[0].url, start: 0, count: 5, sort: '-createdAt' });
        const follows = res.body.data;
        const server2 = follows.find(f => f.following.host === `localhost:${servers[1].port}`);
        const server3 = follows.find(f => f.following.host === `localhost:${servers[2].port}`);
        expect(server3).to.not.be.undefined;
        expect(server3.following.hostRedundancyAllowed).to.be.false;
        expect(server2).to.not.be.undefined;
        expect(server2.following.hostRedundancyAllowed).to.be.true;
    });
}
function disableRedundancyOnServer1() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield redundancy_1.updateRedundancy(servers[0].url, servers[0].accessToken, servers[1].host, false);
        const res = yield extra_utils_1.getFollowingListPaginationAndSort({ url: servers[0].url, start: 0, count: 5, sort: '-createdAt' });
        const follows = res.body.data;
        const server2 = follows.find(f => f.following.host === `localhost:${servers[1].port}`);
        const server3 = follows.find(f => f.following.host === `localhost:${servers[2].port}`);
        expect(server3).to.not.be.undefined;
        expect(server3.following.hostRedundancyAllowed).to.be.false;
        expect(server2).to.not.be.undefined;
        expect(server2.following.hostRedundancyAllowed).to.be.false;
    });
}
describe('Test videos redundancy', function () {
    describe('With most-views strategy', function () {
        const strategy = 'most-views';
        before(function () {
            this.timeout(120000);
            return flushAndRunServers(strategy);
        });
        it('Should have 1 webseed on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield checkStatsWith1Webseed(strategy);
            });
        });
        it('Should enable redundancy on server 1', function () {
            return enableRedundancyOnServer1();
        });
        it('Should have 2 webseeds on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.waitUntilLog(servers[0], 'Duplicated ', 5);
                yield jobs_1.waitJobs(servers);
                yield check2Webseeds();
                yield check1PlaylistRedundancies();
                yield checkStatsWith2Webseed(strategy);
            });
        });
        it('Should undo redundancy on server 1 and remove duplicated videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield disableRedundancyOnServer1();
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(5000);
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield extra_utils_1.checkVideoFilesWereRemoved(video1Server2UUID, servers[0].internalServerNumber, ['videos', path_1.join('playlists', 'hls')]);
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                return extra_utils_1.cleanupTests(servers);
            });
        });
    });
    describe('With trending strategy', function () {
        const strategy = 'trending';
        before(function () {
            this.timeout(120000);
            return flushAndRunServers(strategy);
        });
        it('Should have 1 webseed on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield checkStatsWith1Webseed(strategy);
            });
        });
        it('Should enable redundancy on server 1', function () {
            return enableRedundancyOnServer1();
        });
        it('Should have 2 webseeds on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.waitUntilLog(servers[0], 'Duplicated ', 5);
                yield jobs_1.waitJobs(servers);
                yield check2Webseeds();
                yield check1PlaylistRedundancies();
                yield checkStatsWith2Webseed(strategy);
            });
        });
        it('Should unfollow on server 1 and remove duplicated videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[1]);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(5000);
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield extra_utils_1.checkVideoFilesWereRemoved(video1Server2UUID, servers[0].internalServerNumber, ['videos']);
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.cleanupTests(servers);
            });
        });
    });
    describe('With recently added strategy', function () {
        const strategy = 'recently-added';
        before(function () {
            this.timeout(120000);
            return flushAndRunServers(strategy, { min_views: 3 });
        });
        it('Should have 1 webseed on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield checkStatsWith1Webseed(strategy);
            });
        });
        it('Should enable redundancy on server 1', function () {
            return enableRedundancyOnServer1();
        });
        it('Should still have 1 webseed on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(15000);
                yield jobs_1.waitJobs(servers);
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield checkStatsWith1Webseed(strategy);
            });
        });
        it('Should view 2 times the first video to have > min_views config', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield extra_utils_1.viewVideo(servers[0].url, video1Server2UUID);
                yield extra_utils_1.viewVideo(servers[2].url, video1Server2UUID);
                yield extra_utils_1.wait(10000);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have 2 webseeds on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.waitUntilLog(servers[0], 'Duplicated ', 5);
                yield jobs_1.waitJobs(servers);
                yield check2Webseeds();
                yield check1PlaylistRedundancies();
                yield checkStatsWith2Webseed(strategy);
            });
        });
        it('Should remove the video and the redundancy files', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield extra_utils_1.removeVideo(servers[1].url, servers[1].accessToken, video1Server2UUID);
                yield jobs_1.waitJobs(servers);
                for (const server of servers) {
                    yield extra_utils_1.checkVideoFilesWereRemoved(video1Server2UUID, server.internalServerNumber);
                }
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.cleanupTests(servers);
            });
        });
    });
    describe('With manual strategy', function () {
        before(function () {
            this.timeout(120000);
            return flushAndRunServers(null);
        });
        it('Should have 1 webseed on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield checkStatsWith1Webseed('manual');
            });
        });
        it('Should create a redundancy on first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield redundancy_1.addVideoRedundancy({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    videoId: video1Server2Id
                });
            });
        });
        it('Should have 2 webseeds on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.waitUntilLog(servers[0], 'Duplicated ', 5);
                yield jobs_1.waitJobs(servers);
                yield check2Webseeds();
                yield check1PlaylistRedundancies();
                yield checkStatsWith2Webseed('manual');
            });
        });
        it('Should manually remove redundancies on server 1 and remove duplicated videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    target: 'remote-videos'
                });
                const videos = res.body.data;
                expect(videos).to.have.lengthOf(1);
                const video = videos[0];
                for (const r of video.redundancies.files.concat(video.redundancies.streamingPlaylists)) {
                    yield redundancy_1.removeVideoRedundancy({
                        url: servers[0].url,
                        accessToken: servers[0].accessToken,
                        redundancyId: r.id
                    });
                }
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(5000);
                yield check1WebSeed();
                yield check0PlaylistRedundancies();
                yield extra_utils_1.checkVideoFilesWereRemoved(video1Server2UUID, servers[0].serverNumber, ['videos']);
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.cleanupTests(servers);
            });
        });
    });
    describe('Test expiration', function () {
        const strategy = 'recently-added';
        function checkContains(servers, str) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideo(server.url, video1Server2UUID);
                    const video = res.body;
                    for (const f of video.files) {
                        expect(f.magnetUri).to.contain(str);
                    }
                }
            });
        }
        function checkNotContains(servers, str) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideo(server.url, video1Server2UUID);
                    const video = res.body;
                    for (const f of video.files) {
                        expect(f.magnetUri).to.not.contain(str);
                    }
                }
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                yield flushAndRunServers(strategy, { min_lifetime: '7 seconds', min_views: 0 });
                yield enableRedundancyOnServer1();
            });
        });
        it('Should still have 2 webseeds after 10 seconds', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield extra_utils_1.wait(10000);
                try {
                    yield checkContains(servers, 'http%3A%2F%2Flocalhost%3A' + servers[0].port);
                }
                catch (_a) {
                    yield extra_utils_1.wait(2000);
                    yield checkContains(servers, 'http%3A%2F%2Flocalhost%3A' + servers[0].port);
                }
            });
        });
        it('Should stop server 1 and expire video redundancy', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                extra_utils_1.killallServers([servers[0]]);
                yield extra_utils_1.wait(15000);
                yield checkNotContains([servers[1], servers[2]], 'http%3A%2F%2Flocalhost%3A' + servers[0].port);
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.cleanupTests(servers);
            });
        });
    });
    describe('Test file replacement', function () {
        let video2Server2UUID;
        const strategy = 'recently-added';
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                yield flushAndRunServers(strategy, { min_lifetime: '7 seconds', min_views: 0 });
                yield enableRedundancyOnServer1();
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.waitUntilLog(servers[0], 'Duplicated ', 5);
                yield jobs_1.waitJobs(servers);
                yield check2Webseeds();
                yield check1PlaylistRedundancies();
                yield checkStatsWith2Webseed(strategy);
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video 2 server 2' });
                video2Server2UUID = res.body.video.uuid;
            });
        });
        it('Should cache video 2 webseeds on the first video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(120000);
                yield jobs_1.waitJobs(servers);
                let checked = false;
                while (checked === false) {
                    yield extra_utils_1.wait(1000);
                    try {
                        yield check1WebSeed(video1Server2UUID);
                        yield check0PlaylistRedundancies(video1Server2UUID);
                        yield check2Webseeds(video2Server2UUID);
                        yield check1PlaylistRedundancies(video2Server2UUID);
                        checked = true;
                    }
                    catch (_a) {
                        checked = false;
                    }
                }
            });
        });
        it('Should disable strategy and remove redundancies', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(80000);
                yield jobs_1.waitJobs(servers);
                extra_utils_1.killallServers([servers[0]]);
                yield extra_utils_1.reRunServer(servers[0], {
                    redundancy: {
                        videos: {
                            check_interval: '1 second',
                            strategies: []
                        }
                    }
                });
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.checkVideoFilesWereRemoved(video1Server2UUID, servers[0].internalServerNumber, [path_1.join('redundancy', 'hls')]);
            });
        });
        after(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.cleanupTests(servers);
            });
        });
    });
});
