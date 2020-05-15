"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_1 = require("../requests/requests");
function getLogs(url, accessToken, startDate, endDate, level) {
    const path = '/api/v1/server/logs';
    return requests_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        query: { startDate, endDate, level },
        statusCodeExpected: 200
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
        statusCodeExpected: 200
    });
}
exports.getAuditLogs = getAuditLogs;
