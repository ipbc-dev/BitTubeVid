"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_utils_1 = require("../../../helpers/database-utils");
const initializers_1 = require("../../../initializers");
const video_share_1 = require("../../../models/video/video-share");
const utils_1 = require("../send/utils");
const videos_1 = require("../videos");
const notifier_1 = require("../../notifier");
const logger_1 = require("../../../helpers/logger");
function processAnnounceActivity(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { activity, byActor: actorAnnouncer } = options;
        const notify = options.fromFetch !== true;
        return database_utils_1.retryTransactionWrapper(processVideoShare, actorAnnouncer, activity, notify);
    });
}
exports.processAnnounceActivity = processAnnounceActivity;
function processVideoShare(actorAnnouncer, activity, notify) {
    return __awaiter(this, void 0, void 0, function* () {
        const objectUri = typeof activity.object === 'string' ? activity.object : activity.object.id;
        let video;
        let videoCreated;
        try {
            const result = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: objectUri });
            video = result.video;
            videoCreated = result.created;
        }
        catch (err) {
            logger_1.logger.debug('Cannot process share of %s. Maybe this is not a video object, so just skipping.', objectUri, { err });
            return;
        }
        yield initializers_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const share = {
                actorId: actorAnnouncer.id,
                videoId: video.id,
                url: activity.id
            };
            const [, created] = yield video_share_1.VideoShareModel.findOrCreate({
                where: {
                    url: activity.id
                },
                defaults: share,
                transaction: t
            });
            if (video.isOwned() && created === true) {
                const exceptions = [actorAnnouncer];
                yield utils_1.forwardVideoRelatedActivity(activity, t, exceptions, video);
            }
            return undefined;
        }));
        if (videoCreated && notify)
            notifier_1.Notifier.Instance.notifyOnNewVideoIfNeeded(video);
    });
}
