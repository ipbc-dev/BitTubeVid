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
const RateLimit = require("express-rate-limit");
const shared_1 = require("../../../../shared");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const constants_1 = require("../../../initializers/constants");
const emailer_1 = require("../../../lib/emailer");
const redis_1 = require("../../../lib/redis");
const user_1 = require("../../../lib/user");
const middlewares_1 = require("../../../middlewares");
const validators_1 = require("../../../middlewares/validators");
const user_2 = require("../../../models/account/user");
const audit_logger_1 = require("../../../helpers/audit-logger");
const me_1 = require("./me");
const firebase_1 = require("./firebase");
const oauth_model_1 = require("../../../lib/oauth-model");
const my_blocklist_1 = require("./my-blocklist");
const my_video_playlists_1 = require("./my-video-playlists");
const my_history_1 = require("./my-history");
const my_notifications_1 = require("./my-notifications");
const notifier_1 = require("../../../lib/notifier");
const my_subscriptions_1 = require("./my-subscriptions");
const config_1 = require("../../../initializers/config");
const database_1 = require("../../../initializers/database");
const user_flag_model_1 = require("../../../../shared/models/users/user-flag.model");
const hooks_1 = require("@server/lib/plugins/hooks");
const auditLogger = audit_logger_1.auditLoggerFactory('users');
const loginRateLimiter = RateLimit({
    windowMs: config_1.CONFIG.RATES_LIMIT.LOGIN.WINDOW_MS,
    max: config_1.CONFIG.RATES_LIMIT.LOGIN.MAX
});
const signupRateLimiter = RateLimit({
    windowMs: config_1.CONFIG.RATES_LIMIT.SIGNUP.WINDOW_MS,
    max: config_1.CONFIG.RATES_LIMIT.SIGNUP.MAX,
    skipFailedRequests: true
});
const askSendEmailLimiter = new RateLimit({
    windowMs: config_1.CONFIG.RATES_LIMIT.ASK_SEND_EMAIL.WINDOW_MS,
    max: config_1.CONFIG.RATES_LIMIT.ASK_SEND_EMAIL.MAX
});
const usersRouter = express.Router();
exports.usersRouter = usersRouter;
usersRouter.use('/', my_notifications_1.myNotificationsRouter);
usersRouter.use('/', my_subscriptions_1.mySubscriptionsRouter);
usersRouter.use('/', my_blocklist_1.myBlocklistRouter);
usersRouter.use('/', my_history_1.myVideosHistoryRouter);
usersRouter.use('/', my_video_playlists_1.myVideoPlaylistsRouter);
usersRouter.use('/', me_1.meRouter);
usersRouter.use('/', firebase_1.firebaseRouter);
usersRouter.get('/autocomplete', middlewares_1.userAutocompleteValidator, middlewares_1.asyncMiddleware(autocompleteUsers));
usersRouter.get('/', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_USERS), middlewares_1.paginationValidator, middlewares_1.usersSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listUsers));
usersRouter.post('/:id/block', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_USERS), middlewares_1.asyncMiddleware(validators_1.usersBlockingValidator), validators_1.ensureCanManageUser, middlewares_1.asyncMiddleware(blockUser));
usersRouter.post('/:id/unblock', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_USERS), middlewares_1.asyncMiddleware(validators_1.usersBlockingValidator), validators_1.ensureCanManageUser, middlewares_1.asyncMiddleware(unblockUser));
usersRouter.get('/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_USERS), middlewares_1.asyncMiddleware(middlewares_1.usersGetValidator), getUser);
usersRouter.post('/', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_USERS), middlewares_1.asyncMiddleware(middlewares_1.usersAddValidator), middlewares_1.asyncRetryTransactionMiddleware(createUser));
usersRouter.post('/register', signupRateLimiter, middlewares_1.asyncMiddleware(middlewares_1.ensureUserRegistrationAllowed), middlewares_1.ensureUserRegistrationAllowedForIP, middlewares_1.asyncMiddleware(middlewares_1.usersRegisterValidator), middlewares_1.asyncRetryTransactionMiddleware(registerUser));
usersRouter.put('/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_USERS), middlewares_1.asyncMiddleware(middlewares_1.usersUpdateValidator), validators_1.ensureCanManageUser, middlewares_1.asyncMiddleware(updateUser));
usersRouter.delete('/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_USERS), middlewares_1.asyncMiddleware(middlewares_1.usersRemoveValidator), validators_1.ensureCanManageUser, middlewares_1.asyncMiddleware(removeUser));
usersRouter.post('/ask-reset-password', middlewares_1.asyncMiddleware(validators_1.usersAskResetPasswordValidator), middlewares_1.asyncMiddleware(askResetUserPassword));
usersRouter.post('/:id/reset-password', middlewares_1.asyncMiddleware(validators_1.usersResetPasswordValidator), middlewares_1.asyncMiddleware(resetUserPassword));
usersRouter.post('/ask-send-verify-email', askSendEmailLimiter, middlewares_1.asyncMiddleware(validators_1.usersAskSendVerifyEmailValidator), middlewares_1.asyncMiddleware(reSendVerifyUserEmail));
usersRouter.post('/:id/verify-email', middlewares_1.asyncMiddleware(validators_1.usersVerifyEmailValidator), middlewares_1.asyncMiddleware(verifyUserEmail));
usersRouter.post('/token', loginRateLimiter, middlewares_1.token, tokenSuccess);
function createUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const userToCreate = new user_2.UserModel({
            username: body.username,
            password: body.password,
            email: body.email,
            nsfwPolicy: config_1.CONFIG.INSTANCE.DEFAULT_NSFW_POLICY,
            autoPlayVideo: true,
            role: body.role,
            videoQuota: body.videoQuota,
            videoQuotaDaily: body.videoQuotaDaily,
            adminFlags: body.adminFlags || user_flag_model_1.UserAdminFlag.NONE
        });
        const { user, account, videoChannel } = yield user_1.createUserAccountAndChannelAndPlaylist({ userToCreate: userToCreate });
        auditLogger.create(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.UserAuditView(user.toFormattedJSON()));
        logger_1.logger.info('User %s with its channel and account created.', body.username);
        hooks_1.Hooks.runAction('action:api.user.created', { body, user, account, videoChannel });
        return res.json({
            user: {
                id: user.id,
                account: {
                    id: account.id
                }
            }
        }).end();
    });
}
function registerUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const userToCreate = new user_2.UserModel({
            username: body.username,
            password: body.password,
            email: body.email,
            nsfwPolicy: config_1.CONFIG.INSTANCE.DEFAULT_NSFW_POLICY,
            autoPlayVideo: true,
            role: shared_1.UserRole.USER,
            videoQuota: config_1.CONFIG.USER.VIDEO_QUOTA,
            videoQuotaDaily: config_1.CONFIG.USER.VIDEO_QUOTA_DAILY,
            emailVerified: config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION ? false : null
        });
        const { user, account, videoChannel } = yield user_1.createUserAccountAndChannelAndPlaylist({
            userToCreate: userToCreate,
            userDisplayName: body.displayName || undefined,
            channelNames: body.channel
        });
        auditLogger.create(body.username, new audit_logger_1.UserAuditView(user.toFormattedJSON()));
        logger_1.logger.info('User %s with its channel and account registered.', body.username);
        if (config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION) {
            yield user_1.sendVerifyUserEmail(user);
        }
        notifier_1.Notifier.Instance.notifyOnNewUserRegistration(user);
        hooks_1.Hooks.runAction('action:api.user.registered', { body, user, account, videoChannel });
        return res.type('json').status(204).end();
    });
}
function unblockUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        yield changeUserBlock(res, user, false);
        hooks_1.Hooks.runAction('action:api.user.unblocked', { user });
        return res.status(204).end();
    });
}
function blockUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const reason = req.body.reason;
        yield changeUserBlock(res, user, true, reason);
        hooks_1.Hooks.runAction('action:api.user.blocked', { user });
        return res.status(204).end();
    });
}
function getUser(req, res) {
    return res.json(res.locals.user.toFormattedJSON({ withAdminFlags: true }));
}
function autocompleteUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const resultList = yield user_2.UserModel.autoComplete(req.query.search);
        return res.json(resultList);
    });
}
function listUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const resultList = yield user_2.UserModel.listForApi(req.query.start, req.query.count, req.query.sort, req.query.search);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total, { withAdminFlags: true }));
    });
}
function removeUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        yield user.destroy();
        auditLogger.delete(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.UserAuditView(user.toFormattedJSON()));
        hooks_1.Hooks.runAction('action:api.user.deleted', { user });
        return res.sendStatus(204);
    });
}
function updateUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const userToUpdate = res.locals.user;
        const oldUserAuditView = new audit_logger_1.UserAuditView(userToUpdate.toFormattedJSON());
        const roleChanged = body.role !== undefined && body.role !== userToUpdate.role;
        if (body.password !== undefined)
            userToUpdate.password = body.password;
        if (body.email !== undefined)
            userToUpdate.email = body.email;
        if (body.emailVerified !== undefined)
            userToUpdate.emailVerified = body.emailVerified;
        if (body.videoQuota !== undefined)
            userToUpdate.videoQuota = body.videoQuota;
        if (body.videoQuotaDaily !== undefined)
            userToUpdate.videoQuotaDaily = body.videoQuotaDaily;
        if (body.role !== undefined)
            userToUpdate.role = body.role;
        if (body.adminFlags !== undefined)
            userToUpdate.adminFlags = body.adminFlags;
        const user = yield userToUpdate.save();
        if (roleChanged || body.password !== undefined)
            yield oauth_model_1.deleteUserToken(userToUpdate.id);
        auditLogger.update(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.UserAuditView(user.toFormattedJSON()), oldUserAuditView);
        hooks_1.Hooks.runAction('action:api.user.updated', { user });
        return res.sendStatus(204);
    });
}
function askResetUserPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        const verificationString = yield redis_1.Redis.Instance.setResetPasswordVerificationString(user.id);
        const url = constants_1.WEBSERVER.URL + '/reset-password?userId=' + user.id + '&verificationString=' + verificationString;
        yield emailer_1.Emailer.Instance.addPasswordResetEmailJob(user.email, url);
        return res.status(204).end();
    });
}
function resetUserPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        user.password = req.body.password;
        yield user.save();
        return res.status(204).end();
    });
}
function reSendVerifyUserEmail(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        yield user_1.sendVerifyUserEmail(user);
        return res.status(204).end();
    });
}
function verifyUserEmail(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.user;
        user.emailVerified = true;
        if (req.body.isPendingEmail === true) {
            user.email = user.pendingEmail;
            user.pendingEmail = null;
        }
        yield user.save();
        return res.status(204).end();
    });
}
function tokenSuccess(req) {
    const username = req.body.username;
    hooks_1.Hooks.runAction('action:api.user.oauth2-got-token', { username, ip: req.ip });
}
function changeUserBlock(res, user, block, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const oldUserAuditView = new audit_logger_1.UserAuditView(user.toFormattedJSON());
        user.blocked = block;
        user.blockedReason = reason || null;
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            yield oauth_model_1.deleteUserToken(user.id, t);
            yield user.save({ transaction: t });
        }));
        yield emailer_1.Emailer.Instance.addUserBlockJob(user, block, reason);
        auditLogger.update(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.UserAuditView(user.toFormattedJSON()), oldUserAuditView);
    });
}
