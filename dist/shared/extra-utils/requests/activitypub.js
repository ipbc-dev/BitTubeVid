"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
    return __awaiter(this, void 0, void 0, function* () {
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
