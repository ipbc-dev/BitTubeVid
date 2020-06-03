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
const database_1 = require("../../../initializers/database");
const account_video_rate_1 = require("../../../models/account/account-video-rate");
const utils_1 = require("../send/utils");
const videos_1 = require("../videos");
const url_1 = require("../url");
const activitypub_1 = require("../../../helpers/activitypub");
function processLikeActivity(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        return database_utils_1.retryTransactionWrapper(processLikeVideo, byActor, activity);
    });
}
exports.processLikeActivity = processLikeActivity;
function processLikeVideo(byActor, activity) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoUrl = activitypub_1.getAPId(activity.object);
        const byAccount = byActor.Account;
        if (!byAccount)
            throw new Error('Cannot create like with the non account actor ' + byActor.url);
        const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: videoUrl });
        return database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            const url = url_1.getVideoLikeActivityPubUrl(byActor, video);
            const existingRate = yield account_video_rate_1.AccountVideoRateModel.loadByAccountAndVideoOrUrl(byAccount.id, video.id, url);
            if (existingRate && existingRate.type === 'like')
                return;
            if (existingRate && existingRate.type === 'dislike') {
                yield video.decrement('dislikes', { transaction: t });
            }
            yield video.increment('likes', { transaction: t });
            const rate = existingRate || new account_video_rate_1.AccountVideoRateModel();
            rate.type = 'like';
            rate.videoId = video.id;
            rate.accountId = byAccount.id;
            rate.url = url;
            yield rate.save({ transaction: t });
            if (video.isOwned()) {
                const exceptions = [byActor];
                yield utils_1.forwardVideoRelatedActivity(activity, t, exceptions, video);
            }
        }));
    });
}
