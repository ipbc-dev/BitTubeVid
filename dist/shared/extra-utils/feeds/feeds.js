"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJSONfeed = exports.getXMLfeed = void 0;
const request = require("supertest");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getXMLfeed(url, feed, format) {
    const path = '/feeds/' + feed + '.xml';
    return request(url)
        .get(path)
        .query((format) ? { format: format } : {})
        .set('Accept', 'application/xml')
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /xml/);
}
exports.getXMLfeed = getXMLfeed;
function getJSONfeed(url, feed, query = {}, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/feeds/' + feed + '.json';
    return request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json')
        .expect(statusCodeExpected)
        .expect('Content-Type', /json/);
}
exports.getJSONfeed = getJSONfeed;
