"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDebug = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../core-utils/miscs/http-error-codes");
function getDebug(url, token) {
    const path = '/api/v1/server/debug';
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.getDebug = getDebug;
