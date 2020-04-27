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
const servers_1 = require("../../../shared/extra-utils/server/servers");
const extra_utils_1 = require("../../../shared/extra-utils");
const expect = chai.expect;
describe('Test plugin altering video constants', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoLanguages(server.url);
            const languages = res.body;
            expect(languages['en']).to.not.exist;
            expect(languages['fr']).to.not.exist;
            expect(languages['al_bhed']).to.equal('Al Bhed');
            expect(languages['al_bhed2']).to.equal('Al Bhed 2');
        });
    });
    it('Should have updated categories', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoCategories(server.url);
            const categories = res.body;
            expect(categories[1]).to.not.exist;
            expect(categories[2]).to.not.exist;
            expect(categories[42]).to.equal('Best category');
            expect(categories[43]).to.equal('High best category');
        });
    });
    it('Should have updated licences', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoLicences(server.url);
            const licences = res.body;
            expect(licences[1]).to.not.exist;
            expect(licences[7]).to.not.exist;
            expect(licences[42]).to.equal('Best licence');
            expect(licences[43]).to.equal('High best licence');
        });
    });
    it('Should be able to upload a video with these values', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const attrs = { name: 'video', category: 42, licence: 42, language: 'al_bhed2' };
            const resUpload = yield extra_utils_1.uploadVideo(server.url, server.accessToken, attrs);
            const res = yield extra_utils_1.getVideo(server.url, resUpload.body.video.uuid);
            const video = res.body;
            expect(video.language.label).to.equal('Al Bhed 2');
            expect(video.licence.label).to.equal('Best licence');
            expect(video.category.label).to.equal('Best category');
        });
    });
    it('Should uninstall the plugin and reset languages, categories and licences', function () {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
