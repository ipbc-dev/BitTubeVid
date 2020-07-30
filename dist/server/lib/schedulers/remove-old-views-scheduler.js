"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveOldViewsScheduler = void 0;
const logger_1 = require("../../helpers/logger");
const abstract_scheduler_1 = require("./abstract-scheduler");
const constants_1 = require("../../initializers/constants");
const config_1 = require("../../initializers/config");
const video_view_1 = require("../../models/video/video-view");
class RemoveOldViewsScheduler extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = constants_1.SCHEDULER_INTERVALS_MS.removeOldViews;
    }
    internalExecute() {
        if (config_1.CONFIG.VIEWS.VIDEOS.REMOTE.MAX_AGE === -1)
            return;
        logger_1.logger.info('Removing old videos views.');
        const now = new Date();
        const beforeDate = new Date(now.getTime() - config_1.CONFIG.VIEWS.VIDEOS.REMOTE.MAX_AGE).toISOString();
        return video_view_1.VideoViewModel.removeOldRemoteViewsHistory(beforeDate);
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.RemoveOldViewsScheduler = RemoveOldViewsScheduler;
