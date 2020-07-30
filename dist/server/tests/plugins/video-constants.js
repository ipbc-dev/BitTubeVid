"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const servers_1 = require("../../../shared/extra-utils/server/servers");
const extra_utils_1 = require("../../../shared/extra-utils");
const videos_1 = require("../../../shared/models/videos");
const expect = chai.expect;
describe('Test plugin altering video constants', function () {
    let server;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                path: extra_utils_1.getPluginTestPath('-three')
            });
        });
    });
    it('Should have updated languages', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoLanguages(server.url);
            const languages = res.body;
            expect(languages['en']).to.not.exist;
            expect(languages['fr']).to.not.exist;
            expect(languages['al_bhed']).to.equal('Al Bhed');
            expect(languages['al_bhed2']).to.equal('Al Bhed 2');
        });
    });
    it('Should have updated categories', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoCategories(server.url);
            const categories = res.body;
            expect(categories[1]).to.not.exist;
            expect(categories[2]).to.not.exist;
            expect(categories[42]).to.equal('Best category');
            expect(categories[43]).to.equal('High best category');
        });
    });
    it('Should have updated licences', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoLicences(server.url);
            const licences = res.body;
            expect(licences[1]).to.not.exist;
            expect(licences[7]).to.not.exist;
            expect(licences[42]).to.equal('Best licence');
            expect(licences[43]).to.equal('High best licence');
        });
    });
    it('Should have updated video privacies', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoPrivacies(server.url);
            const privacies = res.body;
            expect(privacies[1]).to.exist;
            expect(privacies[2]).to.not.exist;
            expect(privacies[3]).to.exist;
            expect(privacies[4]).to.exist;
        });
    });
    it('Should have updated playlist privacies', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoPlaylistPrivacies(server.url);
            const playlistPrivacies = res.body;
            expect(playlistPrivacies[1]).to.exist;
            expect(playlistPrivacies[2]).to.exist;
            expect(playlistPrivacies[3]).to.not.exist;
        });
    });
    it('Should not be able to create a video with this privacy', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const attrs = { name: 'video', privacy: 2 };
            yield extra_utils_1.uploadVideo(server.url, server.accessToken, attrs, 400);
        });
    });
    it('Should not be able to create a video with this privacy', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const attrs = { displayName: 'video playlist', privacy: videos_1.VideoPlaylistPrivacy.PRIVATE };
            yield extra_utils_1.createVideoPlaylist({ url: server.url, token: server.accessToken, playlistAttrs: attrs, expectedStatus: 400 });
        });
    });
    it('Should be able to upload a video with these values', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const attrs = { name: 'video', category: 42, licence: 42, language: 'al_bhed2' };
            const resUpload = yield extra_utils_1.uploadVideo(server.url, server.accessToken, attrs);
            const res = yield extra_utils_1.getVideo(server.url, resUpload.body.video.uuid);
            const video = res.body;
            expect(video.language.label).to.equal('Al Bhed 2');
            expect(video.licence.label).to.equal('Best licence');
            expect(video.category.label).to.equal('Best category');
        });
    });
    it('Should uninstall the plugin and reset languages, categories, licences and privacies', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({ url: server.url, accessToken: server.accessToken, npmName: 'peertube-plugin-test-three' });
            {
                const res = yield extra_utils_1.getVideoLanguages(server.url);
                const languages = res.body;
                expect(languages['en']).to.equal('English');
                expect(languages['fr']).to.equal('French');
                expect(languages['al_bhed']).to.not.exist;
                expect(languages['al_bhed2']).to.not.exist;
            }
            {
                const res = yield extra_utils_1.getVideoCategories(server.url);
                const categories = res.body;
                expect(categories[1]).to.equal('Music');
                expect(categories[2]).to.equal('Films');
                expect(categories[42]).to.not.exist;
                expect(categories[43]).to.not.exist;
            }
            {
                const res = yield extra_utils_1.getVideoLicences(server.url);
                const licences = res.body;
                expect(licences[1]).to.equal('Attribution');
                expect(licences[7]).to.equal('Public Domain Dedication');
                expect(licences[42]).to.not.exist;
                expect(licences[43]).to.not.exist;
            }
            {
                const res = yield extra_utils_1.getVideoPrivacies(server.url);
                const privacies = res.body;
                expect(privacies[1]).to.exist;
                expect(privacies[2]).to.exist;
                expect(privacies[3]).to.exist;
                expect(privacies[4]).to.exist;
            }
            {
                const res = yield extra_utils_1.getVideoPlaylistPrivacies(server.url);
                const playlistPrivacies = res.body;
                expect(playlistPrivacies[1]).to.exist;
                expect(playlistPrivacies[2]).to.exist;
                expect(playlistPrivacies[3]).to.exist;
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
