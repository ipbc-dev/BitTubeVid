"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const overviews_1 = require("../../../../shared/extra-utils/overviews/overviews");
const blocklist_1 = require("@shared/extra-utils/users/blocklist");
const expect = chai.expect;
describe('Test a videos overview', function () {
    let server = null;
    function testOverviewCount(res, expected) {
        const overview = res.body;
        expect(overview.tags).to.have.lengthOf(expected);
        expect(overview.categories).to.have.lengthOf(expected);
        expect(overview.channels).to.have.lengthOf(expected);
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    it('Should send empty overview', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield overviews_1.getVideosOverview(server.url, 1);
            testOverviewCount(res, 0);
        });
    });
    it('Should upload 5 videos in a specific category, tag and channel but not include them in overview', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            yield extra_utils_1.wait(3000);
            yield extra_utils_1.uploadVideo(server.url, server.accessToken, {
                name: 'video 0',
                category: 3,
                tags: ['coucou1', 'coucou2']
            });
            const res = yield overviews_1.getVideosOverview(server.url, 1);
            testOverviewCount(res, 0);
        });
    });
    it('Should upload another video and include all videos in the overview', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            for (let i = 1; i < 6; i++) {
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, {
                    name: 'video ' + i,
                    category: 3,
                    tags: ['coucou1', 'coucou2']
                });
            }
            yield extra_utils_1.wait(3000);
            {
                const res = yield overviews_1.getVideosOverview(server.url, 1);
                testOverviewCount(res, 1);
            }
            {
                const res = yield overviews_1.getVideosOverview(server.url, 2);
                const overview = res.body;
                expect(overview.tags).to.have.lengthOf(1);
                expect(overview.categories).to.have.lengthOf(0);
                expect(overview.channels).to.have.lengthOf(0);
            }
        });
    });
    it('Should have the correct overview', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res1 = yield overviews_1.getVideosOverview(server.url, 1);
            const res2 = yield overviews_1.getVideosOverview(server.url, 2);
            const overview1 = res1.body;
            const overview2 = res2.body;
            const tmp = [
                overview1.tags,
                overview1.categories,
                overview1.channels,
                overview2.tags
            ];
            for (const arr of tmp) {
                expect(arr).to.have.lengthOf(1);
                const obj = arr[0];
                expect(obj.videos).to.have.lengthOf(6);
                expect(obj.videos[0].name).to.equal('video 5');
                expect(obj.videos[1].name).to.equal('video 4');
                expect(obj.videos[2].name).to.equal('video 3');
                expect(obj.videos[3].name).to.equal('video 2');
                expect(obj.videos[4].name).to.equal('video 1');
                expect(obj.videos[5].name).to.equal('video 0');
            }
            const tags = [overview1.tags[0].tag, overview2.tags[0].tag];
            expect(tags.find(t => t === 'coucou1')).to.not.be.undefined;
            expect(tags.find(t => t === 'coucou2')).to.not.be.undefined;
            expect(overview1.categories[0].category.id).to.equal(3);
            expect(overview1.channels[0].channel.name).to.equal('root_channel');
        });
    });
    it('Should hide muted accounts', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const token = yield extra_utils_1.generateUserAccessToken(server, 'choco');
            yield blocklist_1.addAccountToAccountBlocklist(server.url, token, 'root@' + server.host);
            {
                const res = yield overviews_1.getVideosOverview(server.url, 1);
                testOverviewCount(res, 1);
            }
            {
                const res = yield overviews_1.getVideosOverviewWithToken(server.url, 1, token);
                testOverviewCount(res, 0);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
