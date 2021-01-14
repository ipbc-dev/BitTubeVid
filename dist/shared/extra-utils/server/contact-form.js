"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContactForm = void 0;
const request = require("supertest");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function sendContactForm(options) {
    const path = '/api/v1/server/contact';
    const body = {
        fromEmail: options.fromEmail,
        fromName: options.fromName,
        subject: options.subject,
        body: options.body
    };
    return request(options.url)
        .post(path)
        .send(body)
        .expect(options.expectedStatus || http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
}
exports.sendContactForm = sendContactForm;
