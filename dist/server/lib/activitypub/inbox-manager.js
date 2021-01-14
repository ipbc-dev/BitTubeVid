"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxManager = void 0;
const async_1 = require("async");
const logger_1 = require("@server/helpers/logger");
const constants_1 = require("@server/initializers/constants");
const process_1 = require("./process");
const stat_manager_1 = require("../stat-manager");
class InboxManager {
    constructor() {
        this.messagesProcessed = 0;
        this.inboxQueue = async_1.queue((task, cb) => {
            const options = { signatureActor: task.signatureActor, inboxActor: task.inboxActor };
            this.messagesProcessed++;
            process_1.processActivities(task.activities, options)
                .then(() => cb())
                .catch(err => {
                logger_1.logger.error('Error in process activities.', { err });
                cb();
            });
        });
        setInterval(() => {
            stat_manager_1.StatsManager.Instance.updateInboxStats(this.messagesProcessed, this.inboxQueue.length());
        }, constants_1.SCHEDULER_INTERVALS_MS.updateInboxStats);
    }
    addInboxMessage(options) {
        this.inboxQueue.push(options);
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.InboxManager = InboxManager;
