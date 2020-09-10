"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverFollowsRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const constants_1 = require("../../../initializers/constants");
const send_1 = require("../../../lib/activitypub/send");
const middlewares_1 = require("../../../middlewares");
const validators_1 = require("../../../middlewares/validators");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
const job_queue_1 = require("../../../lib/job-queue");
const redundancy_1 = require("../../../lib/redundancy");
const database_1 = require("../../../initializers/database");
const follow_1 = require("../../../lib/activitypub/follow");
const application_1 = require("@server/models/application/application");
const serverFollowsRouter = express.Router();
exports.serverFollowsRouter = serverFollowsRouter;
serverFollowsRouter.get('/following', validators_1.listFollowsValidator, middlewares_1.paginationValidator, validators_1.followingSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listFollowing));
serverFollowsRouter.post('/following', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(2), validators_1.followValidator, middlewares_1.setBodyHostsPort, middlewares_1.asyncMiddleware(followInstance));
serverFollowsRouter.delete('/following/:host', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(2), middlewares_1.asyncMiddleware(validators_1.removeFollowingValidator), middlewares_1.asyncMiddleware(removeFollowing));
serverFollowsRouter.get('/followers', validators_1.listFollowsValidator, middlewares_1.paginationValidator, validators_1.followersSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listFollowers));
serverFollowsRouter.delete('/followers/:nameWithHost', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(2), middlewares_1.asyncMiddleware(validators_1.getFollowerValidator), middlewares_1.asyncMiddleware(removeOrRejectFollower));
serverFollowsRouter.post('/followers/:nameWithHost/reject', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(2), middlewares_1.asyncMiddleware(validators_1.getFollowerValidator), validators_1.acceptOrRejectFollowerValidator, middlewares_1.asyncMiddleware(removeOrRejectFollower));
serverFollowsRouter.post('/followers/:nameWithHost/accept', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(2), middlewares_1.asyncMiddleware(validators_1.getFollowerValidator), validators_1.acceptOrRejectFollowerValidator, middlewares_1.asyncMiddleware(acceptFollower));
function listFollowing(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        const resultList = yield actor_follow_1.ActorFollowModel.listFollowingForApi({
            id: serverActor.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            search: req.query.search,
            actorType: req.query.actorType,
            state: req.query.state
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function listFollowers(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        const resultList = yield actor_follow_1.ActorFollowModel.listFollowersForApi({
            actorId: serverActor.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            search: req.query.search,
            actorType: req.query.actorType,
            state: req.query.state
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function followInstance(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const hosts = req.body.hosts;
        const follower = yield application_1.getServerActor();
        for (const host of hosts) {
            const payload = {
                host,
                name: constants_1.SERVER_ACTOR_NAME,
                followerActorId: follower.id
            };
            job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-follow', payload });
        }
        return res.status(204).end();
    });
}
function removeFollowing(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const follow = res.locals.follow;
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (follow.state === 'accepted')
                yield send_1.sendUndoFollow(follow, t);
            const server = follow.ActorFollowing.Server;
            server.redundancyAllowed = false;
            yield server.save({ transaction: t });
            redundancy_1.removeRedundanciesOfServer(server.id)
                .catch(err => logger_1.logger.error('Cannot remove redundancy of %s.', server.host, err));
            yield follow.destroy({ transaction: t });
        }));
        return res.status(204).end();
    });
}
function removeOrRejectFollower(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const follow = res.locals.follow;
        yield send_1.sendReject(follow.ActorFollower, follow.ActorFollowing);
        yield follow.destroy();
        return res.status(204).end();
    });
}
function acceptFollower(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const follow = res.locals.follow;
        yield send_1.sendAccept(follow);
        follow.state = 'accepted';
        yield follow.save();
        yield follow_1.autoFollowBackIfNeeded(follow);
        return res.status(204).end();
    });
}
