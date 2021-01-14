"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAbuse = void 0;
const logger_1 = require("../../../helpers/logger");
const audience_1 = require("../audience");
const url_1 = require("../url");
const utils_1 = require("./utils");
function sendAbuse(byActor, abuse, flaggedAccount, t) {
    if (!flaggedAccount.Actor.serverId)
        return;
    const url = url_1.getLocalAbuseActivityPubUrl(abuse);
    logger_1.logger.info('Creating job to send abuse %s.', url);
    const audience = { to: [flaggedAccount.Actor.url], cc: [] };
    const flagActivity = buildFlagActivity(url, byActor, abuse, audience);
    t.afterCommit(() => utils_1.unicastTo(flagActivity, byActor, flaggedAccount.Actor.getSharedInbox()));
}
exports.sendAbuse = sendAbuse;
function buildFlagActivity(url, byActor, abuse, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    const activity = Object.assign({ id: url, actor: byActor.url }, abuse.toActivityPubObject());
    return audience_1.audiencify(activity, audience);
}
