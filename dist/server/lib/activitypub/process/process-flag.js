"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFlagActivity = void 0;
const tslib_1 = require("tslib");
const moderation_1 = require("@server/lib/moderation");
const account_1 = require("@server/models/account/account");
const video_1 = require("@server/models/video/video");
const video_comment_1 = require("@server/models/video/video-comment");
const abuse_1 = require("@shared/core-utils/abuse");
const activitypub_1 = require("../../../helpers/activitypub");
const database_utils_1 = require("../../../helpers/database-utils");
const logger_1 = require("../../../helpers/logger");
const database_1 = require("../../../initializers/database");
function processFlagActivity(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        return database_utils_1.retryTransactionWrapper(processCreateAbuse, activity, byActor);
    });
}
exports.processFlagActivity = processFlagActivity;
function processCreateAbuse(activity, byActor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const flag = activity.type === 'Flag' ? activity : activity.object;
        const account = byActor.Account;
        if (!account)
            throw new Error('Cannot create abuse with the non account actor ' + byActor.url);
        const reporterAccount = yield account_1.AccountModel.load(account.id);
        const objects = Array.isArray(flag.object) ? flag.object : [flag.object];
        const tags = Array.isArray(flag.tag) ? flag.tag : [];
        const predefinedReasons = tags.map(tag => abuse_1.abusePredefinedReasonsMap[tag.name])
            .filter(v => !isNaN(v));
        const startAt = flag.startAt;
        const endAt = flag.endAt;
        for (const object of objects) {
            try {
                const uri = activitypub_1.getAPId(object);
                logger_1.logger.debug('Reporting remote abuse for object %s.', uri);
                yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const video = yield video_1.VideoModel.loadByUrlAndPopulateAccount(uri, t);
                    let videoComment;
                    let flaggedAccount;
                    if (!video)
                        videoComment = yield video_comment_1.VideoCommentModel.loadByUrlAndPopulateAccountAndVideo(uri, t);
                    if (!videoComment)
                        flaggedAccount = yield account_1.AccountModel.loadByUrl(uri, t);
                    if (!video && !videoComment && !flaggedAccount) {
                        logger_1.logger.warn('Cannot flag unknown entity %s.', object);
                        return;
                    }
                    const baseAbuse = {
                        reporterAccountId: reporterAccount.id,
                        reason: flag.content,
                        state: 1,
                        predefinedReasons
                    };
                    if (video) {
                        return moderation_1.createVideoAbuse({
                            baseAbuse,
                            startAt,
                            endAt,
                            reporterAccount,
                            transaction: t,
                            videoInstance: video
                        });
                    }
                    if (videoComment) {
                        return moderation_1.createVideoCommentAbuse({
                            baseAbuse,
                            reporterAccount,
                            transaction: t,
                            commentInstance: videoComment
                        });
                    }
                    return yield moderation_1.createAccountAbuse({
                        baseAbuse,
                        reporterAccount,
                        transaction: t,
                        accountInstance: flaggedAccount
                    });
                }));
            }
            catch (err) {
                logger_1.logger.debug('Cannot process report of %s', activitypub_1.getAPId(object), { err });
            }
        }
    });
}
