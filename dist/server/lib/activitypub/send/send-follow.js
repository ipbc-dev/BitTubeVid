"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFollowActivity = exports.sendFollow = void 0;
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("./utils");
function sendFollow(actorFollow, t) {
    const me = actorFollow.ActorFollower;
    const following = actorFollow.ActorFollowing;
    if (!following.serverId)
        return;
    logger_1.logger.info('Creating job to send follow request to %s.', following.url);
    const data = buildFollowActivity(actorFollow.url, me, following);
    t.afterCommit(() => utils_1.unicastTo(data, me, following.inboxUrl));
}
exports.sendFollow = sendFollow;
function buildFollowActivity(url, byActor, targetActor) {
    return {
        type: 'Follow',
        id: url,
        actor: byActor.url,
        object: targetActor.url
    };
}
exports.buildFollowActivity = buildFollowActivity;
