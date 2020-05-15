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
describe('Test plugin translations', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                path: extra_utils_1.getPluginTestPath()
            });
            yield extra_utils_1.installPlugin({
                url: server.url,
                accessToken: server.accessToken,
                path: extra_utils_1.getPluginTestPath('-two')
            });
        });
    });
    it('Should not have translations for locale pt', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPluginTranslations({ url: server.url, locale: 'pt' });
            expect(res.body).to.deep.equal({});
        });
    });
    it('Should have translations for locale fr', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPluginTranslations({ url: server.url, locale: 'fr-FR' });
            expect(res.body).to.deep.equal({
                'peertube-plugin-test': {
                    'Hi': 'Coucou'
                },
                'peertube-plugin-test-two': {
                    'Hello world': 'Bonjour le monde'
                }
            });
        });
    });
    it('Should have translations of locale it', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getPluginTranslations({ url: server.url, locale: 'it-IT' });
            expect(res.body).to.deep.equal({
                'peertube-plugin-test-two': {
                    'Hello world': 'Ciao, mondo!'
                }
            });
        });
    });
    it('Should remove the plugin and remove the locales', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uninstallPlugin({ url: server.url, accessToken: server.accessToken, npmName: 'peertube-plugin-test-two' });
            {
                const res = yield extra_utils_1.getPluginTranslations({ url: server.url, locale: 'fr-FR' });
                expect(res.body).to.deep.equal({
                    'peertube-plugin-test': {
                        'Hi': 'Coucou'
                    }
                });
            }
            {
                const res = yield extra_utils_1.getPluginTranslations({ url: server.url, locale: 'it-IT' });
                expect(res.body).to.deep.equal({});
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
