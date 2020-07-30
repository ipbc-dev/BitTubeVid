"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const expect = chai.expect;
describe('Test activitypub', function () {
    let servers = [];
    let videoUUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video' });
                videoUUID = res.body.video.uuid;
            }
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should return the account object', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.makeActivityPubGetRequest(servers[0].url, '/accounts/root');
            const object = res.body;
            expect(object.type).to.equal('Person');
            expect(object.id).to.equal('http://localhost:' + servers[0].port + '/accounts/root');
            expect(object.name).to.equal('root');
            expect(object.preferredUsername).to.equal('root');
        });
    });
    it('Should return the video object', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.makeActivityPubGetRequest(servers[0].url, '/videos/watch/' + videoUUID);
            const object = res.body;
            expect(object.type).to.equal('Video');
            expect(object.id).to.equal('http://localhost:' + servers[0].port + '/videos/watch/' + videoUUID);
            expect(object.name).to.equal('video');
        });
    });
    it('Should redirect to the origin video object', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.makeActivityPubGetRequest(servers[1].url, '/videos/watch/' + videoUUID, 302);
            expect(res.header.location).to.equal('http://localhost:' + servers[0].port + '/videos/watch/' + videoUUID);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
