"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserNotificationTypeValid = exports.isUserNotificationSettingValid = void 0;
const misc_1 = require("./misc");
const validator_1 = require("validator");
const users_1 = require("../../../shared/models/users");
const user_notification_setting_model_1 = require("../../../shared/models/users/user-notification-setting.model");
function isUserNotificationTypeValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value) && users_1.UserNotificationType[value] !== undefined;
}
exports.isUserNotificationTypeValid = isUserNotificationTypeValid;
function isUserNotificationSettingValid(value) {
    return misc_1.exists(value) &&
        validator_1.default.isInt('' + value) &&
        (value === user_notification_setting_model_1.UserNotificationSettingValue.NONE ||
            value === user_notification_setting_model_1.UserNotificationSettingValue.WEB ||
            value === user_notification_setting_model_1.UserNotificationSettingValue.EMAIL ||
            value === (user_notification_setting_model_1.UserNotificationSettingValue.WEB | user_notification_setting_model_1.UserNotificationSettingValue.EMAIL));
}
exports.isUserNotificationSettingValid = isUserNotificationSettingValid;
