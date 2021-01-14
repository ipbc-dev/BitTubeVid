"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getStats(url, useCache = false) {
    const path = '/api/v1/server/stats';
    const query = {
        t: useCache ? undefined : new Date().getTime()
    };
    return requests_1.makeGetRequest({
        url,
        path,
        query,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getStats = getStats;
