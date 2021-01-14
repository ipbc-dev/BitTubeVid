"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = void 0;
const request = require("supertest");
const url_1 = require("url");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getClient(url) {
    const path = '/api/v1/oauth-clients/local';
    return request(url)
        .get(path)
        .set('Host', new url_1.URL(url).host)
        .set('Accept', 'application/json')
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getClient = getClient;
