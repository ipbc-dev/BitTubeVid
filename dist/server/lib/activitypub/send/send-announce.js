"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAnnounceWithVideoAudience = exports.buildAnnounceActivity = exports.sendVideoAnnounce = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("./utils");
const audience_1 = require("../audience");
const logger_1 = require("../../../helpers/logger");
function buildAnnounceWithVideoAudience(byActor, videoShare, video, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const announcedObject = video.url;
        const actorsInvolvedInVideo = yield audience_1.getActorsInvolvedInVideo(video, t);
        const audience = audience_1.getAudienceFromFollowersOf(actorsInvolvedInVideo);
        const activity = buildAnnounceActivity(videoShare.url, byActor, announcedObject, audience);
        return { activity, actorsInvolvedInVideo };
    });
}
exports.buildAnnounceWithVideoAudience = buildAnnounceWithVideoAudience;
function sendVideoAnnounce(byActor, videoShare, video, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { activity, actorsInvolvedInVideo } = yield buildAnnounceWithVideoAudience(byActor, videoShare, video, t);
        logger_1.logger.info('Creating job to send announce %s.', videoShare.url);
        const followersException = [byActor];
        return utils_1.broadcastToFollowers(activity, byActor, actorsInvolvedInVideo, t, followersException, 'Announce');
    });
}
exports.sendVideoAnnounce = sendVideoAnnounce;
function buildAnnounceActivity(url, byActor, object, audience) {
    if (!audience)
        audience = audience_1.getAudience(byActor);
    return audience_1.audiencify({
        type: 'Announce',
        id: url,
        actor: byActor.url,
        object
    }, audience);
}
exports.buildAnnounceActivity = buildAnnounceActivity;
