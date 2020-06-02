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
const lodash_1 = require("lodash");
const requests_1 = require("@server/helpers/requests");
const job_queue_1 = require("@server/lib/job-queue");
const actor_follow_1 = require("@server/models/activitypub/actor-follow");
const application_1 = require("@server/models/application/application");
const logger_1 = require("../../helpers/logger");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const abstract_scheduler_1 = require("./abstract-scheduler");
class AutoFollowIndexInstances extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = constants_1.SCHEDULER_INTERVALS_MS.autoFollowIndexInstances;
    }
    internalExecute() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.autoFollow();
        });
    }
    autoFollow() {
        return __awaiter(this, void 0, void 0, function* () {
            if (config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_INDEX.ENABLED === false)
                return;
            const indexUrl = config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_INDEX.INDEX_URL;
            logger_1.logger.info('Auto follow instances of index %s.', indexUrl);
            try {
                const serverActor = yield application_1.getServerActor();
                const qs = { count: 1000 };
                if (this.lastCheck)
                    Object.assign(qs, { since: this.lastCheck.toISOString() });
                this.lastCheck = new Date();
                const { body } = yield requests_1.doRequest({ uri: indexUrl, qs, json: true });
                if (!body.data || Array.isArray(body.data) === false) {
                    logger_1.logger.error('Cannot auto follow instances of index %s. Please check the auto follow URL.', indexUrl, { body });
                    return;
                }
                const hosts = body.data.map(o => o.host);
                const chunks = lodash_1.chunk(hosts, 20);
                for (const chunk of chunks) {
                    const unfollowedHosts = yield actor_follow_1.ActorFollowModel.keepUnfollowedInstance(chunk);
                    for (const unfollowedHost of unfollowedHosts) {
                        const payload = {
                            host: unfollowedHost,
                            name: constants_1.SERVER_ACTOR_NAME,
                            followerActorId: serverActor.id,
                            isAutoFollow: true
                        };
                        job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-follow', payload });
                    }
                }
            }
            catch (err) {
                logger_1.logger.error('Cannot auto follow hosts of index %s.', indexUrl, { err });
            }
        });
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.AutoFollowIndexInstances = AutoFollowIndexInstances;
