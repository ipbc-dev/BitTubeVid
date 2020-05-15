"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("../../helpers/core-utils");
const logger_1 = require("../../helpers/logger");
const job_queue_1 = require("../job-queue");
const abstract_scheduler_1 = require("./abstract-scheduler");
const constants_1 = require("../../initializers/constants");
class RemoveOldJobsScheduler extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = constants_1.SCHEDULER_INTERVALS_MS.removeOldJobs;
    }
    internalExecute() {
        if (!core_utils_1.isTestInstance())
            logger_1.logger.info('Removing old jobs in scheduler.');
        return job_queue_1.JobQueue.Instance.removeOldJobs();
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.RemoveOldJobsScheduler = RemoveOldJobsScheduler;
