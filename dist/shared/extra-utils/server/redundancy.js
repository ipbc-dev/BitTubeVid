"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_1 = require("../requests/requests");
function updateRedundancy(url, accessToken, host, redundancyAllowed, expectedStatus = 204) {
    const path = '/api/v1/server/redundancy/' + host;
    return requests_1.makePutBodyRequest({
        url,
        path,
        token: accessToken,
        fields: { redundancyAllowed },
        statusCodeExpected: expectedStatus
    });
}
exports.updateRedundancy = updateRedundancy;
function listVideoRedundancies(options) {
    const path = '/api/v1/server/redundancy/videos';
    const { url, accessToken, target, statusCodeExpected, start, count, sort } = options;
    return requests_1.makeGetRequest({
        url,
        token: accessToken,
        path,
        query: {
            start: (start !== null && start !== void 0 ? start : 0),
            count: (count !== null && count !== void 0 ? count : 5),
            sort: (sort !== null && sort !== void 0 ? sort : 'name'),
            target
        },
        statusCodeExpected: statusCodeExpected || 200
    });
}
exports.listVideoRedundancies = listVideoRedundancies;
function addVideoRedundancy(options) {
    const path = '/api/v1/server/redundancy/videos';
    const { url, accessToken, videoId } = options;
    return requests_1.makePostBodyRequest({
        url,
        token: accessToken,
        path,
        fields: { videoId },
        statusCodeExpected: 204
    });
}
exports.addVideoRedundancy = addVideoRedundancy;
function removeVideoRedundancy(options) {
    const { url, accessToken, redundancyId } = options;
    const path = '/api/v1/server/redundancy/videos/' + redundancyId;
    return requests_1.makeDeleteRequest({
        url,
        token: accessToken,
        path,
        statusCodeExpected: 204
    });
}
exports.removeVideoRedundancy = removeVideoRedundancy;
