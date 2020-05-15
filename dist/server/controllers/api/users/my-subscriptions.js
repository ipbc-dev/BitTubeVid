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
const utils_1 = require("../../../helpers/utils");
const constants_1 = require("../../../initializers/constants");
const middlewares_1 = require("../../../middlewares");
const validators_1 = require("../../../middlewares/validators");
const video_1 = require("../../../models/video/video");
const express_utils_1 = require("../../../helpers/express-utils");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
const job_queue_1 = require("../../../lib/job-queue");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
const mySubscriptionsRouter = express.Router();
exports.mySubscriptionsRouter = mySubscriptionsRouter;
mySubscriptionsRouter.get('/me/subscriptions/videos', middlewares_1.authenticate, middlewares_1.paginationValidator, validators_1.videosSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.commonVideosFiltersValidator, middlewares_1.asyncMiddleware(getUserSubscriptionVideos));
mySubscriptionsRouter.get('/me/subscriptions/exist', middlewares_1.authenticate, validators_1.areSubscriptionsExistValidator, middlewares_1.asyncMiddleware(areSubscriptionsExist));
mySubscriptionsRouter.get('/me/subscriptions', middlewares_1.authenticate, middlewares_1.paginationValidator, validators_1.userSubscriptionsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(getUserSubscriptions));
mySubscriptionsRouter.post('/me/subscriptions', middlewares_1.authenticate, middlewares_1.userSubscriptionAddValidator, middlewares_1.asyncMiddleware(addUserSubscription));
mySubscriptionsRouter.get('/me/subscriptions/:uri', middlewares_1.authenticate, middlewares_1.userSubscriptionGetValidator, getUserSubscription);
mySubscriptionsRouter.delete('/me/subscriptions/:uri', middlewares_1.authenticate, middlewares_1.userSubscriptionGetValidator, middlewares_1.asyncRetryTransactionMiddleware(deleteUserSubscription));
function areSubscriptionsExist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = req.query.uris;
        const user = res.locals.oauth.token.User;
        const handles = uris.map(u => {
            let [name, host] = u.split('@');
            if (host === constants_1.WEBSERVER.HOST)
                host = null;
            return { name, host, uri: u };
        });
        const results = yield actor_follow_1.ActorFollowModel.listSubscribedIn(user.Account.Actor.id, handles);
        const existObject = {};
        for (const handle of handles) {
            const obj = results.find(r => {
                const server = r.ActorFollowing.Server;
                return r.ActorFollowing.preferredUsername === handle.name &&
                    ((!server && !handle.host) ||
                        (server.host === handle.host));
            });
            existObject[handle.uri] = obj !== undefined;
        }
        return res.json(existObject);
    });
}
function addUserSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const [name, host] = req.body.uri.split('@');
        const payload = {
            name,
            host,
            followerActorId: user.Account.Actor.id
        };
        job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-follow', payload })
            .catch(err => logger_1.logger.error('Cannot create follow job for subscription %s.', req.body.uri, err));
        return res.status(204).end();
    });
}
function getUserSubscription(req, res) {
    const subscription = res.locals.subscription;
    return res.json(subscription.ActorFollowing.VideoChannel.toFormattedJSON());
}
function deleteUserSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const subscription = res.locals.subscription;
        yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            return subscription.destroy({ transaction: t });
        }));
        return res.type('json').status(204).end();
    });
}
function getUserSubscriptions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const actorId = user.Account.Actor.id;
        const resultList = yield actor_follow_1.ActorFollowModel.listSubscriptionsForApi(actorId, req.query.start, req.query.count, req.query.sort);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function getUserSubscriptionVideos(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const countVideos = express_utils_1.getCountVideos(req);
        const resultList = yield video_1.VideoModel.listForApi({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            includeLocalVideos: false,
            categoryOneOf: req.query.categoryOneOf,
            licenceOneOf: req.query.licenceOneOf,
            languageOneOf: req.query.languageOneOf,
            tagsOneOf: req.query.tagsOneOf,
            tagsAllOf: req.query.tagsAllOf,
            nsfw: express_utils_1.buildNSFWFilter(res, req.query.nsfw),
            filter: req.query.filter,
            withFiles: false,
            followerActorId: user.Account.Actor.id,
            user,
            countVideos
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
