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
const redis_1 = require("../../redis");
const logger_1 = require("../../../helpers/logger");
const video_1 = require("../../../models/video/video");
const video_views_1 = require("../../../models/video/video-views");
const core_utils_1 = require("../../../helpers/core-utils");
const activitypub_1 = require("../../activitypub");
function processVideosViews() {
    return __awaiter(this, void 0, void 0, function* () {
        const lastHour = new Date();
        if (!core_utils_1.isTestInstance())
            lastHour.setHours(lastHour.getHours() - 1);
        const hour = lastHour.getHours();
        const startDate = lastHour.setMinutes(0, 0, 0);
        const endDate = lastHour.setMinutes(59, 59, 999);
        const videoIds = yield redis_1.Redis.Instance.getVideosIdViewed(hour);
        if (videoIds.length === 0)
            return;
        logger_1.logger.info('Processing videos views in job for hour %d.', hour);
        for (const videoId of videoIds) {
            try {
                const views = yield redis_1.Redis.Instance.getVideoViews(videoId, hour);
                if (views) {
                    logger_1.logger.debug('Adding %d views to video %d in hour %d.', views, videoId, hour);
                    try {
                        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoId);
                        if (!video) {
                            logger_1.logger.debug('Video %d does not exist anymore, skipping videos view addition.', videoId);
                            continue;
                        }
                        yield video_views_1.VideoViewModel.create({
                            startDate,
                            endDate,
                            views,
                            videoId
                        });
                        if (video.isOwned()) {
                            yield video_1.VideoModel.incrementViews(videoId, views);
                            video.views += views;
                            yield activitypub_1.federateVideoIfNeeded(video, false);
                        }
                    }
                    catch (err) {
                        logger_1.logger.error('Cannot create video views for video %d in hour %d.', videoId, hour, { err });
                    }
                }
                yield redis_1.Redis.Instance.deleteVideoViews(videoId, hour);
            }
            catch (err) {
                logger_1.logger.error('Cannot update video views of video %d in hour %d.', videoId, hour, { err });
            }
        }
    });
}
exports.processVideosViews = processVideosViews;
