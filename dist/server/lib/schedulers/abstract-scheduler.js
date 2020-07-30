"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractScheduler = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../helpers/logger");
class AbstractScheduler {
    constructor() {
        this.isRunning = false;
    }
    enable() {
        if (!this.schedulerIntervalMs)
            throw new Error('Interval is not correctly set.');
        this.interval = setInterval(() => this.execute(), this.schedulerIntervalMs);
    }
    disable() {
        clearInterval(this.interval);
    }
    execute() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isRunning === true)
                return;
            this.isRunning = true;
            try {
                yield this.internalExecute();
            }
            catch (err) {
                logger_1.logger.error('Cannot execute %s scheduler.', this.constructor.name, { err });
            }
            finally {
                this.isRunning = false;
            }
        });
    }
}
exports.AbstractScheduler = AbstractScheduler;
