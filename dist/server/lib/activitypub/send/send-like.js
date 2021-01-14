"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLikeActivity = exports.sendLike = void 0;
const url_1 = require("../url");
const utils_1 = require("./utils");
const audience_1 = require("../audience");
const logger_1 = require("../../../helpers/logger");
function sendLike(byActor, video, t) {
    logger_1.logger.info('Creating job to like %s.', video.url);
    const activityBuilder = (audience) => {
        const url = url_1.getVideoLikeActivityPubUrlByLocalActor(byActor, video);
        return buildLikeActivity(url, byActor, video, audience);
    };
    return utils_1.sendVideoRelatedActivity(activityBuilder, { byActor, video, transaction: t });
}
exports.sendLike = sendLike;
function buildLikeActivity(url, byActor, video, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    return audience_1.audiencify({
        id: url,
        type: 'Like',
        actor: byActor.url,
        object: video.url
    }, audience);
}
exports.buildLikeActivity = buildLikeActivity;
