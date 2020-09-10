"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const video_captions_1 = require("../../../../shared/extra-utils/videos/video-captions");
const expect = chai.expect;
describe('Test videos search', function () {
    let server = null;
    let startDate;
    let videoUUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            {
                const attributes1 = {
                    name: '1111 2222 3333',
                    fixture: '60fps_720p_small.mp4',
                    category: 1,
                    licence: 1,
                    nsfw: false,
                    language: 'fr'
                };
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes1);
                const attributes2 = extra_utils_1.immutableAssign(attributes1, { name: attributes1.name + ' - 2', fixture: 'video_short.mp4' });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes2);
                {
                    const attributes3 = extra_utils_1.immutableAssign(attributes1, { name: attributes1.name + ' - 3', language: undefined });
                    const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes3);
                    const videoId = res.body.video.id;
                    videoUUID = res.body.video.uuid;
                    yield video_captions_1.createVideoCaption({
                        url: server.url,
                        accessToken: server.accessToken,
                        language: 'en',
                        videoId,
                        fixture: 'subtitle-good2.vtt',
                        mimeType: 'application/octet-stream'
                    });
                    yield video_captions_1.createVideoCaption({
                        url: server.url,
                        accessToken: server.accessToken,
                        language: 'aa',
                        videoId,
                        fixture: 'subtitle-good2.vtt',
                        mimeType: 'application/octet-stream'
                    });
                }
                const attributes4 = extra_utils_1.immutableAssign(attributes1, { name: attributes1.name + ' - 4', language: 'pl', nsfw: true });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes4);
                yield extra_utils_1.wait(1000);
                startDate = new Date().toISOString();
                const attributes5 = extra_utils_1.immutableAssign(attributes1, { name: attributes1.name + ' - 5', licence: 2, language: undefined });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes5);
                const attributes6 = extra_utils_1.immutableAssign(attributes1, { name: attributes1.name + ' - 6', tags: ['t1', 't2'] });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes6);
                const attributes7 = extra_utils_1.immutableAssign(attributes1, {
                    name: attributes1.name + ' - 7',
                    originallyPublishedAt: '2019-02-12T09:58:08.286Z'
                });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes7);
                const attributes8 = extra_utils_1.immutableAssign(attributes1, { name: attributes1.name + ' - 8', licence: 4 });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes8);
            }
            {
                const attributes = {
                    name: '3333 4444 5555',
                    fixture: 'video_short.mp4',
                    category: 2,
                    licence: 2,
                    language: 'en'
                };
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes);
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, extra_utils_1.immutableAssign(attributes, { name: attributes.name + ' duplicate' }));
            }
            {
                const attributes = {
                    name: '6666 7777 8888',
                    fixture: 'video_short.mp4',
                    category: 3,
                    licence: 3,
                    language: 'pl'
                };
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes);
            }
            {
                const attributes1 = {
                    name: '9999',
                    tags: ['aaaa', 'bbbb', 'cccc'],
                    category: 1
                };
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes1);
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, extra_utils_1.immutableAssign(attributes1, { category: 2 }));
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, extra_utils_1.immutableAssign(attributes1, { tags: ['cccc', 'dddd'] }));
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, extra_utils_1.immutableAssign(attributes1, { tags: ['eeee', 'ffff'] }));
            }
            {
                const attributes1 = {
                    name: 'aaaa 2',
                    category: 1
                };
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes1);
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, extra_utils_1.immutableAssign(attributes1, { category: 2 }));
            }
        });
    });
    it('Should make a simple search and not have results', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.searchVideo(server.url, 'abc');
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should make a simple search and have results', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.searchVideo(server.url, '4444 5555 duplicate');
            expect(res.body.total).to.equal(2);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(2);
            expect(videos[0].name).to.equal('3333 4444 5555 duplicate');
            expect(videos[1].name).to.equal('3333 4444 5555');
        });
    });
    it('Should make a search on tags too, and have results', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: 'aaaa',
                categoryOneOf: [1]
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(2);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(2);
            expect(videos[0].name).to.equal('aaaa 2');
            expect(videos[1].name).to.equal('9999');
        });
    });
    it('Should filter on tags without a search', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                tagsAllOf: ['bbbb']
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(2);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(2);
            expect(videos[0].name).to.equal('9999');
            expect(videos[1].name).to.equal('9999');
        });
    });
    it('Should filter on category without a search', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                categoryOneOf: [3]
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(1);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(1);
            expect(videos[0].name).to.equal('6666 7777 8888');
        });
    });
    it('Should search by tags (one of)', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '9999',
                categoryOneOf: [1],
                tagsOneOf: ['aAaa', 'ffff']
            };
            const res1 = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res1.body.total).to.equal(2);
            const res2 = yield extra_utils_1.advancedVideosSearch(server.url, extra_utils_1.immutableAssign(query, { tagsOneOf: ['blabla'] }));
            expect(res2.body.total).to.equal(0);
        });
    });
    it('Should search by tags (all of)', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '9999',
                categoryOneOf: [1],
                tagsAllOf: ['CCcc']
            };
            const res1 = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res1.body.total).to.equal(2);
            const res2 = yield extra_utils_1.advancedVideosSearch(server.url, extra_utils_1.immutableAssign(query, { tagsAllOf: ['blAbla'] }));
            expect(res2.body.total).to.equal(0);
            const res3 = yield extra_utils_1.advancedVideosSearch(server.url, extra_utils_1.immutableAssign(query, { tagsAllOf: ['bbbb', 'CCCC'] }));
            expect(res3.body.total).to.equal(1);
        });
    });
    it('Should search by category', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '6666',
                categoryOneOf: [3]
            };
            const res1 = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res1.body.total).to.equal(1);
            expect(res1.body.data[0].name).to.equal('6666 7777 8888');
            const res2 = yield extra_utils_1.advancedVideosSearch(server.url, extra_utils_1.immutableAssign(query, { categoryOneOf: [2] }));
            expect(res2.body.total).to.equal(0);
        });
    });
    it('Should search by licence', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '4444 5555',
                licenceOneOf: [2]
            };
            const res1 = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res1.body.total).to.equal(2);
            expect(res1.body.data[0].name).to.equal('3333 4444 5555');
            expect(res1.body.data[1].name).to.equal('3333 4444 5555 duplicate');
            const res2 = yield extra_utils_1.advancedVideosSearch(server.url, extra_utils_1.immutableAssign(query, { licenceOneOf: [3] }));
            expect(res2.body.total).to.equal(0);
        });
    });
    it('Should search by languages', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '1111 2222 3333',
                languageOneOf: ['pl', 'en']
            };
            {
                const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
                expect(res.body.total).to.equal(2);
                expect(res.body.data[0].name).to.equal('1111 2222 3333 - 3');
                expect(res.body.data[1].name).to.equal('1111 2222 3333 - 4');
            }
            {
                const res = yield extra_utils_1.advancedVideosSearch(server.url, extra_utils_1.immutableAssign(query, { languageOneOf: ['pl', 'en', '_unknown'] }));
                expect(res.body.total).to.equal(3);
                expect(res.body.data[0].name).to.equal('1111 2222 3333 - 3');
                expect(res.body.data[1].name).to.equal('1111 2222 3333 - 4');
                expect(res.body.data[2].name).to.equal('1111 2222 3333 - 5');
            }
            {
                const res = yield extra_utils_1.advancedVideosSearch(server.url, extra_utils_1.immutableAssign(query, { languageOneOf: ['eo'] }));
                expect(res.body.total).to.equal(0);
            }
        });
    });
    it('Should search by start date', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '1111 2222 3333',
                startDate
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(4);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('1111 2222 3333 - 5');
            expect(videos[1].name).to.equal('1111 2222 3333 - 6');
            expect(videos[2].name).to.equal('1111 2222 3333 - 7');
            expect(videos[3].name).to.equal('1111 2222 3333 - 8');
        });
    });
    it('Should make an advanced search', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '1111 2222 3333',
                languageOneOf: ['pl', 'fr'],
                durationMax: 4,
                nsfw: 'false',
                licenceOneOf: [1, 4]
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(4);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('1111 2222 3333');
            expect(videos[1].name).to.equal('1111 2222 3333 - 6');
            expect(videos[2].name).to.equal('1111 2222 3333 - 7');
            expect(videos[3].name).to.equal('1111 2222 3333 - 8');
        });
    });
    it('Should make an advanced search and sort results', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '1111 2222 3333',
                languageOneOf: ['pl', 'fr'],
                durationMax: 4,
                nsfw: 'false',
                licenceOneOf: [1, 4],
                sort: '-name'
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(4);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('1111 2222 3333 - 8');
            expect(videos[1].name).to.equal('1111 2222 3333 - 7');
            expect(videos[2].name).to.equal('1111 2222 3333 - 6');
            expect(videos[3].name).to.equal('1111 2222 3333');
        });
    });
    it('Should make an advanced search and only show the first result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '1111 2222 3333',
                languageOneOf: ['pl', 'fr'],
                durationMax: 4,
                nsfw: 'false',
                licenceOneOf: [1, 4],
                sort: '-name',
                start: 0,
                count: 1
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(4);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('1111 2222 3333 - 8');
        });
    });
    it('Should make an advanced search and only show the last result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = {
                search: '1111 2222 3333',
                languageOneOf: ['pl', 'fr'],
                durationMax: 4,
                nsfw: 'false',
                licenceOneOf: [1, 4],
                sort: '-name',
                start: 3,
                count: 1
            };
            const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
            expect(res.body.total).to.equal(4);
            const videos = res.body.data;
            expect(videos[0].name).to.equal('1111 2222 3333');
        });
    });
    it('Should search on originally published date', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const baseQuery = {
                search: '1111 2222 3333',
                languageOneOf: ['pl', 'fr'],
                durationMax: 4,
                nsfw: 'false',
                licenceOneOf: [1, 4]
            };
            {
                const query = extra_utils_1.immutableAssign(baseQuery, { originallyPublishedStartDate: '2019-02-11T09:58:08.286Z' });
                const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
                expect(res.body.total).to.equal(1);
                expect(res.body.data[0].name).to.equal('1111 2222 3333 - 7');
            }
            {
                const query = extra_utils_1.immutableAssign(baseQuery, { originallyPublishedEndDate: '2019-03-11T09:58:08.286Z' });
                const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
                expect(res.body.total).to.equal(1);
                expect(res.body.data[0].name).to.equal('1111 2222 3333 - 7');
            }
            {
                const query = extra_utils_1.immutableAssign(baseQuery, { originallyPublishedEndDate: '2019-01-11T09:58:08.286Z' });
                const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
                expect(res.body.total).to.equal(0);
            }
            {
                const query = extra_utils_1.immutableAssign(baseQuery, { originallyPublishedStartDate: '2019-03-11T09:58:08.286Z' });
                const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
                expect(res.body.total).to.equal(0);
            }
            {
                const query = extra_utils_1.immutableAssign(baseQuery, {
                    originallyPublishedStartDate: '2019-01-11T09:58:08.286Z',
                    originallyPublishedEndDate: '2019-01-10T09:58:08.286Z'
                });
                const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
                expect(res.body.total).to.equal(0);
            }
            {
                const query = extra_utils_1.immutableAssign(baseQuery, {
                    originallyPublishedStartDate: '2019-01-11T09:58:08.286Z',
                    originallyPublishedEndDate: '2019-04-11T09:58:08.286Z'
                });
                const res = yield extra_utils_1.advancedVideosSearch(server.url, query);
                expect(res.body.total).to.equal(1);
                expect(res.body.data[0].name).to.equal('1111 2222 3333 - 7');
            }
        });
    });
    it('Should search by UUID', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const search = videoUUID;
            const res = yield extra_utils_1.advancedVideosSearch(server.url, { search });
            expect(res.body.total).to.equal(1);
            expect(res.body.data[0].name).to.equal('1111 2222 3333 - 3');
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
