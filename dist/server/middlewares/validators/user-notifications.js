"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsReadUserNotificationsValidator = exports.updateNotificationSettingsValidator = exports.listUserNotificationsValidator = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const user_notifications_1 = require("../../helpers/custom-validators/user-notifications");
const misc_1 = require("../../helpers/custom-validators/misc");
const listUserNotificationsValidator = [
    express_validator_1.query('unread')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull)
        .isBoolean().withMessage('Should have a valid unread boolean'),
    (req, res, next) => {
        logger_1.logger.debug('Checking listUserNotificationsValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.listUserNotificationsValidator = listUserNotificationsValidator;
const updateNotificationSettingsValidator = [
    express_validator_1.body('newVideoFromSubscription')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid new video from subscription notification setting'),
    express_validator_1.body('newCommentOnMyVideo')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid new comment on my video notification setting'),
    express_validator_1.body('abuseAsModerator')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid abuse as moderator notification setting'),
    express_validator_1.body('videoAutoBlacklistAsModerator')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid video auto blacklist notification setting'),
    express_validator_1.body('blacklistOnMyVideo')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid new blacklist on my video notification setting'),
    express_validator_1.body('myVideoImportFinished')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid video import finished video notification setting'),
    express_validator_1.body('myVideoPublished')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid video published notification setting'),
    express_validator_1.body('commentMention')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid comment mention notification setting'),
    express_validator_1.body('newFollow')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid new follow notification setting'),
    express_validator_1.body('newUserRegistration')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid new user registration notification setting'),
    express_validator_1.body('newInstanceFollower')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid new instance follower notification setting'),
    express_validator_1.body('autoInstanceFollowing')
        .custom(user_notifications_1.isUserNotificationSettingValid).withMessage('Should have a valid new instance following notification setting'),
    (req, res, next) => {
        logger_1.logger.debug('Checking updateNotificationSettingsValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.updateNotificationSettingsValidator = updateNotificationSettingsValidator;
const markAsReadUserNotificationsValidator = [
    express_validator_1.body('ids')
        .optional()
        .custom(misc_1.isNotEmptyIntArray).withMessage('Should have a valid notification ids to mark as read'),
    (req, res, next) => {
        logger_1.logger.debug('Checking markAsReadUserNotificationsValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.markAsReadUserNotificationsValidator = markAsReadUserNotificationsValidator;
