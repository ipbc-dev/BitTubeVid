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
const extra_utils_1 = require("../../../shared/extra-utils");
const chai_1 = require("chai");
describe('Test plugin scripts', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    it('Should install a plugin from stateless CLI', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const packagePath = extra_utils_1.getPluginTestPath();
            const env = extra_utils_1.getEnvCli(server);
            yield extra_utils_1.execCLI(`${env} npm run plugin:install -- --plugin-path ${packagePath}`);
        });
    });
    it('Should install a theme from stateless CLI', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const env = extra_utils_1.getEnvCli(server);
            yield extra_utils_1.execCLI(`${env} npm run plugin:install -- --npm-name peertube-theme-background-red`);
        });
    });
    it('Should have the theme and the plugin registered when we restart peertube', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server);
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const plugin = config.plugin.registered
                .find(p => p.name === 'test');
            chai_1.expect(plugin).to.not.be.undefined;
            const theme = config.theme.registered
                .find(t => t.name === 'background-red');
            chai_1.expect(theme).to.not.be.undefined;
        });
    });
    it('Should uninstall a plugin from stateless CLI', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const env = extra_utils_1.getEnvCli(server);
            yield extra_utils_1.execCLI(`${env} npm run plugin:uninstall -- --npm-name peertube-plugin-test`);
        });
    });
    it('Should have removed the plugin on another peertube restart', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server);
            const res = yield extra_utils_1.getConfig(server.url);
            const config = res.body;
            const plugin = config.plugin.registered
                .find(p => p.name === 'test');
            chai_1.expect(plugin).to.be.undefined;
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
