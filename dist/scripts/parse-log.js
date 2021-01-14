"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const program = require("commander");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const readline_1 = require("readline");
const winston = require("winston");
const logger_1 = require("../server/helpers/logger");
const config_1 = require("../server/initializers/config");
const logs_1 = require("../shared/core-utils/logs/logs");
program
    .option('-l, --level [level]', 'Level log (debug/info/warn/error)')
    .option('-f, --files [file...]', 'Files to parse. If not provided, the script will parse the latest log file from config)')
    .parse(process.argv);
const excludedKeys = {
    level: true,
    message: true,
    splat: true,
    timestamp: true,
    label: true
};
function keysExcluder(key, value) {
    return excludedKeys[key] === true ? undefined : value;
}
const loggerFormat = winston.format.printf((info) => {
    let additionalInfos = JSON.stringify(info, keysExcluder, 2);
    if (additionalInfos === '{}')
        additionalInfos = '';
    else
        additionalInfos = ' ' + additionalInfos;
    return `[${info.label}] ${toTimeFormat(info.timestamp)} ${info.level}: ${info.message}${additionalInfos}`;
});
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: program['level'] || 'debug',
            stderrLevels: [],
            format: winston.format.combine(winston.format.splat(), logger_1.labelFormatter(), winston.format.colorize(), loggerFormat)
        })
    ],
    exitOnError: true
});
const logLevels = {
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    info: logger.info.bind(logger),
    debug: logger.debug.bind(logger)
};
run()
    .then(() => process.exit(0))
    .catch(err => console.error(err));
function run() {
    return new Promise((res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const files = yield getFiles();
        for (const file of files) {
            console.log('Opening %s.', file);
            const stream = fs_extra_1.createReadStream(file);
            const rl = readline_1.createInterface({
                input: stream
            });
            rl.on('line', line => {
                try {
                    const log = JSON.parse(line);
                    Object.assign(log, { splat: undefined });
                    logLevels[log.level](log);
                }
                catch (err) {
                    console.error('Cannot parse line.', line);
                    throw err;
                }
            });
            stream.once('close', () => res());
        }
    }));
}
function getNewestFile(files, basePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sorted = yield logs_1.mtimeSortFilesDesc(files, basePath);
        return (sorted.length > 0) ? sorted[0].file : '';
    });
}
function getFiles() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (program['files'])
            return program['files'];
        const logFiles = yield fs_extra_1.readdir(config_1.CONFIG.STORAGE.LOG_DIR);
        const filename = yield getNewestFile(logFiles, config_1.CONFIG.STORAGE.LOG_DIR);
        return [path_1.join(config_1.CONFIG.STORAGE.LOG_DIR, filename)];
    });
}
function toTimeFormat(time) {
    const timestamp = Date.parse(time);
    if (isNaN(timestamp) === true)
        return 'Unknown date';
    return new Date(timestamp).toISOString();
}
