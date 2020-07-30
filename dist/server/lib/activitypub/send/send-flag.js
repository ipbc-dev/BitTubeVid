"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVideoAbuse = void 0;
const url_1 = require("../url");
const utils_1 = require("./utils");
const logger_1 = require("../../../helpers/logger");
const audience_1 = require("../audience");
function sendVideoAbuse(byActor, videoAbuse, video, t) {
    if (!video.VideoChannel.Account.Actor.serverId)
        return;
    const url = url_1.getVideoAbuseActivityPubUrl(videoAbuse);
    logger_1.logger.info('Creating job to send video abuse %s.', url);
    const audience = { to: [video.VideoChannel.Account.Actor.url], cc: [] };
    const flagActivity = buildFlagActivity(url, byActor, videoAbuse, audience);
    t.afterCommit(() => utils_1.unicastTo(flagActivity, byActor, video.VideoChannel.Account.Actor.getSharedInbox()));
}
exports.sendVideoAbuse = sendVideoAbuse;
function buildFlagActivity(url, byActor, videoAbuse, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    const activity = Object.assign({ id: url, actor: byActor.url }, videoAbuse.toActivityPubObject());
    return audience_1.audiencify(activity, audience);
}
