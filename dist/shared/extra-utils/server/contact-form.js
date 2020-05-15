"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
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
        .expect(options.expectedStatus || 204);
}
exports.sendContactForm = sendContactForm;
