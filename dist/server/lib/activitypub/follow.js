"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoFollowBackIfNeeded = void 0;
const tslib_1 = require("tslib");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const job_queue_1 = require("../job-queue");
const logger_1 = require("../../helpers/logger");
const server_1 = require("../../models/server/server");
const application_1 = require("@server/models/application/application");
function autoFollowBackIfNeeded(actorFollow) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_BACK.ENABLED)
            return;
        const follower = actorFollow.ActorFollower;
        if (follower.type === 'Application' && follower.preferredUsername === constants_1.SERVER_ACTOR_NAME) {
            logger_1.logger.info('Auto follow back %s.', follower.url);
            const me = yield application_1.getServerActor();
            const server = yield server_1.ServerModel.load(follower.serverId);
            const host = server.host;
            const payload = {
                host,
                name: constants_1.SERVER_ACTOR_NAME,
                followerActorId: me.id,
                isAutoFollow: true
            };
            job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-follow', payload });
        }
    });
}
exports.autoFollowBackIfNeeded = autoFollowBackIfNeeded;
