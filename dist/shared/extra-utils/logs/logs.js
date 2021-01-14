"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.getLogs = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getLogs(url, accessToken, startDate, endDate, level) {
    const path = '/api/v1/server/logs';
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        query: { startDate, endDate, level },
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getLogs = getLogs;
function getAuditLogs(url, accessToken, startDate, endDate) {
    const path = '/api/v1/server/audit-logs';
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        query: { startDate, endDate },
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getAuditLogs = getAuditLogs;
