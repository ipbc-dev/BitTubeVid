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
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../shared/extra-utils");
const videos_1 = require("../../shared/models/videos");
const expect = chai.expect;
describe('Test misc endpoints', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    describe('Test a well known endpoints', function () {
        it('Should get security.txt', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/security.txt',
                    statusCodeExpected: 200
                });
                expect(res.text).to.contain('security issue');
            });
        });
        it('Should get nodeinfo', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/nodeinfo',
                    statusCodeExpected: 200
                });
                expect(res.body.links).to.be.an('array');
                expect(res.body.links).to.have.lengthOf(1);
                expect(res.body.links[0].rel).to.equal('http://nodeinfo.diaspora.software/ns/schema/2.0');
            });
        });
        it('Should get dnt policy text', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/dnt-policy.txt',
                    statusCodeExpected: 200
                });
                expect(res.text).to.contain('http://www.w3.org/TR/tracking-dnt');
            });
        });
        it('Should get dnt policy', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/dnt',
                    statusCodeExpected: 200
                });
                expect(res.body.tracking).to.equal('N');
            });
        });
        it('Should get change-password location', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/.well-known/change-password',
                    statusCodeExpected: 302
                });
                expect(res.header.location).to.equal('/my-account/settings');
            });
        });
    });
    describe('Test classic static endpoints', function () {
        it('Should get robots.txt', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/robots.txt',
                    statusCodeExpected: 200
                });
                expect(res.text).to.contain('User-agent');
            });
        });
        it('Should get security.txt', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/security.txt',
                    statusCodeExpected: 301
                });
            });
        });
        it('Should get nodeinfo', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/nodeinfo/2.0.json',
                    statusCodeExpected: 200
                });
                expect(res.body.software.name).to.equal('peertube');
            });
        });
    });
    describe('Test bots endpoints', function () {
        it('Should get the empty sitemap', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/sitemap.xml',
                    statusCodeExpected: 200
                });
                expect(res.text).to.contain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
                expect(res.text).to.contain('<url><loc>http://localhost:9001/about/instance</loc></url>');
            });
        });
        it('Should get the empty cached sitemap', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/sitemap.xml',
                    statusCodeExpected: 200
                });
                expect(res.text).to.contain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
                expect(res.text).to.contain('<url><loc>http://localhost:9001/about/instance</loc></url>');
            });
        });
        it('Should add videos, channel and accounts and get sitemap', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(35000);
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 1', nsfw: false });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 2', nsfw: false });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 3', privacy: videos_1.VideoPrivacy.PRIVATE });
                yield extra_utils_1.addVideoChannel(server.url, server.accessToken, { name: 'channel1', displayName: 'channel 1' });
                yield extra_utils_1.addVideoChannel(server.url, server.accessToken, { name: 'channel2', displayName: 'channel 2' });
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: 'user1', password: 'password' });
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: 'user2', password: 'password' });
                const res = yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path: '/sitemap.xml?t=1',
                    statusCodeExpected: 200
                });
                expect(res.text).to.contain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
                expect(res.text).to.contain('<url><loc>http://localhost:9001/about/instance</loc></url>');
                expect(res.text).to.contain('<video:title>video 1</video:title>');
                expect(res.text).to.contain('<video:title>video 2</video:title>');
                expect(res.text).to.not.contain('<video:title>video 3</video:title>');
                expect(res.text).to.contain('<url><loc>http://localhost:9001/video-channels/channel1</loc></url>');
                expect(res.text).to.contain('<url><loc>http://localhost:9001/video-channels/channel2</loc></url>');
                expect(res.text).to.contain('<url><loc>http://localhost:9001/accounts/user1</loc></url>');
                expect(res.text).to.contain('<url><loc>http://localhost:9001/accounts/user2</loc></url>');
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
