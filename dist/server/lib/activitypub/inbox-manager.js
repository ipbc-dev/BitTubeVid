"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxManager = void 0;
const async_1 = require("async");
const logger_1 = require("@server/helpers/logger");
const constants_1 = require("@server/initializers/constants");
const stat_manager_1 = require("../stat-manager");
const process_1 = require("./process");
class InboxManager {
    constructor() {
        this.inboxQueue = async_1.queue((task, cb) => {
            const options = { signatureActor: task.signatureActor, inboxActor: task.inboxActor };
            process_1.processActivities(task.activities, options)
                .then(() => cb())
                .catch(err => {
                logger_1.logger.error('Error in process activities.', { err });
                cb();
            });
        });
        setInterval(() => {
            stat_manager_1.StatsManager.Instance.updateInboxWaiting(this.getActivityPubMessagesWaiting());
        }, constants_1.SCHEDULER_INTERVALS_MS.updateInboxStats);
    }
    addInboxMessage(options) {
        this.inboxQueue.push(options)
            .catch(err => logger_1.logger.error('Cannot add options in inbox queue.', { options, err }));
    }
    getActivityPubMessagesWaiting() {
        return this.inboxQueue.length() + this.inboxQueue.running();
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.InboxManager = InboxManager;
