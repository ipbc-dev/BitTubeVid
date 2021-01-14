"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeActivityPubGetRequest = void 0;
const request = require("supertest");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function makeActivityPubGetRequest(url, path, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    return request(url)
        .get(path)
        .set('Accept', 'application/activity+json,text/html;q=0.9,\\*/\\*;q=0.8')
        .expect(expectedStatus);
}
exports.makeActivityPubGetRequest = makeActivityPubGetRequest;
