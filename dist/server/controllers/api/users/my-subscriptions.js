"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mySubscriptionsRouter = void 0;
const tslib_1 = require("tslib");
require("multer");
const express = require("express");
const express_utils_1 = require("../../../helpers/express-utils");
const utils_1 = require("../../../helpers/utils");
const constants_1 = require("../../../initializers/constants");
const database_1 = require("../../../initializers/database");
const job_queue_1 = require("../../../lib/job-queue");
const middlewares_1 = require("../../../middlewares");
const validators_1 = require("../../../middlewares/validators");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
const video_1 = require("../../../models/video/video");
const send_1 = require("@server/lib/activitypub/send");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const mySubscriptionsRouter = express.Router();
exports.mySubscriptionsRouter = mySubscriptionsRouter;
mySubscriptionsRouter.get('/me/subscriptions/videos', middlewares_1.authenticate, middlewares_1.paginationValidator, validators_1.videosSortValidator, middlewares_1.setDefaultVideosSort, middlewares_1.setDefaultPagination, middlewares_1.commonVideosFiltersValidator, middlewares_1.asyncMiddleware(getUserSubscriptionVideos));
mySubscriptionsRouter.get('/me/subscriptions/exist', middlewares_1.authenticate, validators_1.areSubscriptionsExistValidator, middlewares_1.asyncMiddleware(areSubscriptionsExist));
mySubscriptionsRouter.get('/me/subscriptions', middlewares_1.authenticate, middlewares_1.paginationValidator, validators_1.userSubscriptionsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, validators_1.userSubscriptionListValidator, middlewares_1.asyncMiddleware(getUserSubscriptions));
mySubscriptionsRouter.post('/me/subscriptions', middlewares_1.authenticate, middlewares_1.userSubscriptionAddValidator, addUserSubscription);
mySubscriptionsRouter.get('/me/subscriptions/:uri', middlewares_1.authenticate, middlewares_1.userSubscriptionGetValidator, getUserSubscription);
mySubscriptionsRouter.delete('/me/subscriptions/:uri', middlewares_1.authenticate, middlewares_1.userSubscriptionGetValidator, middlewares_1.asyncRetryTransactionMiddleware(deleteUserSubscription));
function areSubscriptionsExist(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
    const user = res.locals.oauth.token.User;
    const [name, host] = req.body.uri.split('@');
    const payload = {
        name,
        host,
        assertIsChannel: true,
        followerActorId: user.Account.Actor.id
    };
    job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-follow', payload });
    return res.status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204).end();
}
function getUserSubscription(req, res) {
    const subscription = res.locals.subscription;
    return res.json(subscription.ActorFollowing.VideoChannel.toFormattedJSON());
}
function deleteUserSubscription(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const subscription = res.locals.subscription;
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (subscription.state === 'accepted')
                yield send_1.sendUndoFollow(subscription, t);
            return subscription.destroy({ transaction: t });
        }));
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
function getUserSubscriptions(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const actorId = user.Account.Actor.id;
        const resultList = yield actor_follow_1.ActorFollowModel.listSubscriptionsForApi({
            actorId,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            search: req.query.search
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function getUserSubscriptionVideos(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
