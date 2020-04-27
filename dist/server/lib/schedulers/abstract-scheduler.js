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
        return __awaiter(this, void 0, void 0, function* () {
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
