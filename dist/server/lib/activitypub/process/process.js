"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processActivities = void 0;
const tslib_1 = require("tslib");
const activitypub_1 = require("../../../helpers/activitypub");
const logger_1 = require("../../../helpers/logger");
const process_accept_1 = require("./process-accept");
const process_announce_1 = require("./process-announce");
const process_create_1 = require("./process-create");
const process_delete_1 = require("./process-delete");
const process_follow_1 = require("./process-follow");
const process_like_1 = require("./process-like");
const process_reject_1 = require("./process-reject");
const process_undo_1 = require("./process-undo");
const process_update_1 = require("./process-update");
const actor_1 = require("../actor");
const process_dislike_1 = require("./process-dislike");
const process_flag_1 = require("./process-flag");
const process_view_1 = require("./process-view");
const stat_manager_1 = require("@server/lib/stat-manager");
const processActivity = {
    Create: process_create_1.processCreateActivity,
    Update: process_update_1.processUpdateActivity,
    Delete: process_delete_1.processDeleteActivity,
    Follow: process_follow_1.processFollowActivity,
    Accept: process_accept_1.processAcceptActivity,
    Reject: process_reject_1.processRejectActivity,
    Announce: process_announce_1.processAnnounceActivity,
    Undo: process_undo_1.processUndoActivity,
    Like: process_like_1.processLikeActivity,
    Dislike: process_dislike_1.processDislikeActivity,
    Flag: process_flag_1.processFlagActivity,
    View: process_view_1.processViewActivity
};
function processActivities(activities, options = {}) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { outboxUrl, signatureActor, inboxActor, fromFetch = false } = options;
        const actorsCache = {};
        for (const activity of activities) {
            if (!signatureActor && ['Create', 'Announce', 'Like'].includes(activity.type) === false) {
                logger_1.logger.error('Cannot process activity %s (type: %s) without the actor signature.', activity.id, activity.type);
                continue;
            }
            const actorUrl = activitypub_1.getAPId(activity.actor);
            if (signatureActor && actorUrl !== signatureActor.url) {
                logger_1.logger.warn('Signature mismatch between %s and %s, skipping.', actorUrl, signatureActor.url);
                continue;
            }
            if (outboxUrl && activitypub_1.checkUrlsSameHost(outboxUrl, actorUrl) !== true) {
                logger_1.logger.warn('Host mismatch between outbox URL %s and actor URL %s, skipping.', outboxUrl, actorUrl);
                continue;
            }
            const byActor = signatureActor || actorsCache[actorUrl] || (yield actor_1.getOrCreateActorAndServerAndModel(actorUrl));
            actorsCache[actorUrl] = byActor;
            const activityProcessor = processActivity[activity.type];
            if (activityProcessor === undefined) {
                logger_1.logger.warn('Unknown activity type %s.', activity.type, { activityId: activity.id });
                continue;
            }
            try {
                yield activityProcessor({ activity, byActor, inboxActor, fromFetch });
                stat_manager_1.StatsManager.Instance.addInboxProcessedSuccess(activity.type);
            }
            catch (err) {
                logger_1.logger.warn('Cannot process activity %s.', activity.type, { err });
                stat_manager_1.StatsManager.Instance.addInboxProcessedError(activity.type);
            }
        }
    });
}
exports.processActivities = processActivities;
