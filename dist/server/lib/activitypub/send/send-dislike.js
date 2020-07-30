"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDislikeActivity = exports.sendDislike = void 0;
const url_1 = require("../url");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("./utils");
const audience_1 = require("../audience");
function sendDislike(byActor, video, t) {
    logger_1.logger.info('Creating job to dislike %s.', video.url);
    const activityBuilder = (audience) => {
        const url = url_1.getVideoDislikeActivityPubUrl(byActor, video);
        return buildDislikeActivity(url, byActor, video, audience);
    };
    return utils_1.sendVideoRelatedActivity(activityBuilder, { byActor, video, transaction: t });
}
exports.sendDislike = sendDislike;
function buildDislikeActivity(url, byActor, video, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    return audience_1.audiencify({
        id: url,
        type: 'Dislike',
        actor: byActor.url,
        object: video.url
    }, audience);
}
exports.buildDislikeActivity = buildDislikeActivity;
