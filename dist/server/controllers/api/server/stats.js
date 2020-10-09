"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const middlewares_1 = require("../../../middlewares");
const user_1 = require("../../../models/account/user");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
const video_1 = require("../../../models/video/video");
const video_comment_1 = require("../../../models/video/video-comment");
const video_redundancy_1 = require("../../../models/redundancy/video-redundancy");
const constants_1 = require("../../../initializers/constants");
const cache_1 = require("../../../middlewares/cache");
const video_file_1 = require("../../../models/video/video-file");
const config_1 = require("../../../initializers/config");
const user_premium_storage_payments_1 = require("@server/models/user-premium-storage-payments");
const statsRouter = express.Router();
exports.statsRouter = statsRouter;
statsRouter.get('/stats', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.STATS)), middlewares_1.asyncMiddleware(getStats));
function getStats(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { totalLocalVideos, totalLocalVideoViews, totalVideos } = yield video_1.VideoModel.getStats();
        const { totalLocalVideoComments, totalVideoComments } = yield video_comment_1.VideoCommentModel.getStats();
        const { totalUsers, totalDailyActiveUsers, totalWeeklyActiveUsers, totalMonthlyActiveUsers } = yield user_1.UserModel.getStats();
        const { totalInstanceFollowers, totalInstanceFollowing } = yield actor_follow_1.ActorFollowModel.getStats();
        const { totalLocalVideoFilesSize } = yield video_file_1.VideoFileModel.getStats();
        const premiumStorageStadistics = yield user_premium_storage_payments_1.userPremiumStoragePaymentModel.getStats();
        const strategies = config_1.CONFIG.REDUNDANCY.VIDEOS.STRATEGIES
            .map(r => ({
            strategy: r.strategy,
            size: r.size
        }));
        strategies.push({ strategy: 'manual', size: null });
        const videosRedundancyStats = yield Promise.all(strategies.map(r => {
            return video_redundancy_1.VideoRedundancyModel.getStats(r.strategy)
                .then(stats => Object.assign(stats, { strategy: r.strategy, totalSize: r.size }));
        }));
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
            premiumStorageStadistics,
            videosRedundancy: videosRedundancyStats
        };
        return res.json(data).end();
    });
}
