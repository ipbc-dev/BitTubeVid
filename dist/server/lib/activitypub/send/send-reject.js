"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReject = void 0;
const logger_1 = require("../../../helpers/logger");
const url_1 = require("../url");
const send_follow_1 = require("./send-follow");
const utils_1 = require("./utils");
function sendReject(followUrl, follower, following) {
    if (!follower.serverId) {
        logger_1.logger.warn('Do not sending reject to local follower.');
        return;
    }
    logger_1.logger.info('Creating job to reject follower %s.', follower.url);
    const followData = send_follow_1.buildFollowActivity(followUrl, follower, following);
    const url = url_1.getLocalActorFollowRejectActivityPubUrl(follower, following);
    const data = buildRejectActivity(url, following, followData);
    return utils_1.unicastTo(data, following, follower.inboxUrl);
}
exports.sendReject = sendReject;
function buildRejectActivity(url, byActor, followActivityData) {
    return {
        type: 'Reject',
        id: url,
        actor: byActor.url,
        object: followActivityData
    };
}
