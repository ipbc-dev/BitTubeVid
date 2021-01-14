"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsManager = void 0;
const tslib_1 = require("tslib");
const config_1 = require("@server/initializers/config");
const user_1 = require("@server/models/account/user");
const actor_follow_1 = require("@server/models/activitypub/actor-follow");
const video_redundancy_1 = require("@server/models/redundancy/video-redundancy");
const video_1 = require("@server/models/video/video");
const video_comment_1 = require("@server/models/video/video-comment");
const video_file_1 = require("@server/models/video/video-file");
const user_premium_storage_payments_1 = require("@server/models/user-premium-storage-payments");
class StatsManager {
    constructor() {
        this.instanceStartDate = new Date();
        this.inboxMessagesProcessed = 0;
        this.inboxMessagesWaiting = 0;
    }
    updateInboxStats(inboxMessagesProcessed, inboxMessagesWaiting) {
        this.inboxMessagesProcessed = inboxMessagesProcessed;
        this.inboxMessagesWaiting = inboxMessagesWaiting;
    }
    getStats() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { totalLocalVideos, totalLocalVideoViews, totalVideos } = yield video_1.VideoModel.getStats();
            const { totalLocalVideoComments, totalVideoComments } = yield video_comment_1.VideoCommentModel.getStats();
            const { totalUsers, totalDailyActiveUsers, totalWeeklyActiveUsers, totalMonthlyActiveUsers } = yield user_1.UserModel.getStats();
            const { totalInstanceFollowers, totalInstanceFollowing } = yield actor_follow_1.ActorFollowModel.getStats();
            const { totalLocalVideoFilesSize } = yield video_file_1.VideoFileModel.getStats();
            const { premiumStorageStadistics } = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getStats();
            const videosRedundancyStats = yield this.buildRedundancyStats();
            const data = {
                totalLocalVideos,
                totalLocalVideoViews,
                totalLocalVideoFilesSize,
                totalLocalVideoComments,
                totalVideos,
                totalVideoComments,
                totalUsers,
                totalDailyActiveUsers,
                totalWeeklyActiveUsers,
                totalMonthlyActiveUsers,
                totalInstanceFollowers,
                totalInstanceFollowing,
                videosRedundancy: videosRedundancyStats,
                premiumStorageStadistics,
                totalActivityPubMessagesProcessed: this.inboxMessagesProcessed,
                activityPubMessagesProcessedPerSecond: this.buildActivityPubMessagesProcessedPerSecond(),
                totalActivityPubMessagesWaiting: this.inboxMessagesWaiting
            };
            return data;
        });
    }
    buildActivityPubMessagesProcessedPerSecond() {
        const now = new Date();
        const startedSeconds = (now.getTime() - this.instanceStartDate.getTime()) / 1000;
        return this.inboxMessagesProcessed / startedSeconds;
    }
    buildRedundancyStats() {
        const strategies = config_1.CONFIG.REDUNDANCY.VIDEOS.STRATEGIES
            .map(r => ({
            strategy: r.strategy,
            size: r.size
        }));
        strategies.push({ strategy: 'manual', size: null });
        return Promise.all(strategies.map(r => {
            return video_redundancy_1.VideoRedundancyModel.getStats(r.strategy)
                .then(stats => Object.assign(stats, { strategy: r.strategy, totalSize: r.size }));
        }));
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.StatsManager = StatsManager;
