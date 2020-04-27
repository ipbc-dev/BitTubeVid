"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path = require("path");
const winston = require("winston");
const config_1 = require("../initializers/config");
const lodash_1 = require("lodash");
const constants_1 = require("@server/initializers/constants");
const label = config_1.CONFIG.WEBSERVER.HOSTNAME + ':' + config_1.CONFIG.WEBSERVER.PORT;
fs_extra_1.mkdirpSync(config_1.CONFIG.STORAGE.LOG_DIR);
function getLoggerReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value))
                return;
            seen.add(value);
        }
        if (value instanceof Error) {
            const error = {};
            Object.getOwnPropertyNames(value).forEach(key => error[key] = value[key]);
            return error;
        }
        return value;
    };
}
const consoleLoggerFormat = winston.format.printf(info => {
    const obj = lodash_1.omit(info, 'label', 'timestamp', 'level', 'message');
    let additionalInfos = JSON.stringify(obj, getLoggerReplacer(), 2);
    if (additionalInfos === undefined || additionalInfos === '{}')
        additionalInfos = '';
    else
        additionalInfos = ' ' + additionalInfos;
    return `[${info.label}] ${info.timestamp} ${info.level}: ${info.message}${additionalInfos}`;
});
exports.consoleLoggerFormat = consoleLoggerFormat;
const jsonLoggerFormat = winston.format.printf(info => {
    return JSON.stringify(info, getLoggerReplacer());
});
exports.jsonLoggerFormat = jsonLoggerFormat;
const timestampFormatter = winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
});
exports.timestampFormatter = timestampFormatter;
const labelFormatter = winston.format.label({
    label
});
exports.labelFormatter = labelFormatter;
const fileLoggerOptions = {
    filename: path.join(config_1.CONFIG.STORAGE.LOG_DIR, constants_1.LOG_FILENAME),
    handleExceptions: true,
    format: winston.format.combine(winston.format.timestamp(), jsonLoggerFormat)
};
if (config_1.CONFIG.LOG.ROTATION.ENABLED) {
    fileLoggerOptions.maxsize = config_1.CONFIG.LOG.ROTATION.MAX_FILE_SIZE;
    fileLoggerOptions.maxFiles = config_1.CONFIG.LOG.ROTATION.MAX_FILES;
}
const logger = winston.createLogger({
    level: config_1.CONFIG.LOG.LEVEL,
    format: winston.format.combine(labelFormatter, winston.format.splat()),
    transports: [
        new winston.transports.File(fileLoggerOptions),
        new winston.transports.Console({
            handleExceptions: true,
            format: winston.format.combine(timestampFormatter, winston.format.colorize(), consoleLoggerFormat)
        })
    ],
    exitOnError: true
});
exports.logger = logger;
function bunyanLogFactory(level) {
    return function () {
        let meta = null;
        let args = [];
        args.concat(arguments);
        if (arguments[0] instanceof Error) {
            meta = arguments[0].toString();
            args = Array.prototype.slice.call(arguments, 1);
            args.push(meta);
        }
        else if (typeof (args[0]) !== 'string') {
            meta = arguments[0];
            args = Array.prototype.slice.call(arguments, 1);
            args.push(meta);
        }
        logger[level].apply(logger, args);
    };
}
const bunyanLogger = {
    trace: bunyanLogFactory('debug'),
    debug: bunyanLogFactory('debug'),
    info: bunyanLogFactory('info'),
    warn: bunyanLogFactory('warn'),
    error: bunyanLogFactory('error'),
    fatal: bunyanLogFactory('error')
};
exports.bunyanLogger = bunyanLogger;
