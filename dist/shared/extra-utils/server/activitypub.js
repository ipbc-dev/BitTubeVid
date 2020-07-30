"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeActivityPubGetRequest = void 0;
const request = require("supertest");
function makeActivityPubGetRequest(url, path, expectedStatus = 200) {
    return request(url)
        .get(path)
        .set('Accept', 'application/activity+json,text/html;q=0.9,\\*/\\*;q=0.8')
        .expect(expectedStatus);
}
exports.makeActivityPubGetRequest = makeActivityPubGetRequest;
