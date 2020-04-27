"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = require("./misc");
const job_queue_1 = require("@server/lib/job-queue/job-queue");
const jobStates = ['active', 'completed', 'failed', 'waiting', 'delayed'];
function isValidJobState(value) {
    return misc_1.exists(value) && jobStates.includes(value);
}
exports.isValidJobState = isValidJobState;
function isValidJobType(value) {
    return misc_1.exists(value) && job_queue_1.jobTypes.includes(value);
}
exports.isValidJobType = isValidJobType;
