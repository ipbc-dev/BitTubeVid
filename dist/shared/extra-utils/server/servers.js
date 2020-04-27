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
const child_process_1 = require("child_process");
const path_1 = require("path");
const miscs_1 = require("../miscs/miscs");
const fs_extra_1 = require("fs-extra");
const chai_1 = require("chai");
const miscs_2 = require("../../core-utils/miscs/miscs");
function parallelTests() {
    return process.env.MOCHA_PARALLEL === 'true';
}
exports.parallelTests = parallelTests;
function flushAndRunMultipleServers(totalServers, configOverride) {
    let apps = [];
    let i = 0;
    return new Promise(res => {
        function anotherServerDone(serverNumber, app) {
            apps[serverNumber - 1] = app;
            i++;
            if (i === totalServers) {
                return res(apps);
            }
        }
        for (let j = 1; j <= totalServers; j++) {
            flushAndRunServer(j, configOverride).then(app => anotherServerDone(j, app));
        }
    });
}
exports.flushAndRunMultipleServers = flushAndRunMultipleServers;
function flushTests(serverNumber) {
    return new Promise((res, rej) => {
        const suffix = serverNumber ? ` -- ${serverNumber}` : '';
        return child_process_1.exec('npm run clean:server:test' + suffix, (err, _stdout, stderr) => {
            if (err || stderr)
                return rej(err || new Error(stderr));
            return res();
        });
    });
}
exports.flushTests = flushTests;
function randomServer() {
    const low = 10;
    const high = 10000;
    return miscs_2.randomInt(low, high);
}
function flushAndRunServer(serverNumber, configOverride, args = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const parallel = parallelTests();
        const internalServerNumber = parallel ? randomServer() : serverNumber;
        const port = 9000 + internalServerNumber;
        yield flushTests(internalServerNumber);
        const server = {
            app: null,
            port,
            internalServerNumber,
            parallel,
            serverNumber,
            url: `http://localhost:${port}`,
            host: `localhost:${port}`,
            client: {
                id: null,
                secret: null
            },
            user: {
                username: null,
                password: null
            }
        };
        return runServer(server, configOverride, args);
    });
}
exports.flushAndRunServer = flushAndRunServer;
function runServer(server, configOverrideArg, args = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverRunString = {
            'Server listening': false
        };
        const key = 'Database peertube_test' + server.internalServerNumber + ' is ready';
        serverRunString[key] = false;
        const regexps = {
            client_id: 'Client id: (.+)',
            client_secret: 'Client secret: (.+)',
            user_username: 'Username: (.+)',
            user_password: 'User password: (.+)'
        };
        if (server.internalServerNumber !== server.serverNumber) {
            const basePath = path_1.join(miscs_1.root(), 'config');
            const tmpConfigFile = path_1.join(basePath, `test-${server.internalServerNumber}.yaml`);
            yield fs_extra_1.copy(path_1.join(basePath, `test-${server.serverNumber}.yaml`), tmpConfigFile);
            server.customConfigFile = tmpConfigFile;
        }
        const configOverride = {};
        if (server.parallel) {
            Object.assign(configOverride, {
                listen: {
                    port: server.port
                },
                webserver: {
                    port: server.port
                },
                database: {
                    suffix: '_test' + server.internalServerNumber
                },
                storage: {
                    tmp: `test${server.internalServerNumber}/tmp/`,
                    avatars: `test${server.internalServerNumber}/avatars/`,
                    videos: `test${server.internalServerNumber}/videos/`,
                    streaming_playlists: `test${server.internalServerNumber}/streaming-playlists/`,
                    redundancy: `test${server.internalServerNumber}/redundancy/`,
                    logs: `test${server.internalServerNumber}/logs/`,
                    previews: `test${server.internalServerNumber}/previews/`,
                    thumbnails: `test${server.internalServerNumber}/thumbnails/`,
                    torrents: `test${server.internalServerNumber}/torrents/`,
                    captions: `test${server.internalServerNumber}/captions/`,
                    cache: `test${server.internalServerNumber}/cache/`,
                    plugins: `test${server.internalServerNumber}/plugins/`
                },
                admin: {
                    email: `admin${server.internalServerNumber}@example.com`
                }
            });
        }
        if (configOverrideArg !== undefined) {
            Object.assign(configOverride, configOverrideArg);
        }
        const env = Object.create(process.env);
        env['NODE_ENV'] = 'test';
        env['NODE_APP_INSTANCE'] = server.internalServerNumber.toString();
        env['NODE_CONFIG'] = JSON.stringify(configOverride);
        const options = {
            silent: true,
            env,
            detached: true
        };
        return new Promise(res => {
            server.app = child_process_1.fork(path_1.join(miscs_1.root(), 'dist', 'server.js'), args, options);
            server.app.stdout.on('data', function onStdout(data) {
                let dontContinue = false;
                for (const key of Object.keys(regexps)) {
                    const regexp = regexps[key];
                    const matches = data.toString().match(regexp);
                    if (matches !== null) {
                        if (key === 'client_id')
                            server.client.id = matches[1];
                        else if (key === 'client_secret')
                            server.client.secret = matches[1];
                        else if (key === 'user_username')
                            server.user.username = matches[1];
                        else if (key === 'user_password')
                            server.user.password = matches[1];
                    }
                }
                for (const key of Object.keys(serverRunString)) {
                    if (data.toString().indexOf(key) !== -1)
                        serverRunString[key] = true;
                    if (serverRunString[key] === false)
                        dontContinue = true;
                }
                if (dontContinue === true)
                    return;
                server.app.stdout.removeListener('data', onStdout);
                process.on('exit', () => {
                    try {
                        process.kill(server.app.pid);
                    }
                    catch (_a) { }
                });
                res(server);
            });
        });
    });
}
function reRunServer(server, configOverride) {
    return __awaiter(this, void 0, void 0, function* () {
        const newServer = yield runServer(server, configOverride);
        server.app = newServer.app;
        return server;
    });
}
exports.reRunServer = reRunServer;
function checkTmpIsEmpty(server) {
    return checkDirectoryIsEmpty(server, 'tmp', ['plugins-global.css']);
}
exports.checkTmpIsEmpty = checkTmpIsEmpty;
function checkDirectoryIsEmpty(server, directory, exceptions = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const testDirectory = 'test' + server.internalServerNumber;
        const directoryPath = path_1.join(miscs_1.root(), testDirectory, directory);
        const directoryExists = yield fs_extra_1.pathExists(directoryPath);
        chai_1.expect(directoryExists).to.be.true;
        const files = yield fs_extra_1.readdir(directoryPath);
        const filtered = files.filter(f => exceptions.includes(f) === false);
        chai_1.expect(filtered).to.have.lengthOf(0);
    });
}
exports.checkDirectoryIsEmpty = checkDirectoryIsEmpty;
function killallServers(servers) {
    for (const server of servers) {
        if (!server.app)
            continue;
        process.kill(-server.app.pid);
        server.app = null;
    }
}
exports.killallServers = killallServers;
function cleanupTests(servers) {
    killallServers(servers);
    const p = [];
    for (const server of servers) {
        if (server.parallel) {
            p.push(flushTests(server.internalServerNumber));
        }
        if (server.customConfigFile) {
            p.push(fs_extra_1.remove(server.customConfigFile));
        }
    }
    return Promise.all(p);
}
exports.cleanupTests = cleanupTests;
function waitUntilLog(server, str, count = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        const logfile = path_1.join(miscs_1.root(), 'test' + server.internalServerNumber, 'logs/peertube.log');
        while (true) {
            const buf = yield fs_extra_1.readFile(logfile);
            const matches = buf.toString().match(new RegExp(str, 'g'));
            if (matches && matches.length === count)
                return;
            yield miscs_1.wait(1000);
        }
    });
}
exports.waitUntilLog = waitUntilLog;
