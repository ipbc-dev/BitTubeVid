"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserNotificationTypeValid = exports.isUserNotificationSettingValid = void 0;
const misc_1 = require("./misc");
const validator_1 = require("validator");
const users_1 = require("../../../shared/models/users");
function isUserNotificationTypeValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value) && users_1.UserNotificationType[value] !== undefined;
}
exports.isUserNotificationTypeValid = isUserNotificationTypeValid;
function isUserNotificationSettingValid(value) {
    return misc_1.exists(value) &&
        validator_1.default.isInt('' + value) &&
        (value === 0 ||
            value === 1 ||
            value === 2 ||
            value === (1 | 2));
}
exports.isUserNotificationSettingValid = isUserNotificationSettingValid;
