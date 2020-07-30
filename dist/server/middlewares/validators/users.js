"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCanManageUser = exports.ensureAuthUserOwnsAccountValidator = exports.userAutocompleteValidator = exports.usersVerifyEmailValidator = exports.usersAskSendVerifyEmailValidator = exports.usersResetPasswordValidator = exports.usersAskResetPasswordValidator = exports.usersGetValidator = exports.ensureUserRegistrationAllowedForIP = exports.ensureUserRegistrationAllowed = exports.usersVideoRatingValidator = exports.usersUpdateMeValidator = exports.usersUpdateValidator = exports.usersRemoveValidator = exports.usersBlockingValidator = exports.usersRegisterValidator = exports.deleteMeValidator = exports.usersAddValidator = exports.usersListValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const lodash_1 = require("lodash");
const misc_1 = require("../../helpers/custom-validators/misc");
const users_1 = require("../../helpers/custom-validators/users");
const logger_1 = require("../../helpers/logger");
const signup_1 = require("../../helpers/signup");
const redis_1 = require("../../lib/redis");
const user_1 = require("../../models/account/user");
const utils_1 = require("./utils");
const actor_1 = require("../../models/activitypub/actor");
const actor_2 = require("../../helpers/custom-validators/activitypub/actor");
const video_channels_1 = require("../../helpers/custom-validators/video-channels");
const plugins_1 = require("../../helpers/custom-validators/plugins");
const theme_utils_1 = require("../../lib/plugins/theme-utils");
const middlewares_1 = require("../../helpers/middlewares");
const users_2 = require("../../../shared/models/users");
const hooks_1 = require("@server/lib/plugins/hooks");
const usersListValidator = [
    express_validator_1.query('blocked')
        .optional()
        .isBoolean().withMessage('Should be a valid boolean banned state'),
    (req, res, next) => {
        logger_1.logger.debug('Checking usersList parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.usersListValidator = usersListValidator;
const usersAddValidator = [
    express_validator_1.body('username').custom(users_1.isUserUsernameValid).withMessage('Should have a valid username (lowercase alphanumeric characters)'),
    express_validator_1.body('password').custom(users_1.isUserPasswordValidOrEmpty).withMessage('Should have a valid password'),
    express_validator_1.body('email').isEmail().withMessage('Should have a valid email'),
    express_validator_1.body('videoQuota').custom(users_1.isUserVideoQuotaValid).withMessage('Should have a valid user quota'),
    express_validator_1.body('videoQuotaDaily').custom(users_1.isUserVideoQuotaDailyValid).withMessage('Should have a valid daily user quota'),
    express_validator_1.body('role')
        .customSanitizer(misc_1.toIntOrNull)
        .custom(users_1.isUserRoleValid).withMessage('Should have a valid role'),
    express_validator_1.body('adminFlags').optional().custom(users_1.isUserAdminFlagsValid).withMessage('Should have a valid admin flags'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersAdd parameters', { parameters: lodash_1.omit(req.body, 'password') });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserNameOrEmailDoesNotAlreadyExist(req.body.username, req.body.email, res)))
            return;
        const authUser = res.locals.oauth.token.User;
        if (authUser.role !== users_2.UserRole.ADMINISTRATOR && req.body.role !== users_2.UserRole.USER) {
            return res.status(403)
                .json({ error: 'You can only create users (and not administrators or moderators)' });
        }
        return next();
    })
];
exports.usersAddValidator = usersAddValidator;
const usersRegisterValidator = [
    express_validator_1.body('username').custom(users_1.isUserUsernameValid).withMessage('Should have a valid username'),
    express_validator_1.body('password').custom(users_1.isUserPasswordValid).withMessage('Should have a valid password'),
    express_validator_1.body('email').isEmail().withMessage('Should have a valid email'),
    express_validator_1.body('displayName')
        .optional()
        .custom(users_1.isUserDisplayNameValid).withMessage('Should have a valid display name'),
    express_validator_1.body('channel.name')
        .optional()
        .custom(actor_2.isActorPreferredUsernameValid).withMessage('Should have a valid channel name'),
    express_validator_1.body('channel.displayName')
        .optional()
        .custom(video_channels_1.isVideoChannelNameValid).withMessage('Should have a valid display name'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersRegister parameters', { parameters: lodash_1.omit(req.body, 'password') });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserNameOrEmailDoesNotAlreadyExist(req.body.username, req.body.email, res)))
            return;
        const body = req.body;
        if (body.channel) {
            if (!body.channel.name || !body.channel.displayName) {
                return res.status(400)
                    .json({ error: 'Channel is optional but if you specify it, channel.name and channel.displayName are required.' });
            }
            if (body.channel.name === body.username) {
                return res.status(400)
                    .json({ error: 'Channel name cannot be the same as user username.' });
            }
            const existing = yield actor_1.ActorModel.loadLocalByName(body.channel.name);
            if (existing) {
                return res.status(409)
                    .json({ error: `Channel with name ${body.channel.name} already exists.` });
            }
        }
        return next();
    })
];
exports.usersRegisterValidator = usersRegisterValidator;
const usersRemoveValidator = [
    express_validator_1.param('id').isInt().not().isEmpty().withMessage('Should have a valid id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersRemove parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserIdExist(req.params.id, res)))
            return;
        const user = res.locals.user;
        if (user.username === 'root') {
            return res.status(400)
                .json({ error: 'Cannot remove the root user' });
        }
        return next();
    })
];
exports.usersRemoveValidator = usersRemoveValidator;
const usersBlockingValidator = [
    express_validator_1.param('id').isInt().not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('reason').optional().custom(users_1.isUserBlockedReasonValid).withMessage('Should have a valid blocking reason'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersBlocking parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserIdExist(req.params.id, res)))
            return;
        const user = res.locals.user;
        if (user.username === 'root') {
            return res.status(400)
                .json({ error: 'Cannot block the root user' });
        }
        return next();
    })
];
exports.usersBlockingValidator = usersBlockingValidator;
const deleteMeValidator = [
    (req, res, next) => {
        const user = res.locals.oauth.token.User;
        if (user.username === 'root') {
            return res.status(400)
                .json({ error: 'You cannot delete your root account.' })
                .end();
        }
        return next();
    }
];
exports.deleteMeValidator = deleteMeValidator;
const usersUpdateValidator = [
    express_validator_1.param('id').isInt().not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('password').optional().custom(users_1.isUserPasswordValid).withMessage('Should have a valid password'),
    express_validator_1.body('email').optional().isEmail().withMessage('Should have a valid email attribute'),
    express_validator_1.body('emailVerified').optional().isBoolean().withMessage('Should have a valid email verified attribute'),
    express_validator_1.body('videoQuota').optional().custom(users_1.isUserVideoQuotaValid).withMessage('Should have a valid user quota'),
    express_validator_1.body('videoQuotaDaily').optional().custom(users_1.isUserVideoQuotaDailyValid).withMessage('Should have a valid daily user quota'),
    express_validator_1.body('role')
        .optional()
        .customSanitizer(misc_1.toIntOrNull)
        .custom(users_1.isUserRoleValid).withMessage('Should have a valid role'),
    express_validator_1.body('adminFlags').optional().custom(users_1.isUserAdminFlagsValid).withMessage('Should have a valid admin flags'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersUpdate parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserIdExist(req.params.id, res)))
            return;
        const user = res.locals.user;
        if (user.username === 'root' && req.body.role !== undefined && user.role !== req.body.role) {
            return res.status(400)
                .json({ error: 'Cannot change root role.' });
        }
        return next();
    })
];
exports.usersUpdateValidator = usersUpdateValidator;
const usersUpdateMeValidator = [
    express_validator_1.body('displayName')
        .optional()
        .custom(users_1.isUserDisplayNameValid).withMessage('Should have a valid display name'),
    express_validator_1.body('description')
        .optional()
        .custom(users_1.isUserDescriptionValid).withMessage('Should have a valid description'),
    express_validator_1.body('currentPassword')
        .optional()
        .custom(users_1.isUserPasswordValid).withMessage('Should have a valid current password'),
    express_validator_1.body('password')
        .optional()
        .custom(users_1.isUserPasswordValid).withMessage('Should have a valid password'),
    express_validator_1.body('email')
        .optional()
        .isEmail().withMessage('Should have a valid email attribute'),
    express_validator_1.body('nsfwPolicy')
        .optional()
        .custom(users_1.isUserNSFWPolicyValid).withMessage('Should have a valid display Not Safe For Work policy'),
    express_validator_1.body('autoPlayVideo')
        .optional()
        .custom(users_1.isUserAutoPlayVideoValid).withMessage('Should have a valid automatically plays video attribute'),
    express_validator_1.body('videoLanguages')
        .optional()
        .custom(users_1.isUserVideoLanguages).withMessage('Should have a valid video languages attribute'),
    express_validator_1.body('videosHistoryEnabled')
        .optional()
        .custom(users_1.isUserVideosHistoryEnabledValid).withMessage('Should have a valid videos history enabled attribute'),
    express_validator_1.body('theme')
        .optional()
        .custom(v => plugins_1.isThemeNameValid(v) && theme_utils_1.isThemeRegistered(v)).withMessage('Should have a valid theme'),
    express_validator_1.body('noInstanceConfigWarningModal')
        .optional()
        .custom(v => users_1.isNoInstanceConfigWarningModal(v)).withMessage('Should have a valid noInstanceConfigWarningModal boolean'),
    express_validator_1.body('noWelcomeModal')
        .optional()
        .custom(v => users_1.isNoWelcomeModal(v)).withMessage('Should have a valid noWelcomeModal boolean'),
    express_validator_1.body('autoPlayNextVideo')
        .optional()
        .custom(v => users_1.isUserAutoPlayNextVideoValid(v)).withMessage('Should have a valid autoPlayNextVideo boolean'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersUpdateMe parameters', { parameters: lodash_1.omit(req.body, 'password') });
        const user = res.locals.oauth.token.User;
        if (req.body.password || req.body.email) {
            if (user.pluginAuth !== null) {
                return res.status(400)
                    .json({ error: 'You cannot update your email or password that is associated with an external auth system.' });
            }
            if (!req.body.currentPassword) {
                return res.status(400)
                    .json({ error: 'currentPassword parameter is missing.' });
            }
            if ((yield user.isPasswordMatch(req.body.currentPassword)) !== true) {
                return res.status(401)
                    .json({ error: 'currentPassword is invalid.' });
            }
        }
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    })
];
exports.usersUpdateMeValidator = usersUpdateMeValidator;
const usersGetValidator = [
    express_validator_1.param('id').isInt().not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.query('withStats').optional().isBoolean().withMessage('Should have a valid stats flag'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersGet parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserIdExist(req.params.id, res, req.query.withStats)))
            return;
        return next();
    })
];
exports.usersGetValidator = usersGetValidator;
const usersVideoRatingValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid video id'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersVideoRating parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res, 'id')))
            return;
        return next();
    })
];
exports.usersVideoRatingValidator = usersVideoRatingValidator;
const ensureUserRegistrationAllowed = [
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const allowedParams = {
            body: req.body,
            ip: req.ip
        };
        const allowedResult = yield hooks_1.Hooks.wrapPromiseFun(signup_1.isSignupAllowed, allowedParams, 'filter:api.user.signup.allowed.result');
        if (allowedResult.allowed === false) {
            return res.status(403)
                .json({ error: allowedResult.errorMessage || 'User registration is not enabled or user limit is reached.' });
        }
        return next();
    })
];
exports.ensureUserRegistrationAllowed = ensureUserRegistrationAllowed;
const ensureUserRegistrationAllowedForIP = [
    (req, res, next) => {
        const allowed = signup_1.isSignupAllowedForCurrentIP(req.ip);
        if (allowed === false) {
            return res.status(403)
                .json({ error: 'You are not on a network authorized for registration.' });
        }
        return next();
    }
];
exports.ensureUserRegistrationAllowedForIP = ensureUserRegistrationAllowedForIP;
const usersAskResetPasswordValidator = [
    express_validator_1.body('email').isEmail().not().isEmpty().withMessage('Should have a valid email'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersAskResetPassword parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const exists = yield checkUserEmailExist(req.body.email, res, false);
        if (!exists) {
            logger_1.logger.debug('User with email %s does not exist (asking reset password).', req.body.email);
            return res.status(204).end();
        }
        return next();
    })
];
exports.usersAskResetPasswordValidator = usersAskResetPasswordValidator;
const usersResetPasswordValidator = [
    express_validator_1.param('id').isInt().not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('verificationString').not().isEmpty().withMessage('Should have a valid verification string'),
    express_validator_1.body('password').custom(users_1.isUserPasswordValid).withMessage('Should have a valid password'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersResetPassword parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserIdExist(req.params.id, res)))
            return;
        const user = res.locals.user;
        const redisVerificationString = yield redis_1.Redis.Instance.getResetPasswordLink(user.id);
        if (redisVerificationString !== req.body.verificationString) {
            return res
                .status(403)
                .json({ error: 'Invalid verification string.' });
        }
        return next();
    })
];
exports.usersResetPasswordValidator = usersResetPasswordValidator;
const usersAskSendVerifyEmailValidator = [
    express_validator_1.body('email').isEmail().not().isEmpty().withMessage('Should have a valid email'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking askUsersSendVerifyEmail parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const exists = yield checkUserEmailExist(req.body.email, res, false);
        if (!exists) {
            logger_1.logger.debug('User with email %s does not exist (asking verify email).', req.body.email);
            return res.status(204).end();
        }
        return next();
    })
];
exports.usersAskSendVerifyEmailValidator = usersAskSendVerifyEmailValidator;
const usersVerifyEmailValidator = [
    express_validator_1.param('id')
        .isInt().not().isEmpty().withMessage('Should have a valid id'),
    express_validator_1.body('verificationString')
        .not().isEmpty().withMessage('Should have a valid verification string'),
    express_validator_1.body('isPendingEmail')
        .optional()
        .customSanitizer(misc_1.toBooleanOrNull),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking usersVerifyEmail parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield checkUserIdExist(req.params.id, res)))
            return;
        const user = res.locals.user;
        const redisVerificationString = yield redis_1.Redis.Instance.getVerifyEmailLink(user.id);
        if (redisVerificationString !== req.body.verificationString) {
            return res
                .status(403)
                .json({ error: 'Invalid verification string.' });
        }
        return next();
    })
];
exports.usersVerifyEmailValidator = usersVerifyEmailValidator;
const userAutocompleteValidator = [
    express_validator_1.param('search').isString().not().isEmpty().withMessage('Should have a search parameter')
];
exports.userAutocompleteValidator = userAutocompleteValidator;
const ensureAuthUserOwnsAccountValidator = [
    (req, res, next) => {
        const user = res.locals.oauth.token.User;
        if (res.locals.account.id !== user.Account.id) {
            return res.status(403)
                .json({ error: 'Only owner can access ratings list.' });
        }
        return next();
    }
];
exports.ensureAuthUserOwnsAccountValidator = ensureAuthUserOwnsAccountValidator;
const ensureCanManageUser = [
    (req, res, next) => {
        const authUser = res.locals.oauth.token.User;
        const onUser = res.locals.user;
        if (authUser.role === users_2.UserRole.ADMINISTRATOR)
            return next();
        if (authUser.role === users_2.UserRole.MODERATOR && onUser.role === users_2.UserRole.USER)
            return next();
        return res.status(403)
            .json({ error: 'A moderator can only manager users.' });
    }
];
exports.ensureCanManageUser = ensureCanManageUser;
function checkUserIdExist(idArg, res, withStats = false) {
    const id = parseInt(idArg + '', 10);
    return checkUserExist(() => user_1.UserModel.loadById(id, withStats), res);
}
function checkUserEmailExist(email, res, abortResponse = true) {
    return checkUserExist(() => user_1.UserModel.loadByEmail(email), res, abortResponse);
}
function checkUserNameOrEmailDoesNotAlreadyExist(username, email, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = yield user_1.UserModel.loadByUsernameOrEmail(username, email);
        if (user) {
            res.status(409)
                .json({ error: 'User with this username or email already exists.' });
            return false;
        }
        const actor = yield actor_1.ActorModel.loadLocalByName(username);
        if (actor) {
            res.status(409)
                .json({ error: 'Another actor (account/channel) with this name on this instance already exists or has already existed.' });
            return false;
        }
        return true;
    });
}
function checkUserExist(finder, res, abortResponse = true) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = yield finder();
        if (!user) {
            if (abortResponse === true) {
                res.status(404)
                    .json({ error: 'User not found' });
            }
            return false;
        }
        res.locals.user = user;
        return true;
    });
}
