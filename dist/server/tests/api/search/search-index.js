"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const video_channels_1 = require("@shared/extra-utils/search/video-channels");
const expect = chai.expect;
describe('Test videos search', function () {
    let server = null;
    const localVideoName = 'local video' + new Date().toISOString();
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: localVideoName });
        });
    });
    describe('Default search', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            it('Should make a local videos search by default', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(10000);
                    yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                        search: {
                            searchIndex: {
                                enabled: true,
                                isDefaultSearch: false,
                                disableLocalSearch: false
                            }
                        }
                    });
                    const res = yield extra_utils_1.searchVideo(server.url, 'local video');
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data[0].name).to.equal(localVideoName);
                });
            });
            it('Should make a local channels search by default', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield video_channels_1.searchVideoChannel(server.url, 'root');
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data[0].name).to.equal('root_channel');
                    expect(res.body.data[0].host).to.equal('localhost:' + server.port);
                });
            });
            it('Should make an index videos search by default', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                        search: {
                            searchIndex: {
                                enabled: true,
                                isDefaultSearch: true,
                                disableLocalSearch: false
                            }
                        }
                    });
                    const res = yield extra_utils_1.searchVideo(server.url, 'local video');
                    expect(res.body.total).to.be.greaterThan(2);
                });
            });
            it('Should make an index channels search by default', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield video_channels_1.searchVideoChannel(server.url, 'root');
                    expect(res.body.total).to.be.greaterThan(2);
                });
            });
            it('Should make an index videos search if local search is disabled', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                        search: {
                            searchIndex: {
                                enabled: true,
                                isDefaultSearch: false,
                                disableLocalSearch: true
                            }
                        }
                    });
                    const res = yield extra_utils_1.searchVideo(server.url, 'local video');
                    expect(res.body.total).to.be.greaterThan(2);
                });
            });
            it('Should make an index channels search if local search is disabled', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield video_channels_1.searchVideoChannel(server.url, 'root');
                    expect(res.body.total).to.be.greaterThan(2);
                });
            });
        });
    });
    describe('Videos search', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            it('Should make a simple search and not have results', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.searchVideo(server.url, 'djidane'.repeat(50));
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.have.lengthOf(0);
                });
            });
            it('Should make a simple search and have results', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield extra_utils_1.searchVideo(server.url, 'What is PeerTube');
                    expect(res.body.total).to.be.greaterThan(1);
                });
            });
            it('Should make a complex search', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    function check(search, exists = true) {
                        return tslib_1.__awaiter(this, void 0, void 0, function* () {
                            const res = yield extra_utils_1.advancedVideosSearch(server.url, search);
                            if (exists === false) {
                                expect(res.body.total).to.equal(0);
                                expect(res.body.data).to.have.lengthOf(0);
                                return;
                            }
                            expect(res.body.total).to.equal(1);
                            expect(res.body.data).to.have.lengthOf(1);
                            const video = res.body.data[0];
                            expect(video.name).to.equal('What is PeerTube?');
                            expect(video.category.label).to.equal('Science & Technology');
                            expect(video.licence.label).to.equal('Attribution - Share Alike');
                            expect(video.privacy.label).to.equal('Public');
                            expect(video.duration).to.equal(113);
                            expect(video.thumbnailUrl.startsWith('https://framatube.org/static/thumbnails')).to.be.true;
                            expect(video.account.host).to.equal('framatube.org');
                            expect(video.account.name).to.equal('framasoft');
                            expect(video.account.url).to.equal('https://framatube.org/accounts/framasoft');
                            expect(video.account.avatar).to.exist;
                            expect(video.channel.host).to.equal('framatube.org');
                            expect(video.channel.name).to.equal('bf54d359-cfad-4935-9d45-9d6be93f63e8');
                            expect(video.channel.url).to.equal('https://framatube.org/video-channels/bf54d359-cfad-4935-9d45-9d6be93f63e8');
                            expect(video.channel.avatar).to.exist;
                        });
                    }
                    const baseSearch = {
                        search: 'what is peertube',
                        start: 0,
                        count: 2,
                        categoryOneOf: [15],
                        licenceOneOf: [2],
                        tagsAllOf: ['framasoft', 'peertube'],
                        startDate: '2018-10-01T10:50:46.396Z',
                        endDate: '2018-10-01T10:55:46.396Z'
                    };
                    {
                        yield check(baseSearch);
                    }
                    {
                        const search = extra_utils_1.immutableAssign(baseSearch, { startDate: '2018-10-01T10:54:46.396Z' });
                        yield check(search, false);
                    }
                    {
                        const search = extra_utils_1.immutableAssign(baseSearch, { tagsAllOf: ['toto', 'framasoft'] });
                        yield check(search, false);
                    }
                    {
                        const search = extra_utils_1.immutableAssign(baseSearch, { durationMin: 2000 });
                        yield check(search, false);
                    }
                    {
                        const search = extra_utils_1.immutableAssign(baseSearch, { nsfw: 'true' });
                        yield check(search, false);
                    }
                    {
                        const search = extra_utils_1.immutableAssign(baseSearch, { nsfw: 'false' });
                        yield check(search, true);
                    }
                    {
                        const search = extra_utils_1.immutableAssign(baseSearch, { nsfw: 'both' });
                        yield check(search, true);
                    }
                });
            });
            it('Should have a correct pagination', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const search = {
                        search: 'video',
                        start: 0,
                        count: 5
                    };
                    const res = yield extra_utils_1.advancedVideosSearch(server.url, search);
                    expect(res.body.total).to.be.greaterThan(5);
                    expect(res.body.data).to.have.lengthOf(5);
                });
            });
            it('Should use the nsfw instance policy as default', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    let nsfwUUID;
                    {
                        yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, { instance: { defaultNSFWPolicy: 'display' } });
                        const res = yield extra_utils_1.searchVideo(server.url, 'NSFW search index', '-match');
                        const video = res.body.data[0];
                        expect(res.body.data).to.have.length.greaterThan(0);
                        expect(video.nsfw).to.be.true;
                        nsfwUUID = video.uuid;
                    }
                    {
                        yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, { instance: { defaultNSFWPolicy: 'do_not_list' } });
                        const res = yield extra_utils_1.searchVideo(server.url, 'NSFW search index', '-match');
                        try {
                            expect(res.body.data).to.have.lengthOf(0);
                        }
                        catch (err) {
                            const video = res.body.data[0];
                            expect(video.uuid).not.equal(nsfwUUID);
                        }
                    }
                });
            });
        });
    });
    describe('Channels search', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            it('Should make a simple search and not have results', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield video_channels_1.searchVideoChannel(server.url, 'a'.repeat(500));
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.have.lengthOf(0);
                });
            });
            it('Should make a search and have results', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield video_channels_1.advancedVideoChannelSearch(server.url, { search: 'Framasoft', sort: 'createdAt' });
                    expect(res.body.total).to.be.greaterThan(0);
                    expect(res.body.data).to.have.length.greaterThan(0);
                    const videoChannel = res.body.data[0];
                    expect(videoChannel.url).to.equal('https://framatube.org/video-channels/bf54d359-cfad-4935-9d45-9d6be93f63e8');
                    expect(videoChannel.host).to.equal('framatube.org');
                    expect(videoChannel.avatar).to.exist;
                    expect(videoChannel.displayName).to.exist;
                    expect(videoChannel.ownerAccount.url).to.equal('https://framatube.org/accounts/framasoft');
                    expect(videoChannel.ownerAccount.name).to.equal('framasoft');
                    expect(videoChannel.ownerAccount.host).to.equal('framatube.org');
                    expect(videoChannel.ownerAccount.avatar).to.exist;
                });
            });
            it('Should have a correct pagination', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield video_channels_1.advancedVideoChannelSearch(server.url, { search: 'root', start: 0, count: 2 });
                    expect(res.body.total).to.be.greaterThan(2);
                    expect(res.body.data).to.have.lengthOf(2);
                });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
