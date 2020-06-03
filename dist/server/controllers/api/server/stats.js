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
const statsRouter = express.Router();
exports.statsRouter = statsRouter;
statsRouter.get('/stats', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.STATS)), middlewares_1.asyncMiddleware(getStats));
function getStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { totalLocalVideos, totalLocalVideoViews, totalVideos } = yield video_1.VideoModel.getStats();
        const { totalLocalVideoComments, totalVideoComments } = yield video_comment_1.VideoCommentModel.getStats();
        const { totalUsers, totalDailyActiveUsers, totalWeeklyActiveUsers, totalMonthlyActiveUsers } = yield user_1.UserModel.getStats();
        const { totalInstanceFollowers, totalInstanceFollowing } = yield actor_follow_1.ActorFollowModel.getStats();
        const { totalLocalVideoFilesSize } = yield video_file_1.VideoFileModel.getStats();
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
            videosRedundancy: videosRedundancyStats
        };
        return res.json(data).end();
    });
}
