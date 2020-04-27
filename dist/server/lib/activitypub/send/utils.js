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
const logger_1 = require("../../../helpers/logger");
const actor_1 = require("../../../models/activitypub/actor");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
const job_queue_1 = require("../../job-queue");
const audience_1 = require("../audience");
const utils_1 = require("../../../helpers/utils");
const database_utils_1 = require("../../../helpers/database-utils");
function sendVideoRelatedActivity(activityBuilder, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { byActor, video, transaction } = options;
        const actorsInvolvedInVideo = yield audience_1.getActorsInvolvedInVideo(video, transaction);
        if (video.isOwned() === false) {
            const audience = audience_1.getRemoteVideoAudience(video, actorsInvolvedInVideo);
            const activity = activityBuilder(audience);
            return database_utils_1.afterCommitIfTransaction(transaction, () => {
                return unicastTo(activity, byActor, video.VideoChannel.Account.Actor.getSharedInbox());
            });
        }
        const audience = audience_1.getAudienceFromFollowersOf(actorsInvolvedInVideo);
        const activity = activityBuilder(audience);
        const actorsException = [byActor];
        return broadcastToFollowers(activity, byActor, actorsInvolvedInVideo, transaction, actorsException);
    });
}
exports.sendVideoRelatedActivity = sendVideoRelatedActivity;
function forwardVideoRelatedActivity(activity, t, followersException = [], video) {
    return __awaiter(this, void 0, void 0, function* () {
        const additionalActors = yield audience_1.getActorsInvolvedInVideo(video, t);
        const additionalFollowerUrls = additionalActors.map(a => a.followersUrl);
        return forwardActivity(activity, t, followersException, additionalFollowerUrls);
    });
}
exports.forwardVideoRelatedActivity = forwardVideoRelatedActivity;
function forwardActivity(activity, t, followersException = [], additionalFollowerUrls = []) {
    return __awaiter(this, void 0, void 0, function* () {
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
function broadcastToFollowers(data, byActor, toFollowersOf, t, actorsException = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = yield computeFollowerUris(toFollowersOf, actorsException, t);
        return database_utils_1.afterCommitIfTransaction(t, () => broadcastTo(uris, data, byActor));
    });
}
exports.broadcastToFollowers = broadcastToFollowers;
function broadcastToActors(data, byActor, toActors, t, actorsException = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = yield computeUris(toActors, actorsException);
        return database_utils_1.afterCommitIfTransaction(t, () => broadcastTo(uris, data, byActor));
    });
}
exports.broadcastToActors = broadcastToActors;
function broadcastTo(uris, data, byActor) {
    if (uris.length === 0)
        return undefined;
    logger_1.logger.debug('Creating broadcast job.', { uris });
    const payload = {
        uris,
        signatureActorId: byActor.id,
        body: data
    };
    return job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-http-broadcast', payload });
}
function unicastTo(data, byActor, toActorUrl) {
    logger_1.logger.debug('Creating unicast job.', { uri: toActorUrl });
    const payload = {
        uri: toActorUrl,
        signatureActorId: byActor.id,
        body: data
    };
    job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-http-unicast', payload });
}
exports.unicastTo = unicastTo;
function computeFollowerUris(toFollowersOf, actorsException, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const toActorFollowerIds = toFollowersOf.map(a => a.id);
        const result = yield actor_follow_1.ActorFollowModel.listAcceptedFollowerSharedInboxUrls(toActorFollowerIds, t);
        const sharedInboxesException = yield buildSharedInboxesException(actorsException);
        return result.data.filter(sharedInbox => sharedInboxesException.indexOf(sharedInbox) === -1);
    });
}
function computeUris(toActors, actorsException = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverActor = yield utils_1.getServerActor();
        const targetUrls = toActors
            .filter(a => a.id !== serverActor.id)
            .map(a => a.getSharedInbox());
        const toActorSharedInboxesSet = new Set(targetUrls);
        const sharedInboxesException = yield buildSharedInboxesException(actorsException);
        return Array.from(toActorSharedInboxesSet)
            .filter(sharedInbox => sharedInboxesException.indexOf(sharedInbox) === -1);
    });
}
function buildSharedInboxesException(actorsException) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverActor = yield utils_1.getServerActor();
        return actorsException
            .map(f => f.getSharedInbox())
            .concat([serverActor.sharedInboxUrl]);
    });
}
