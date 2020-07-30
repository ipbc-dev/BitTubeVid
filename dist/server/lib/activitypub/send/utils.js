"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVideoRelatedActivity = exports.forwardVideoRelatedActivity = exports.broadcastToActors = exports.forwardActivity = exports.unicastTo = exports.broadcastToFollowers = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../../helpers/logger");
const actor_1 = require("../../../models/activitypub/actor");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
const job_queue_1 = require("../../job-queue");
const audience_1 = require("../audience");
const database_utils_1 = require("../../../helpers/database-utils");
const application_1 = require("@server/models/application/application");
function sendVideoRelatedActivity(activityBuilder, options) {
    var _a, _b;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { byActor, video, transaction, contextType } = options;
        const actorsInvolvedInVideo = yield audience_1.getActorsInvolvedInVideo(video, transaction);
        if (video.isOwned() === false) {
            const accountActor = ((_b = (_a = video.VideoChannel) === null || _a === void 0 ? void 0 : _a.Account) === null || _b === void 0 ? void 0 : _b.Actor) || (yield actor_1.ActorModel.loadAccountActorByVideoId(video.id));
            const audience = audience_1.getRemoteVideoAudience(accountActor, actorsInvolvedInVideo);
            const activity = activityBuilder(audience);
            return database_utils_1.afterCommitIfTransaction(transaction, () => {
                return unicastTo(activity, byActor, accountActor.getSharedInbox(), contextType);
            });
        }
        const audience = audience_1.getAudienceFromFollowersOf(actorsInvolvedInVideo);
        const activity = activityBuilder(audience);
        const actorsException = [byActor];
        return broadcastToFollowers(activity, byActor, actorsInvolvedInVideo, transaction, actorsException, contextType);
    });
}
exports.sendVideoRelatedActivity = sendVideoRelatedActivity;
function forwardVideoRelatedActivity(activity, t, followersException, video) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const additionalActors = yield audience_1.getActorsInvolvedInVideo(video, t);
        const additionalFollowerUrls = additionalActors.map(a => a.followersUrl);
        return forwardActivity(activity, t, followersException, additionalFollowerUrls);
    });
}
exports.forwardVideoRelatedActivity = forwardVideoRelatedActivity;
function forwardActivity(activity, t, followersException = [], additionalFollowerUrls = []) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Forwarding activity %s.', activity.id);
        const to = activity.to || [];
        const cc = activity.cc || [];
        const followersUrls = additionalFollowerUrls;
        for (const dest of to.concat(cc)) {
            if (dest.endsWith('/followers')) {
                followersUrls.push(dest);
            }
        }
        const toActorFollowers = yield actor_1.ActorModel.listByFollowersUrls(followersUrls, t);
        const uris = yield computeFollowerUris(toActorFollowers, followersException, t);
        if (uris.length === 0) {
            logger_1.logger.info('0 followers for %s, no forwarding.', toActorFollowers.map(a => a.id).join(', '));
            return undefined;
        }
        logger_1.logger.debug('Creating forwarding job.', { uris });
        const payload = {
            uris,
            body: activity
        };
        return database_utils_1.afterCommitIfTransaction(t, () => job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-http-broadcast', payload }));
    });
}
exports.forwardActivity = forwardActivity;
function broadcastToFollowers(data, byActor, toFollowersOf, t, actorsException = [], contextType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const uris = yield computeFollowerUris(toFollowersOf, actorsException, t);
        return database_utils_1.afterCommitIfTransaction(t, () => broadcastTo(uris, data, byActor, contextType));
    });
}
exports.broadcastToFollowers = broadcastToFollowers;
function broadcastToActors(data, byActor, toActors, t, actorsException = [], contextType) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const uris = yield computeUris(toActors, actorsException);
        return database_utils_1.afterCommitIfTransaction(t, () => broadcastTo(uris, data, byActor, contextType));
    });
}
exports.broadcastToActors = broadcastToActors;
function broadcastTo(uris, data, byActor, contextType) {
    if (uris.length === 0)
        return undefined;
    logger_1.logger.debug('Creating broadcast job.', { uris });
    const payload = {
        uris,
        signatureActorId: byActor.id,
        body: data,
        contextType
    };
    return job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-http-broadcast', payload });
}
function unicastTo(data, byActor, toActorUrl, contextType) {
    logger_1.logger.debug('Creating unicast job.', { uri: toActorUrl });
    const payload = {
        uri: toActorUrl,
        signatureActorId: byActor.id,
        body: data,
        contextType
    };
    job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-http-unicast', payload });
}
exports.unicastTo = unicastTo;
function computeFollowerUris(toFollowersOf, actorsException, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const toActorFollowerIds = toFollowersOf.map(a => a.id);
        const result = yield actor_follow_1.ActorFollowModel.listAcceptedFollowerSharedInboxUrls(toActorFollowerIds, t);
        const sharedInboxesException = yield buildSharedInboxesException(actorsException);
        return result.data.filter(sharedInbox => sharedInboxesException.includes(sharedInbox) === false);
    });
}
function computeUris(toActors, actorsException = []) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        const targetUrls = toActors
            .filter(a => a.id !== serverActor.id)
            .map(a => a.getSharedInbox());
        const toActorSharedInboxesSet = new Set(targetUrls);
        const sharedInboxesException = yield buildSharedInboxesException(actorsException);
        return Array.from(toActorSharedInboxesSet)
            .filter(sharedInbox => sharedInboxesException.includes(sharedInbox) === false);
    });
}
function buildSharedInboxesException(actorsException) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        return actorsException
            .map(f => f.getSharedInbox())
            .concat([serverActor.sharedInboxUrl]);
    });
}
