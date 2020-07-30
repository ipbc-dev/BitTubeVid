"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFollowRequest = exports.makePOSTAPRequest = void 0;
const tslib_1 = require("tslib");
const requests_1 = require("../../../server/helpers/requests");
const constants_1 = require("../../../server/initializers/constants");
const activitypub_http_utils_1 = require("../../../server/lib/job-queue/handlers/utils/activitypub-http-utils");
const activitypub_1 = require("../../../server/helpers/activitypub");
function makePOSTAPRequest(url, body, httpSignature, headers) {
    const options = {
        method: 'POST',
        uri: url,
        json: body,
        httpSignature,
        headers
    };
    return requests_1.doRequest(options);
}
exports.makePOSTAPRequest = makePOSTAPRequest;
function makeFollowRequest(to, by) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const follow = {
            type: 'Follow',
            id: by.url + '/toto',
            actor: by.url,
            object: to.url
        };
        const body = activitypub_1.activityPubContextify(follow);
        const httpSignature = {
            algorithm: constants_1.HTTP_SIGNATURE.ALGORITHM,
            authorizationHeaderName: constants_1.HTTP_SIGNATURE.HEADER_NAME,
            keyId: by.url,
            key: by.privateKey,
            headers: constants_1.HTTP_SIGNATURE.HEADERS_TO_SIGN
        };
        const headers = activitypub_http_utils_1.buildGlobalHeaders(body);
        return makePOSTAPRequest(to.url, body, httpSignature, headers);
    });
}
exports.makeFollowRequest = makeFollowRequest;
