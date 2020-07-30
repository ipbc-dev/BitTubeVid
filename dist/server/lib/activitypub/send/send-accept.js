"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAccept = void 0;
const url_1 = require("../url");
const utils_1 = require("./utils");
const send_follow_1 = require("./send-follow");
const logger_1 = require("../../../helpers/logger");
function sendAccept(actorFollow) {
    const follower = actorFollow.ActorFollower;
    const me = actorFollow.ActorFollowing;
    if (!follower.serverId) {
        logger_1.logger.warn('Do not sending accept to local follower.');
        return;
    }
    logger_1.logger.info('Creating job to accept follower %s.', follower.url);
    const followUrl = url_1.getActorFollowActivityPubUrl(follower, me);
    const followData = send_follow_1.buildFollowActivity(followUrl, follower, me);
    const url = url_1.getActorFollowAcceptActivityPubUrl(actorFollow);
    const data = buildAcceptActivity(url, me, followData);
    return utils_1.unicastTo(data, me, follower.inboxUrl);
}
exports.sendAccept = sendAccept;
function buildAcceptActivity(url, byActor, followActivityData) {
    return {
        type: 'Accept',
        id: url,
        actor: byActor.url,
        object: followActivityData
    };
}
