"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesAbuseExist = void 0;
const tslib_1 = require("tslib");
const abuse_1 = require("../../models/abuse/abuse");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function doesAbuseExist(abuseId, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuse = yield abuse_1.AbuseModel.loadByIdWithReporter(parseInt(abuseId + '', 10));
        if (!abuse) {
            res.status(http_error_codes_1.HttpStatusCode.NOT_FOUND_404)
                .json({ error: 'Abuse not found' });
            return false;
        }
        res.locals.abuse = abuse;
        return true;
    });
}
exports.doesAbuseExist = doesAbuseExist;
