"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const tsConfigPaths = require("tsconfig-paths");
const tsConfig = require('../../tsconfig.json');
function registerTSPaths() {
    tsConfigPaths.register({
        baseUrl: path_1.resolve(tsConfig.compilerOptions.baseUrl || '', tsConfig.compilerOptions.outDir || ''),
        paths: tsConfig.compilerOptions.paths
    });
}
exports.registerTSPaths = registerTSPaths;
