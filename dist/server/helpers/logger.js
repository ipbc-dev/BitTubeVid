"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bunyanLogger = exports.logger = exports.jsonLoggerFormat = exports.consoleLoggerFormat = exports.labelFormatter = exports.timestampFormatter = exports.buildLogger = void 0;
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const path = require("path");
const sql_formatter_1 = require("sql-formatter");
const winston = require("winston");
const config_1 = require("../initializers/config");
const constants_1 = require("../initializers/constants");
const label = config_1.CONFIG.WEBSERVER.HOSTNAME + ':' + config_1.CONFIG.WEBSERVER.PORT;
fs_extra_1.mkdirpSync(config_1.CONFIG.STORAGE.LOG_DIR);
function getLoggerReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
        if (key === 'cert')
            return 'Replaced by the logger to avoid large log message';
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value))
                return;
            seen.add(value);
        }
        if (value instanceof Set) {
            return Array.from(value);
        }
        if (value instanceof Map) {
            return Array.from(value.entries());
        }
        if (value instanceof Error) {
            const error = {};
            Object.getOwnPropertyNames(value).forEach(key => { error[key] = value[key]; });
            return error;
        }
        return value;
    };
}
const consoleLoggerFormat = winston.format.printf(info => {
    const toOmit = ['label', 'timestamp', 'level', 'message', 'sql'];
    const obj = lodash_1.omit(info, ...toOmit);
    let additionalInfos = JSON.stringify(obj, getLoggerReplacer(), 2);
    if (additionalInfos === undefined || additionalInfos === '{}')
        additionalInfos = '';
    else
        additionalInfos = ' ' + additionalInfos;
    if (info.sql) {
        if (config_1.CONFIG.LOG.PRETTIFY_SQL) {
            additionalInfos += '\n' + sql_formatter_1.format(info.sql, {
                language: 'sql',
                indent: '  '
            });
        }
        else {
            additionalInfos += ' - ' + info.sql;
        }
    }
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
const labelFormatter = (suffix) => {
    return winston.format.label({
        label: suffix ? `${label} ${suffix}` : label
    });
};
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
const logger = buildLogger();
exports.logger = logger;
function buildLogger(labelSuffix) {
    return winston.createLogger({
        level: config_1.CONFIG.LOG.LEVEL,
        format: winston.format.combine(labelFormatter(labelSuffix), winston.format.splat()),
        transports: [
            new winston.transports.File(fileLoggerOptions),
            new winston.transports.Console({
                handleExceptions: true,
                format: winston.format.combine(timestampFormatter, winston.format.colorize(), consoleLoggerFormat)
            })
        ],
        exitOnError: true
    });
}
exports.buildLogger = buildLogger;
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
