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
const express_validator_1 = require("express-validator");
const core_utils_1 = require("../../helpers/core-utils");
const servers_1 = require("../../helpers/custom-validators/servers");
const logger_1 = require("../../helpers/logger");
const constants_1 = require("../../initializers/constants");
const actor_follow_1 = require("../../models/activitypub/actor-follow");
const utils_1 = require("./utils");
const actor_1 = require("../../models/activitypub/actor");
const webfinger_1 = require("../../helpers/webfinger");
const actor_2 = require("../../helpers/custom-validators/activitypub/actor");
const follows_1 = require("@server/helpers/custom-validators/follows");
const application_1 = require("@server/models/application/application");
const listFollowsValidator = [
    express_validator_1.query('state')
        .optional()
        .custom(follows_1.isFollowStateValid).withMessage('Should have a valid follow state'),
    express_validator_1.query('actorType')
        .optional()
        .custom(actor_2.isActorTypeValid).withMessage('Should have a valid actor type'),
    (req, res, next) => {
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.listFollowsValidator = listFollowsValidator;
const followValidator = [
    express_validator_1.body('hosts').custom(servers_1.isEachUniqueHostValid).withMessage('Should have an array of unique hosts'),
    (req, res, next) => {
        if (core_utils_1.isTestInstance() === false && constants_1.WEBSERVER.SCHEME === 'http') {
            return res.status(500)
                .json({
                error: 'Cannot follow on a non HTTPS web server.'
            })
                .end();
        }
        logger_1.logger.debug('Checking follow parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.followValidator = followValidator;
const removeFollowingValidator = [
    express_validator_1.param('host').custom(servers_1.isHostValid).withMessage('Should have a valid host'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking unfollowing parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const serverActor = yield application_1.getServerActor();
        const follow = yield actor_follow_1.ActorFollowModel.loadByActorAndTargetNameAndHostForAPI(serverActor.id, constants_1.SERVER_ACTOR_NAME, req.params.host);
        if (!follow) {
            return res
                .status(404)
                .json({
                error: `Following ${req.params.host} not found.`
            })
                .end();
        }
        res.locals.follow = follow;
        return next();
    })
];
exports.removeFollowingValidator = removeFollowingValidator;
const getFollowerValidator = [
    express_validator_1.param('nameWithHost').custom(actor_2.isValidActorHandle).withMessage('Should have a valid nameWithHost'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking get follower parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        let follow;
        try {
            const actorUrl = yield webfinger_1.loadActorUrlOrGetFromWebfinger(req.params.nameWithHost);
            const actor = yield actor_1.ActorModel.loadByUrl(actorUrl);
            const serverActor = yield application_1.getServerActor();
            follow = yield actor_follow_1.ActorFollowModel.loadByActorAndTarget(actor.id, serverActor.id);
        }
        catch (err) {
            logger_1.logger.warn('Cannot get actor from handle.', { handle: req.params.nameWithHost, err });
        }
        if (!follow) {
            return res
                .status(404)
                .json({
                error: `Follower ${req.params.nameWithHost} not found.`
            })
                .end();
        }
        res.locals.follow = follow;
        return next();
    })
];
exports.getFollowerValidator = getFollowerValidator;
const acceptOrRejectFollowerValidator = [
    (req, res, next) => {
        logger_1.logger.debug('Checking accept/reject follower parameters', { parameters: req.params });
        const follow = res.locals.follow;
        if (follow.state !== 'pending') {
            return res.status(400).json({ error: 'Follow is not in pending state.' }).end();
        }
        return next();
    }
];
exports.acceptOrRejectFollowerValidator = acceptOrRejectFollowerValidator;
