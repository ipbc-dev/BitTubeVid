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
const express = require("express");
require("multer");
const middlewares_1 = require("../../../middlewares");
const utils_1 = require("../../../helpers/utils");
const user_notification_1 = require("../../../models/account/user-notification");
const me_1 = require("./me");
const user_notifications_1 = require("../../../middlewares/validators/user-notifications");
const user_notification_setting_1 = require("../../../models/account/user-notification-setting");
const myNotificationsRouter = express.Router();
exports.myNotificationsRouter = myNotificationsRouter;
me_1.meRouter.put('/me/notification-settings', middlewares_1.authenticate, user_notifications_1.updateNotificationSettingsValidator, middlewares_1.asyncRetryTransactionMiddleware(updateNotificationSettings));
myNotificationsRouter.get('/me/notifications', middlewares_1.authenticate, middlewares_1.paginationValidator, middlewares_1.userNotificationsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, user_notifications_1.listUserNotificationsValidator, middlewares_1.asyncMiddleware(listUserNotifications));
myNotificationsRouter.post('/me/notifications/read', middlewares_1.authenticate, user_notifications_1.markAsReadUserNotificationsValidator, middlewares_1.asyncMiddleware(markAsReadUserNotifications));
myNotificationsRouter.post('/me/notifications/read-all', middlewares_1.authenticate, middlewares_1.asyncMiddleware(markAsReadAllUserNotifications));
function updateNotificationSettings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const body = req.body;
        const query = {
            where: {
                userId: user.id
            }
        };
        const values = {
            newVideoFromSubscription: body.newVideoFromSubscription,
            newCommentOnMyVideo: body.newCommentOnMyVideo,
            videoAbuseAsModerator: body.videoAbuseAsModerator,
            videoAutoBlacklistAsModerator: body.videoAutoBlacklistAsModerator,
            blacklistOnMyVideo: body.blacklistOnMyVideo,
            myVideoPublished: body.myVideoPublished,
            myVideoImportFinished: body.myVideoImportFinished,
            newFollow: body.newFollow,
            newUserRegistration: body.newUserRegistration,
            commentMention: body.commentMention,
            newInstanceFollower: body.newInstanceFollower,
            autoInstanceFollowing: body.autoInstanceFollowing
        };
        yield user_notification_setting_1.UserNotificationSettingModel.update(values, query);
        return res.status(204).end();
    });
}
function listUserNotifications(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const resultList = yield user_notification_1.UserNotificationModel.listForApi(user.id, req.query.start, req.query.count, req.query.sort, req.query.unread);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function markAsReadUserNotifications(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        yield user_notification_1.UserNotificationModel.markAsRead(user.id, req.body.ids);
        return res.status(204).end();
    });
}
function markAsReadAllUserNotifications(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        yield user_notification_1.UserNotificationModel.markAllAsRead(user.id);
        return res.status(204).end();
    });
}
