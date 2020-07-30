"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outboxRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const videos_1 = require("../../../shared/models/videos");
const activitypub_1 = require("../../helpers/activitypub");
const logger_1 = require("../../helpers/logger");
const send_1 = require("../../lib/activitypub/send");
const audience_1 = require("../../lib/activitypub/audience");
const middlewares_1 = require("../../middlewares");
const video_1 = require("../../models/video/video");
const utils_1 = require("./utils");
const activitypub_2 = require("../../middlewares/validators/activitypub");
const outboxRouter = express.Router();
exports.outboxRouter = outboxRouter;
outboxRouter.get('/accounts/:name/outbox', activitypub_2.apPaginationValidator, middlewares_1.localAccountValidator, middlewares_1.asyncMiddleware(outboxController));
outboxRouter.get('/video-channels/:name/outbox', activitypub_2.apPaginationValidator, middlewares_1.localVideoChannelValidator, middlewares_1.asyncMiddleware(outboxController));
function outboxController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const accountOrVideoChannel = res.locals.account || res.locals.videoChannel;
        const actor = accountOrVideoChannel.Actor;
        const actorOutboxUrl = actor.url + '/outbox';
        logger_1.logger.info('Receiving outbox request for %s.', actorOutboxUrl);
        const handler = (start, count) => buildActivities(actor, start, count);
        const json = yield activitypub_1.activityPubCollectionPagination(actorOutboxUrl, handler, req.query.page, req.query.size);
        return utils_1.activityPubResponse(activitypub_1.activityPubContextify(json), res);
    });
}
function buildActivities(actor, start, count) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const data = yield video_1.VideoModel.listAllAndSharedByActorForOutbox(actor.id, start, count);
        const activities = [];
        for (const video of data.data) {
            const byActor = video.VideoChannel.Account.Actor;
            const createActivityAudience = audience_1.buildAudience([byActor.followersUrl], video.privacy === videos_1.VideoPrivacy.PUBLIC);
            if (video.VideoShares !== undefined && video.VideoShares.length !== 0) {
                const videoShare = video.VideoShares[0];
                const announceActivity = send_1.buildAnnounceActivity(videoShare.url, actor, video.url, createActivityAudience);
                activities.push(announceActivity);
            }
            else {
                const videoObject = video.toActivityPubObject();
                const createActivity = send_1.buildCreateActivity(video.url, byActor, videoObject, createActivityAudience);
                activities.push(createActivity);
            }
        }
        return {
            data: activities,
            total: data.total
        };
    });
}
