"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOEmbed = void 0;
const request = require("supertest");
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
        .expect(200);
}
exports.getOEmbed = getOEmbed;
