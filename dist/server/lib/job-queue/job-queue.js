"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueue = exports.jobTypes = void 0;
const tslib_1 = require("tslib");
const Bull = require("bull");
const jobs_1 = require("@server/helpers/custom-validators/jobs");
const video_redundancy_1 = require("@server/lib/job-queue/handlers/video-redundancy");
const logger_1 = require("../../helpers/logger");
const constants_1 = require("../../initializers/constants");
const redis_1 = require("../redis");
const activitypub_follow_1 = require("./handlers/activitypub-follow");
const activitypub_http_broadcast_1 = require("./handlers/activitypub-http-broadcast");
const activitypub_http_fetcher_1 = require("./handlers/activitypub-http-fetcher");
const activitypub_http_unicast_1 = require("./handlers/activitypub-http-unicast");
const email_1 = require("./handlers/email");
const video_import_1 = require("./handlers/video-import");
const video_live_ending_1 = require("./handlers/video-live-ending");
const video_transcoding_1 = require("./handlers/video-transcoding");
const video_views_1 = require("./handlers/video-views");
const premium_storage_checker_1 = require("./handlers/premium-storage-checker");
const activitypub_refresher_1 = require("./handlers/activitypub-refresher");
const video_file_import_1 = require("./handlers/video-file-import");
const handlers = {
    'activitypub-http-broadcast': activitypub_http_broadcast_1.processActivityPubHttpBroadcast,
    'activitypub-http-unicast': activitypub_http_unicast_1.processActivityPubHttpUnicast,
    'activitypub-http-fetcher': activitypub_http_fetcher_1.processActivityPubHttpFetcher,
    'activitypub-follow': activitypub_follow_1.processActivityPubFollow,
    'video-file-import': video_file_import_1.processVideoFileImport,
    'video-transcoding': video_transcoding_1.processVideoTranscoding,
    'email': email_1.processEmail,
    'video-import': video_import_1.processVideoImport,
    'videos-views': video_views_1.processVideosViews,
    'premium-storage-checker': premium_storage_checker_1.processPremiumStorageChecker,
    'activitypub-refresher': activitypub_refresher_1.refreshAPObject,
    'video-live-ending': video_live_ending_1.processVideoLiveEnding,
    'video-redundancy': video_redundancy_1.processVideoRedundancy
};
const jobTypes = [
    'activitypub-follow',
    'activitypub-http-broadcast',
    'activitypub-http-fetcher',
    'activitypub-http-unicast',
    'email',
    'video-transcoding',
    'video-file-import',
    'video-import',
    'videos-views',
    'premium-storage-checker',
    'activitypub-refresher',
    'video-redundancy',
    'video-live-ending'
];
exports.jobTypes = jobTypes;
class JobQueue {
    constructor() {
        this.queues = {};
        this.initialized = false;
    }
    init() {
        if (this.initialized === true)
            return;
        this.initialized = true;
        this.jobRedisPrefix = 'bull-' + constants_1.WEBSERVER.HOST;
        const queueOptions = {
            prefix: this.jobRedisPrefix,
            redis: redis_1.Redis.getRedisClientOptions(),
            settings: {
                maxStalledCount: 10
            }
        };
        for (const handlerName of Object.keys(handlers)) {
            const queue = new Bull(handlerName, queueOptions);
            const handler = handlers[handlerName];
            queue.process(constants_1.JOB_CONCURRENCY[handlerName], handler)
                .catch(err => logger_1.logger.error('Error in job queue processor %s.', handlerName, { err }));
            queue.on('failed', (job, err) => {
                logger_1.logger.error('Cannot execute job %d in queue %s.', job.id, handlerName, { payload: job.data, err });
            });
            queue.on('error', err => {
                logger_1.logger.error('Error in job queue %s.', handlerName, { err });
            });
            this.queues[handlerName] = queue;
        }
        this.addRepeatableJobs();
    }
    terminate() {
        for (const queueName of Object.keys(this.queues)) {
            const queue = this.queues[queueName];
            queue.close();
        }
    }
    createJob(obj, options = {}) {
        this.createJobWithPromise(obj, options)
            .catch(err => logger_1.logger.error('Cannot create job.', { err, obj }));
    }
    createJobWithPromise(obj, options = {}) {
        const queue = this.queues[obj.type];
        if (queue === undefined) {
            logger_1.logger.error('Unknown queue %s: cannot create job.', obj.type);
            return;
        }
        const jobArgs = {
            backoff: { delay: 60 * 1000, type: 'exponential' },
            attempts: constants_1.JOB_ATTEMPTS[obj.type],
            timeout: constants_1.JOB_TTL[obj.type],
            delay: options.delay
        };
        return queue.add(obj.payload, jobArgs);
    }
    listForApi(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { state, start, count, asc, jobType } = options;
            const states = state ? [state] : jobs_1.jobStates;
            let results = [];
            const filteredJobTypes = this.filterJobTypes(jobType);
            for (const jobType of filteredJobTypes) {
                const queue = this.queues[jobType];
                if (queue === undefined) {
                    logger_1.logger.error('Unknown queue %s to list jobs.', jobType);
                    continue;
                }
                const jobs = yield queue.getJobs(states, 0, start + count, asc);
                results = results.concat(jobs);
            }
            results.sort((j1, j2) => {
                if (j1.timestamp < j2.timestamp)
                    return -1;
                else if (j1.timestamp === j2.timestamp)
                    return 0;
                return 1;
            });
            if (asc === false)
                results.reverse();
            return results.slice(start, start + count);
        });
    }
    count(state, jobType) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const states = state ? [state] : jobs_1.jobStates;
            let total = 0;
            const filteredJobTypes = this.filterJobTypes(jobType);
            for (const type of filteredJobTypes) {
                const queue = this.queues[type];
                if (queue === undefined) {
                    logger_1.logger.error('Unknown queue %s to count jobs.', type);
                    continue;
                }
                const counts = yield queue.getJobCounts();
                for (const s of states) {
                    total += counts[s];
                }
            }
            return total;
        });
    }
    removeOldJobs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const key of Object.keys(this.queues)) {
                const queue = this.queues[key];
                yield queue.clean(constants_1.JOB_COMPLETED_LIFETIME, 'completed');
            }
        });
    }
    addRepeatableJobs() {
        this.queues['videos-views'].add({}, {
            repeat: constants_1.REPEAT_JOBS['videos-views']
        }).catch(err => logger_1.logger.error('Cannot add videos-views repeatable job.', { err }));
        this.queues['premium-storage-checker'].add({}, {
            repeat: constants_1.REPEAT_JOBS['premium-storage-checker']
        }).catch(err => logger_1.logger.error('Cannot add premium-storage-checker repeatable job.', { err }));
    }
    filterJobTypes(jobType) {
        if (!jobType)
            return jobTypes;
        return jobTypes.filter(t => t === jobType);
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.JobQueue = JobQueue;
