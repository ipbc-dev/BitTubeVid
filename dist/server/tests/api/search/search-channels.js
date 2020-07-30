"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const video_channels_1 = require("@shared/extra-utils/search/video-channels");
const extra_utils_1 = require("../../../../shared/extra-utils");
const expect = chai.expect;
describe('Test channels search', function () {
    let server = null;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            {
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: 'user1', password: 'password' });
                const channel = {
                    name: 'squall_channel',
                    displayName: 'Squall channel'
                };
                yield extra_utils_1.addVideoChannel(server.url, server.accessToken, channel);
            }
        });
    });
    it('Should make a simple search and not have results', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield video_channels_1.searchVideoChannel(server.url, 'abc');
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.have.lengthOf(0);
        });
    });
    it('Should make a search and have results', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const search = {
                    search: 'Squall',
                    start: 0,
                    count: 1
                };
                const res = yield video_channels_1.advancedVideoChannelSearch(server.url, search);
                expect(res.body.total).to.equal(1);
                expect(res.body.data).to.have.lengthOf(1);
                const channel = res.body.data[0];
                expect(channel.name).to.equal('squall_channel');
                expect(channel.displayName).to.equal('Squall channel');
            }
            {
                const search = {
                    search: 'Squall',
                    start: 1,
                    count: 1
                };
                const res = yield video_channels_1.advancedVideoChannelSearch(server.url, search);
                expect(res.body.total).to.equal(1);
                expect(res.body.data).to.have.lengthOf(0);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
