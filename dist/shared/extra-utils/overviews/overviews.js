"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideosOverviewWithToken = exports.getVideosOverview = void 0;
const requests_1 = require("../requests/requests");
function getVideosOverview(url, page, statusCodeExpected = 200) {
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
function getVideosOverviewWithToken(url, page, token, statusCodeExpected = 200) {
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
