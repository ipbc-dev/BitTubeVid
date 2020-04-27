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
const core_utils_1 = require("../../helpers/core-utils");
const logger_1 = require("../../helpers/logger");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const config_1 = require("../../initializers/config");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
function installNpmPlugin(npmName, version) {
    return __awaiter(this, void 0, void 0, function* () {
        checkNpmPluginNameOrThrow(npmName);
        if (version)
            checkPluginVersionOrThrow(version);
        let toInstall = npmName;
        if (version)
            toInstall += `@${version}`;
        const { stdout } = yield execYarn('add ' + toInstall);
        logger_1.logger.debug('Added a yarn package.', { yarnStdout: stdout });
    });
}
exports.installNpmPlugin = installNpmPlugin;
function installNpmPluginFromDisk(path) {
    return __awaiter(this, void 0, void 0, function* () {
        yield execYarn('add file:' + path);
    });
}
exports.installNpmPluginFromDisk = installNpmPluginFromDisk;
function removeNpmPlugin(name) {
    return __awaiter(this, void 0, void 0, function* () {
        checkNpmPluginNameOrThrow(name);
        yield execYarn('remove ' + name);
    });
}
exports.removeNpmPlugin = removeNpmPlugin;
function execYarn(command) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pluginDirectory = config_1.CONFIG.STORAGE.PLUGINS_DIR;
            const pluginPackageJSON = path_1.join(pluginDirectory, 'package.json');
            if (!(yield fs_extra_1.pathExists(pluginPackageJSON))) {
                yield fs_extra_1.outputJSON(pluginPackageJSON, {});
            }
            return core_utils_1.execShell(`yarn ${command}`, { cwd: pluginDirectory });
        }
        catch (result) {
            logger_1.logger.error('Cannot exec yarn.', { command, err: result.err, stderr: result.stderr });
            throw result.err;
        }
    });
}
function checkNpmPluginNameOrThrow(name) {
    if (!plugins_1.isNpmPluginNameValid(name))
        throw new Error('Invalid NPM plugin name to install');
}
function checkPluginVersionOrThrow(name) {
    if (!plugins_1.isPluginVersionValid(name))
        throw new Error('Invalid NPM plugin version to install');
}
