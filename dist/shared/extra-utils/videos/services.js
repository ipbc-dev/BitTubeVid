"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOEmbed = void 0;
const request = require("supertest");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function getOEmbed(url, oembedUrl, format, maxHeight, maxWidth) {
    const path = '/services/oembed';
    const query = {
        url: oembedUrl,
        format,
        maxheight: maxHeight,
        maxwidth: maxWidth
    };
    return request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json')
        .expect(http_error_codes_1.HttpStatusCode.OK_200);
}
exports.getOEmbed = getOEmbed;
