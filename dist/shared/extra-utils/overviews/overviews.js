"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideosOverviewWithToken = exports.getVideosOverview = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getVideosOverview(url, page, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/overviews/videos';
    const query = { page };
    return requests_1.makeGetRequest({
        url,
        path,
        query,
        statusCodeExpected
    });
}
exports.getVideosOverview = getVideosOverview;
function getVideosOverviewWithToken(url, page, token, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/overviews/videos';
    const query = { page };
    return requests_1.makeGetRequest({
        url,
        path,
        query,
        token,
        statusCodeExpected
    });
}
exports.getVideosOverviewWithToken = getVideosOverviewWithToken;
