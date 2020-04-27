"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../helpers/logger");
const abstract_scheduler_1 = require("./abstract-scheduler");
const constants_1 = require("../../initializers/constants");
const user_video_history_1 = require("../../models/account/user-video-history");
const config_1 = require("../../initializers/config");
class RemoveOldHistoryScheduler extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = constants_1.SCHEDULER_INTERVALS_MS.removeOldHistory;
    }
    internalExecute() {
        if (config_1.CONFIG.HISTORY.VIDEOS.MAX_AGE === -1)
            return;
        logger_1.logger.info('Removing old videos history.');
        const now = new Date();
        const beforeDate = new Date(now.getTime() - config_1.CONFIG.HISTORY.VIDEOS.MAX_AGE).toISOString();
        return user_video_history_1.UserVideoHistoryModel.removeOldHistory(beforeDate);
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.RemoveOldHistoryScheduler = RemoveOldHistoryScheduler;
