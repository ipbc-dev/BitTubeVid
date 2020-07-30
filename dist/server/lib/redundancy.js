"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeVideoRedundancy = exports.removeRedundanciesOfServer = exports.isRedundancyAccepted = void 0;
const tslib_1 = require("tslib");
const video_redundancy_1 = require("../models/redundancy/video-redundancy");
const send_1 = require("./activitypub/send");
const config_1 = require("@server/initializers/config");
const logger_1 = require("@server/helpers/logger");
const actor_follow_1 = require("@server/models/activitypub/actor-follow");
const application_1 = require("@server/models/application/application");
function removeVideoRedundancy(videoRedundancy, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        if (videoRedundancy.actorId === serverActor.id)
            yield send_1.sendUndoCacheFile(serverActor, videoRedundancy, t);
        yield videoRedundancy.destroy({ transaction: t });
    });
}
exports.removeVideoRedundancy = removeVideoRedundancy;
function removeRedundanciesOfServer(serverId) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const redundancies = yield video_redundancy_1.VideoRedundancyModel.listLocalOfServer(serverId);
        for (const redundancy of redundancies) {
            yield removeVideoRedundancy(redundancy);
        }
    });
}
exports.removeRedundanciesOfServer = removeRedundanciesOfServer;
function isRedundancyAccepted(activity, byActor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const configAcceptFrom = config_1.CONFIG.REMOTE_REDUNDANCY.VIDEOS.ACCEPT_FROM;
        if (configAcceptFrom === 'nobody') {
            logger_1.logger.info('Do not accept remote redundancy %s due instance accept policy.', activity.id);
            return false;
        }
        if (configAcceptFrom === 'followings') {
            const serverActor = yield application_1.getServerActor();
            const allowed = yield actor_follow_1.ActorFollowModel.isFollowedBy(byActor.id, serverActor.id);
            if (allowed !== true) {
                logger_1.logger.info('Do not accept remote redundancy %s because actor %s is not followed by our instance.', activity.id, byActor.url);
                return false;
            }
        }
        return true;
    });
}
exports.isRedundancyAccepted = isRedundancyAccepted;
