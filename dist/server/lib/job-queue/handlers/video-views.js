"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideosViews = void 0;
const tslib_1 = require("tslib");
const redis_1 = require("../../redis");
const logger_1 = require("../../../helpers/logger");
const video_1 = require("../../../models/video/video");
const video_view_1 = require("../../../models/video/video-view");
const core_utils_1 = require("../../../helpers/core-utils");
const videos_1 = require("../../activitypub/videos");
function processVideosViews() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                yield redis_1.Redis.Instance.deleteVideoViews(videoId, hour);
                if (views) {
                    logger_1.logger.debug('Adding %d views to video %d in hour %d.', views, videoId, hour);
                    try {
                        const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoId);
                        if (!video) {
                            logger_1.logger.debug('Video %d does not exist anymore, skipping videos view addition.', videoId);
                            continue;
                        }
                        yield video_view_1.VideoViewModel.create({
                            startDate,
                            endDate,
                            views,
                            videoId
                        });
                        if (video.isOwned()) {
                            yield video_1.VideoModel.incrementViews(videoId, views);
                            video.views += views;
                            yield videos_1.federateVideoIfNeeded(video, false);
                        }
                    }
                    catch (err) {
                        logger_1.logger.error('Cannot create video views for video %d in hour %d.', videoId, hour, { err });
                    }
                }
            }
            catch (err) {
                logger_1.logger.error('Cannot update video views of video %d in hour %d.', videoId, hour, { err });
            }
        }
    });
}
exports.processVideosViews = processVideosViews;
