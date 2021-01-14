"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedVideoChannelSearch = exports.searchVideoChannel = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function searchVideoChannel(url, search, token, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/search/video-channels';
    return requests_1.makeGetRequest({
        url,
        path,
        query: {
            sort: '-createdAt',
            search
        },
        token,
        statusCodeExpected
    });
}
exports.searchVideoChannel = searchVideoChannel;
function advancedVideoChannelSearch(url, search) {
    const path = '/api/v1/search/video-channels';
    return requests_1.makeGetRequest({
        url,
        path,
        query: search,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200
    });
}
exports.advancedVideoChannelSearch = advancedVideoChannelSearch;
