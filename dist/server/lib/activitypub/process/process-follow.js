"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFollowActivity = void 0;
const tslib_1 = require("tslib");
const database_utils_1 = require("../../../helpers/database-utils");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
const actor_1 = require("../../../models/activitypub/actor");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
const send_1 = require("../send");
const notifier_1 = require("../../notifier");
const activitypub_1 = require("../../../helpers/activitypub");
const config_1 = require("../../../initializers/config");
const follow_1 = require("../follow");
const application_1 = require("@server/models/application/application");
function processFollowActivity(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        const activityId = activity.id;
        const objectId = activitypub_1.getAPId(activity.object);
        return database_utils_1.retryTransactionWrapper(processFollow, byActor, activityId, objectId);
    });
}
exports.processFollowActivity = processFollowActivity;
function processFollow(byActor, activityId, targetActorURL) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { actorFollow, created, isFollowingInstance, targetActor } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const targetActor = yield actor_1.ActorModel.loadByUrlAndPopulateAccountAndChannel(targetActorURL, t);
            if (!targetActor)
                throw new Error('Unknown actor');
            if (targetActor.isOwned() === false)
                throw new Error('This is not a local actor.');
            const serverActor = yield application_1.getServerActor();
            const isFollowingInstance = targetActor.id === serverActor.id;
            if (isFollowingInstance && config_1.CONFIG.FOLLOWERS.INSTANCE.ENABLED === false) {
                logger_1.logger.info('Rejecting %s because instance followers are disabled.', targetActor.url);
                yield send_1.sendReject(activityId, byActor, targetActor);
                return { actorFollow: undefined };
            }
            const [actorFollow, created] = yield actor_follow_1.ActorFollowModel.findOrCreate({
                where: {
                    actorId: byActor.id,
                    targetActorId: targetActor.id
                },
                defaults: {
                    actorId: byActor.id,
                    targetActorId: targetActor.id,
                    url: activityId,
                    state: config_1.CONFIG.FOLLOWERS.INSTANCE.MANUAL_APPROVAL
                        ? 'pending'
                        : 'accepted'
                },
                transaction: t
            });
            if (actorFollow.state !== 'accepted' && (isFollowingInstance === false || config_1.CONFIG.FOLLOWERS.INSTANCE.MANUAL_APPROVAL === false)) {
                actorFollow.state = 'accepted';
                yield actorFollow.save({ transaction: t });
            }
            actorFollow.ActorFollower = byActor;
            actorFollow.ActorFollowing = targetActor;
            if (actorFollow.state === 'accepted') {
                yield send_1.sendAccept(actorFollow);
                yield follow_1.autoFollowBackIfNeeded(actorFollow);
            }
            return { actorFollow, created, isFollowingInstance, targetActor };
        }));
        if (!actorFollow)
            return;
        if (created) {
            const follower = yield actor_1.ActorModel.loadFull(byActor.id);
            const actorFollowFull = Object.assign(actorFollow, { ActorFollowing: targetActor, ActorFollower: follower });
            if (isFollowingInstance) {
                notifier_1.Notifier.Instance.notifyOfNewInstanceFollow(actorFollowFull);
            }
            else {
                notifier_1.Notifier.Instance.notifyOfNewUserFollow(actorFollowFull);
            }
        }
        logger_1.logger.info('Actor %s is followed by actor %s.', targetActorURL, byActor.url);
    });
}
