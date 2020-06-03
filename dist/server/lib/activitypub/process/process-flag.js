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
const shared_1 = require("../../../../shared");
const database_utils_1 = require("../../../helpers/database-utils");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
const video_abuse_1 = require("../../../models/video/video-abuse");
const videos_1 = require("../videos");
const notifier_1 = require("../../notifier");
const activitypub_1 = require("../../../helpers/activitypub");
const account_1 = require("@server/models/account/account");
function processFlagActivity(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        return database_utils_1.retryTransactionWrapper(processCreateVideoAbuse, activity, byActor);
    });
}
exports.processFlagActivity = processFlagActivity;
function processCreateVideoAbuse(activity, byActor) {
    return __awaiter(this, void 0, void 0, function* () {
        const flag = activity.type === 'Flag' ? activity : activity.object;
        const account = byActor.Account;
        if (!account)
            throw new Error('Cannot create video abuse with the non account actor ' + byActor.url);
        const objects = Array.isArray(flag.object) ? flag.object : [flag.object];
        for (const object of objects) {
            try {
                logger_1.logger.debug('Reporting remote abuse for video %s.', activitypub_1.getAPId(object));
                const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: object });
                const reporterAccount = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () { return account_1.AccountModel.load(account.id, t); }));
                const videoAbuseInstance = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                    const videoAbuseData = {
                        reporterAccountId: account.id,
                        reason: flag.content,
                        videoId: video.id,
                        state: shared_1.VideoAbuseState.PENDING
                    };
                    const videoAbuseInstance = yield video_abuse_1.VideoAbuseModel.create(videoAbuseData, { transaction: t });
                    videoAbuseInstance.Video = video;
                    videoAbuseInstance.Account = reporterAccount;
                    logger_1.logger.info('Remote abuse for video uuid %s created', flag.object);
                    return videoAbuseInstance;
                }));
                const videoAbuseJSON = videoAbuseInstance.toFormattedJSON();
                notifier_1.Notifier.Instance.notifyOnNewVideoAbuse({
                    videoAbuse: videoAbuseJSON,
                    videoAbuseInstance,
                    reporter: reporterAccount.Actor.getIdentifier()
                });
            }
            catch (err) {
                logger_1.logger.debug('Cannot process report of %s. (Maybe not a video abuse).', activitypub_1.getAPId(object), { err });
            }
        }
    });
}
