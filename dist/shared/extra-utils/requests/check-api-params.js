"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBadSortPagination = exports.checkBadCountPagination = exports.checkBadStartPagination = void 0;
const tslib_1 = require("tslib");
const requests_1 = require("./requests");
const miscs_1 = require("../miscs/miscs");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function checkBadStartPagination(url, path, token, query = {}) {
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query: miscs_1.immutableAssign(query, { start: 'hello' }),
        statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
    });
}
exports.checkBadStartPagination = checkBadStartPagination;
function checkBadCountPagination(url, path, token, query = {}) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield requests_1.makeGetRequest({
            url,
            path,
            token,
            query: miscs_1.immutableAssign(query, { count: 'hello' }),
            statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
        });
        yield requests_1.makeGetRequest({
            url,
            path,
            token,
            query: miscs_1.immutableAssign(query, { count: 2000 }),
            statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
        });
    });
}
exports.checkBadCountPagination = checkBadCountPagination;
function checkBadSortPagination(url, path, token, query = {}) {
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query: miscs_1.immutableAssign(query, { sort: 'hello' }),
        statusCodeExpected: http_error_codes_1.HttpStatusCode.BAD_REQUEST_400
    });
}
exports.checkBadSortPagination = checkBadSortPagination;
