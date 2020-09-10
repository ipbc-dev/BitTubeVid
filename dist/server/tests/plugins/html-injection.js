"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../shared/extra-utils");
const expect = chai.expect;
describe('Test plugins HTML inection', function () {
    let server = null;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    it('Should not inject global css file in HTML', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield extra_utils_1.getPluginsCSS(server.url);
                expect(res.text).to.be.empty;
            }
            for (const path of ['/', '/videos/embed/1', '/video-playlists/embed/1']) {
                const res = yield extra_utils_1.makeHTMLRequest(server.url, path);
                expect(res.text).to.not.include('link rel="stylesheet" href="/plugins/global.css');
            }
        });
    });
    it('Should install a plugin and a theme', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-hello-world'
            });
        });
    });
    it('Should have the correct global css', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield extra_utils_1.getPluginsCSS(server.url);
                expect(res.text).to.contain('background-color: red');
            }
            for (const path of ['/', '/videos/embed/1', '/video-playlists/embed/1']) {
                const res = yield extra_utils_1.makeHTMLRequest(server.url, path);
                expect(res.text).to.include('link rel="stylesheet" href="/plugins/global.css');
            }
        });
    });
    it('Should have an empty global css on uninstall', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({
                url: server.url,
                accessToken: server.accessToken,
                npmName: 'peertube-plugin-hello-world'
            });
            {
                const res = yield extra_utils_1.getPluginsCSS(server.url);
                expect(res.text).to.be.empty;
            }
            for (const path of ['/', '/videos/embed/1', '/video-playlists/embed/1']) {
                const res = yield extra_utils_1.makeHTMLRequest(server.url, path);
                expect(res.text).to.not.include('link rel="stylesheet" href="/plugins/global.css');
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
