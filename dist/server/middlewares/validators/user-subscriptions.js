"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSubscriptionGetValidator = exports.userSubscriptionAddValidator = exports.areSubscriptionsExistValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const actor_follow_1 = require("../../models/activitypub/actor-follow");
const actor_1 = require("../../helpers/custom-validators/activitypub/actor");
const misc_1 = require("../../helpers/custom-validators/misc");
const constants_1 = require("../../initializers/constants");
const userSubscriptionAddValidator = [
    express_validator_1.body('uri').custom(actor_1.isValidActorHandle).withMessage('Should have a valid URI to follow (username@domain)'),
    (req, res, next) => {
        logger_1.logger.debug('Checking userSubscriptionAddValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.userSubscriptionAddValidator = userSubscriptionAddValidator;
const areSubscriptionsExistValidator = [
    express_validator_1.query('uris')
        .customSanitizer(misc_1.toArray)
        .custom(actor_1.areValidActorHandles).withMessage('Should have a valid uri array'),
    (req, res, next) => {
        logger_1.logger.debug('Checking areSubscriptionsExistValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.areSubscriptionsExistValidator = areSubscriptionsExistValidator;
const userSubscriptionGetValidator = [
    express_validator_1.param('uri').custom(actor_1.isValidActorHandle).withMessage('Should have a valid URI to unfollow'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking userSubscriptionGetValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        let [name, host] = req.params.uri.split('@');
        if (host === constants_1.WEBSERVER.HOST)
            host = null;
        const user = res.locals.oauth.token.User;
        const subscription = yield actor_follow_1.ActorFollowModel.loadByActorAndTargetNameAndHostForAPI(user.Account.Actor.id, name, host);
        if (!subscription || !subscription.ActorFollowing.VideoChannel) {
            return res
                .status(404)
                .json({
                error: `Subscription ${req.params.uri} not found.`
            });
        }
        res.locals.subscription = subscription;
        return next();
    })
];
exports.userSubscriptionGetValidator = userSubscriptionGetValidator;
