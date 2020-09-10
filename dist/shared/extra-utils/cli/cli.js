"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvCli = exports.execCLI = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
function getEnvCli(server) {
    return `NODE_ENV=test NODE_APP_INSTANCE=${server.internalServerNumber}`;
}
exports.getEnvCli = getEnvCli;
function execCLI(command) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((res, rej) => {
            child_process_1.exec(command, (err, stdout, stderr) => {
                if (err)
                    return rej(err);
                return res(stdout);
            });
        });
    });
}
exports.execCLI = execCLI;
