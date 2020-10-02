"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPremiumStorageChecker = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../../helpers/logger");
const hooks_1 = require("../../../lib/plugins/hooks");
const user_premium_storage_payments_1 = require("@server/models/user-premium-storage-payments");
const premium_storage_slow_payer_1 = require("@server/models/premium-storage-slow-payer");
const user_1 = require("@server/models/account/user");
const video_1 = require("@server/models/video/video");
const config_1 = require("@server/initializers/config");
const emailer_1 = require("@server/lib/emailer");
const parallel = (num, arr, func) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const thread = (item) => {
        if (item === undefined)
            return;
        return func(item)
            .catch((err) => {
            logger_1.logger.error('Error in parallel, should be handled in func!', err);
            return true;
        })
            .then(() => {
            if (arr.length)
                return thread(arr.shift());
        });
    };
    const promises = [];
    for (let i = 0; i < num; ++i)
        promises.push(thread(arr.shift()));
    yield Promise.all(promises);
});
function processPremiumStorageChecker() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const videosAmmountToDelete = 10;
            yield checkOutdatedPayments();
            yield cleanVideosFromSlowPayers(videosAmmountToDelete);
        }
        catch (err) {
            logger_1.logger.error(err);
        }
    });
}
exports.processPremiumStorageChecker = processPremiumStorageChecker;
function checkOutdatedPayments() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const instanceDefaultQuota = config_1.CONFIG.USER.VIDEO_QUOTA;
        const instanceDefaultDailyQuota = config_1.CONFIG.USER.VIDEO_QUOTA_DAILY;
        const activePayments = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getAllActivePayments();
        yield parallel(1, activePayments, (payment) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (payment.dateTo < Date.now()) {
                console.log('premiumStorageChecker found outdated payment: ', payment);
                yield premium_storage_slow_payer_1.premiumStorageSlowPayer.addSlowPayer(payment.userId);
                yield user_1.UserModel.update({
                    videoQuota: instanceDefaultQuota,
                    videoQuotaDaily: instanceDefaultDailyQuota
                }, {
                    where: {
                        id: payment.userId
                    }
                });
                yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.deactivateUserPayment(payment.id);
                console.log('premiumStorageChecker slowPlayer successfuly added');
            }
            else {
                const paymentDateToWeekLess = (payment.dateTo - 604800000);
                if (paymentDateToWeekLess < Date.now()) {
                    const userInfo = yield user_1.UserModel.loadById(payment.userId);
                    emailer_1.Emailer.Instance.addPremiumStorageAboutToExpireJob(userInfo.username, userInfo.email, config_1.CONFIG.WEBSERVER.HOSTNAME, payment.dateTo - Date.now());
                }
            }
        }));
    });
}
function cleanVideosFromSlowPayers(videosAmmountToDelete) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const slowPayersList = yield premium_storage_slow_payer_1.premiumStorageSlowPayer.getAllSlowPayers();
        yield parallel(1, slowPayersList, (slowPayer) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const userInfo = yield user_1.UserModel.loadById(slowPayer.userId);
            const actorId = userInfo.Account.id;
            const userVideos = yield video_1.VideoModel.listUserVideosForApi(actorId, 0, videosAmmountToDelete, "-createdAt");
            const userVideoQuota = userInfo.videoQuota;
            let deletedVideosCounter = 0;
            const deletedVideosNames = [];
            let userUsedVideoQuota;
            for (const video of userVideos.data) {
                userUsedVideoQuota = yield getUserUsedQuota(slowPayer.userId);
                if (userUsedVideoQuota > userVideoQuota) {
                    deletedVideosNames.push(video.name);
                    yield video.destroy();
                    deletedVideosCounter++;
                    hooks_1.Hooks.runAction('action:api.video.deleted', { video });
                }
            }
            if (deletedVideosCounter > 0) {
                emailer_1.Emailer.Instance.addPremiumStorageExpiredJob(userInfo.username, userInfo.email, config_1.CONFIG.WEBSERVER.HOSTNAME, deletedVideosCounter, deletedVideosNames);
            }
            userUsedVideoQuota = yield getUserUsedQuota(slowPayer.userId);
            if (userUsedVideoQuota <= userVideoQuota) {
                yield premium_storage_slow_payer_1.premiumStorageSlowPayer.deleteSlowPayer(slowPayer.id);
            }
        }));
    });
}
function getUserUsedQuota(userId) {
    const query = user_1.UserModel.generateUserQuotaBaseSQL({
        withSelect: true,
        whereUserId: '$userId'
    });
    return user_1.UserModel.getTotalRawQuery(query, userId);
}
