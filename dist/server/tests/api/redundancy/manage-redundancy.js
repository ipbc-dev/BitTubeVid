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
const models_1 = require("@shared/models");
const expect = chai.expect;
describe('Test manage videos redundancy', function () {
    const targets = ['my-videos', 'remote-videos'];
    let servers;
    let video1Server2UUID;
    let video2Server2UUID;
    let redundanciesToRemove = [];
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const config = {
                transcoding: {
                    hls: {
                        enabled: true
                    }
                },
                redundancy: {
                    videos: {
                        check_interval: '1 second',
                        strategies: [
                            {
                                strategy: 'recently-added',
                                min_lifetime: '1 hour',
                                size: '10MB',
                                min_views: 0
                            }
                        ]
                    }
                }
            };
            servers = yield extra_utils_1.flushAndRunMultipleServers(3, config);
            yield extra_utils_1.setAccessTokensToServers(servers);
            {
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video 1 server 2' });
                video1Server2UUID = res.body.video.uuid;
            }
            {
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video 2 server 2' });
                video2Server2UUID = res.body.video.uuid;
            }
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield redundancy_1.updateRedundancy(servers[0].url, servers[0].accessToken, servers[1].host, true);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not have redundancies on server 3', function () {
        return __awaiter(this, void 0, void 0, function* () {
            for (const target of targets) {
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[2].url,
                    accessToken: servers[2].accessToken,
                    target
                });
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.have.lengthOf(0);
            }
        });
    });
    it('Should not have "remote-videos" redundancies on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.waitUntilLog(servers[0], 'Duplicated ', 10);
            yield jobs_1.waitJobs(servers);
            const res = yield redundancy_1.listVideoRedundancies({
                url: servers[1].url,
                accessToken: servers[1].accessToken,
                target: 'remote-videos'
            });
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should have "my-videos" redundancies on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const res = yield redundancy_1.listVideoRedundancies({
                url: servers[1].url,
                accessToken: servers[1].accessToken,
                target: 'my-videos'
            });
            expect(res.body.total).to.equal(2);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(2);
            const videos1 = videos.find(v => v.uuid === video1Server2UUID);
            const videos2 = videos.find(v => v.uuid === video2Server2UUID);
            expect(videos1.name).to.equal('video 1 server 2');
            expect(videos2.name).to.equal('video 2 server 2');
            expect(videos1.redundancies.files).to.have.lengthOf(4);
            expect(videos1.redundancies.streamingPlaylists).to.have.lengthOf(1);
            const redundancies = videos1.redundancies.files.concat(videos1.redundancies.streamingPlaylists);
            for (const r of redundancies) {
                expect(r.strategy).to.be.null;
                expect(r.fileUrl).to.exist;
                expect(r.createdAt).to.exist;
                expect(r.updatedAt).to.exist;
                expect(r.expiresOn).to.exist;
            }
        });
    });
    it('Should not have "my-videos" redundancies on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield redundancy_1.listVideoRedundancies({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                target: 'my-videos'
            });
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should have "remote-videos" redundancies on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const res = yield redundancy_1.listVideoRedundancies({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                target: 'remote-videos'
            });
            expect(res.body.total).to.equal(2);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(2);
            const videos1 = videos.find(v => v.uuid === video1Server2UUID);
            const videos2 = videos.find(v => v.uuid === video2Server2UUID);
            expect(videos1.name).to.equal('video 1 server 2');
            expect(videos2.name).to.equal('video 2 server 2');
            expect(videos1.redundancies.files).to.have.lengthOf(4);
            expect(videos1.redundancies.streamingPlaylists).to.have.lengthOf(1);
            const redundancies = videos1.redundancies.files.concat(videos1.redundancies.streamingPlaylists);
            for (const r of redundancies) {
                expect(r.strategy).to.equal('recently-added');
                expect(r.fileUrl).to.exist;
                expect(r.createdAt).to.exist;
                expect(r.updatedAt).to.exist;
                expect(r.expiresOn).to.exist;
            }
        });
    });
    it('Should correctly paginate and sort results', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    target: 'remote-videos',
                    sort: 'name',
                    start: 0,
                    count: 2
                });
                const videos = res.body.data;
                expect(videos[0].name).to.equal('video 1 server 2');
                expect(videos[1].name).to.equal('video 2 server 2');
            }
            {
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    target: 'remote-videos',
                    sort: '-name',
                    start: 0,
                    count: 2
                });
                const videos = res.body.data;
                expect(videos[0].name).to.equal('video 2 server 2');
                expect(videos[1].name).to.equal('video 1 server 2');
            }
            {
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    target: 'remote-videos',
                    sort: '-name',
                    start: 1,
                    count: 1
                });
                const videos = res.body.data;
                expect(videos[0].name).to.equal('video 1 server 2');
            }
        });
    });
    it('Should manually add a redundancy and list it', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const uuid = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video 3 server 2', privacy: models_1.VideoPrivacy.UNLISTED })).uuid;
            yield jobs_1.waitJobs(servers);
            const videoId = yield extra_utils_1.getLocalIdByUUID(servers[0].url, uuid);
            yield redundancy_1.addVideoRedundancy({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                videoId
            });
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.waitUntilLog(servers[0], 'Duplicated ', 15);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    target: 'remote-videos',
                    sort: '-name',
                    start: 0,
                    count: 5
                });
                const videos = res.body.data;
                expect(videos[0].name).to.equal('video 3 server 2');
                const video = videos[0];
                expect(video.redundancies.files).to.have.lengthOf(4);
                expect(video.redundancies.streamingPlaylists).to.have.lengthOf(1);
                const redundancies = video.redundancies.files.concat(video.redundancies.streamingPlaylists);
                for (const r of redundancies) {
                    redundanciesToRemove.push(r.id);
                    expect(r.strategy).to.equal('manual');
                    expect(r.fileUrl).to.exist;
                    expect(r.createdAt).to.exist;
                    expect(r.updatedAt).to.exist;
                    expect(r.expiresOn).to.be.null;
                }
            }
            const res = yield redundancy_1.listVideoRedundancies({
                url: servers[1].url,
                accessToken: servers[1].accessToken,
                target: 'my-videos',
                sort: '-name',
                start: 0,
                count: 5
            });
            const videos = res.body.data;
            expect(videos[0].name).to.equal('video 3 server 2');
            const video = videos[0];
            expect(video.redundancies.files).to.have.lengthOf(4);
            expect(video.redundancies.streamingPlaylists).to.have.lengthOf(1);
            const redundancies = video.redundancies.files.concat(video.redundancies.streamingPlaylists);
            for (const r of redundancies) {
                expect(r.strategy).to.be.null;
                expect(r.fileUrl).to.exist;
                expect(r.createdAt).to.exist;
                expect(r.updatedAt).to.exist;
                expect(r.expiresOn).to.be.null;
            }
        });
    });
    it('Should manually remove a redundancy and remove it from the list', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            for (const redundancyId of redundanciesToRemove) {
                yield redundancy_1.removeVideoRedundancy({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    redundancyId
                });
            }
            {
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    target: 'remote-videos',
                    sort: '-name',
                    start: 0,
                    count: 5
                });
                const videos = res.body.data;
                expect(videos).to.have.lengthOf(2);
                expect(videos[0].name).to.equal('video 2 server 2');
                redundanciesToRemove = [];
                const video = videos[0];
                expect(video.redundancies.files).to.have.lengthOf(4);
                expect(video.redundancies.streamingPlaylists).to.have.lengthOf(1);
                const redundancies = video.redundancies.files.concat(video.redundancies.streamingPlaylists);
                for (const r of redundancies) {
                    redundanciesToRemove.push(r.id);
                }
            }
        });
    });
    it('Should remove another (auto) redundancy', function () {
        return __awaiter(this, void 0, void 0, function* () {
            {
                for (const redundancyId of redundanciesToRemove) {
                    yield redundancy_1.removeVideoRedundancy({
                        url: servers[0].url,
                        accessToken: servers[0].accessToken,
                        redundancyId
                    });
                }
                const res = yield redundancy_1.listVideoRedundancies({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    target: 'remote-videos',
                    sort: '-name',
                    start: 0,
                    count: 5
                });
                const videos = res.body.data;
                expect(videos[0].name).to.equal('video 1 server 2');
                expect(videos).to.have.lengthOf(1);
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
