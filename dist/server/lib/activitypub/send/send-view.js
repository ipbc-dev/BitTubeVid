"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendView = void 0;
const tslib_1 = require("tslib");
const url_1 = require("../url");
const utils_1 = require("./utils");
const audience_1 = require("../audience");
const logger_1 = require("../../../helpers/logger");
function sendView(byActor, video, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating job to send view of %s.', video.url);
        const activityBuilder = (audience) => {
            const url = url_1.getVideoLikeActivityPubUrl(byActor, video);
            return buildViewActivity(url, byActor, video, audience);
        };
        return utils_1.sendVideoRelatedActivity(activityBuilder, { byActor, video, transaction: t, contextType: 'View' });
    });
}
exports.sendView = sendView;
function buildViewActivity(url, byActor, video, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    return audience_1.audiencify({
        id: url,
        type: 'View',
        actor: byActor.url,
        object: video.url
    }, audience);
}
