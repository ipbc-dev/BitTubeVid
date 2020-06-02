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
const Bull = require("bull");
const logger_1 = require("../../helpers/logger");
const redis_1 = require("../redis");
const constants_1 = require("../../initializers/constants");
const activitypub_http_broadcast_1 = require("./handlers/activitypub-http-broadcast");
const activitypub_http_fetcher_1 = require("./handlers/activitypub-http-fetcher");
const activitypub_http_unicast_1 = require("./handlers/activitypub-http-unicast");
const email_1 = require("./handlers/email");
const video_transcoding_1 = require("./handlers/video-transcoding");
const activitypub_follow_1 = require("./handlers/activitypub-follow");
const video_import_1 = require("./handlers/video-import");
const video_views_1 = require("./handlers/video-views");
const activitypub_refresher_1 = require("./handlers/activitypub-refresher");
const video_file_import_1 = require("./handlers/video-file-import");
const video_redundancy_1 = require("@server/lib/job-queue/handlers/video-redundancy");
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
    'activitypub-refresher': activitypub_refresher_1.refreshAPObject,
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
    'activitypub-refresher',
    'video-redundancy'
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
    createJob(obj) {
        this.createJobWithPromise(obj)
            .catch(err => logger_1.logger.error('Cannot create job.', { err, obj }));
    }
    createJobWithPromise(obj) {
        const queue = this.queues[obj.type];
        if (queue === undefined) {
            logger_1.logger.error('Unknown queue %s: cannot create job.', obj.type);
            return;
        }
        const jobArgs = {
            backoff: { delay: 60 * 1000, type: 'exponential' },
            attempts: constants_1.JOB_ATTEMPTS[obj.type],
            timeout: constants_1.JOB_TTL[obj.type]
        };
        return queue.add(obj.payload, jobArgs);
    }
    listForApi(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { state, start, count, asc, jobType } = options;
            let results = [];
            const filteredJobTypes = this.filterJobTypes(jobType);
            for (const jobType of filteredJobTypes) {
                const queue = this.queues[jobType];
                if (queue === undefined) {
                    logger_1.logger.error('Unknown queue %s to list jobs.', jobType);
                    continue;
                }
                const jobs = yield queue.getJobs([state], 0, start + count, asc);
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
        return __awaiter(this, void 0, void 0, function* () {
            let total = 0;
            const filteredJobTypes = this.filterJobTypes(jobType);
            for (const type of filteredJobTypes) {
                const queue = this.queues[type];
                if (queue === undefined) {
                    logger_1.logger.error('Unknown queue %s to count jobs.', type);
                    continue;
                }
                const counts = yield queue.getJobCounts();
                total += counts[state];
            }
            return total;
        });
    }
    removeOldJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of Object.keys(this.queues)) {
                const queue = this.queues[key];
                yield queue.clean(constants_1.JOB_COMPLETED_LIFETIME, 'completed');
            }
        });
    }
    addRepeatableJobs() {
        this.queues['videos-views'].add({}, {
            repeat: constants_1.REPEAT_JOBS['videos-views']
        }).catch(err => logger_1.logger.error('Cannot add repeatable job.', { err }));
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
