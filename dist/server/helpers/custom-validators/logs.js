"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidLogLevel = void 0;
const misc_1 = require("./misc");
const logLevels = ['debug', 'info', 'warn', 'error'];
function isValidLogLevel(value) {
    return misc_1.exists(value) && logLevels.includes(value);
}
exports.isValidLogLevel = isValidLogLevel;
