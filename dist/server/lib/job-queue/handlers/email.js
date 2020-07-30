"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEmail = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../../helpers/logger");
const emailer_1 = require("../../emailer");
function processEmail(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        logger_1.logger.info('Processing email in job %d.', job.id);
        return emailer_1.Emailer.Instance.sendMail(payload);
    });
}
exports.processEmail = processEmail;
