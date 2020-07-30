"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const contact_form_1 = require("../../../../shared/extra-utils/server/contact-form");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
describe('Test contact form API validators', function () {
    let server;
    const emails = [];
    const defaultBody = {
        fromName: 'super name',
        fromEmail: 'toto@example.com',
        subject: 'my subject',
        body: 'Hello, how are you?'
    };
    let emailPort;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            emailPort = yield email_1.MockSmtpServer.Instance.collectEmails(emails);
            server = yield extra_utils_1.flushAndRunServer(1);
        });
    });
    it('Should not accept a contact form if emails are disabled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 409 }));
        });
    });
    it('Should not accept a contact form if it is disabled in the configuration', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server, { smtp: { hostname: 'localhost', port: emailPort }, contact_form: { enabled: false } });
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 409 }));
        });
    });
    it('Should not accept a contact form if from email is invalid', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server, { smtp: { hostname: 'localhost', port: emailPort } });
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, fromEmail: 'badEmail' }));
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, fromEmail: 'badEmail@' }));
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, fromEmail: undefined }));
        });
    });
    it('Should not accept a contact form if from name is invalid', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, fromName: 'name'.repeat(100) }));
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, fromName: '' }));
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, fromName: undefined }));
        });
    });
    it('Should not accept a contact form if body is invalid', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, body: 'body'.repeat(5000) }));
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, body: 'a' }));
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url, expectedStatus: 400, body: undefined }));
        });
    });
    it('Should accept a contact form with the correct parameters', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield contact_form_1.sendContactForm(extra_utils_1.immutableAssign(defaultBody, { url: server.url }));
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
