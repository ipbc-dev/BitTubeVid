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
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const contact_form_1 = require("../../../../shared/extra-utils/server/contact-form");
const expect = chai.expect;
describe('Test contact form', function () {
    let server;
    const emails = [];
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const port = yield email_1.MockSmtpServer.Instance.collectEmails(emails);
            const overrideConfig = {
                smtp: {
                    hostname: 'localhost',
                    port
                }
            };
            server = yield extra_utils_1.flushAndRunServer(1, overrideConfig);
            yield extra_utils_1.setAccessTokensToServers([server]);
        });
    });
    it('Should send a contact form', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield contact_form_1.sendContactForm({
                url: server.url,
                fromEmail: 'toto@example.com',
                body: 'my super message',
                subject: 'my subject',
                fromName: 'Super toto'
            });
            yield jobs_1.waitJobs(server);
            expect(emails).to.have.lengthOf(1);
            const email = emails[0];
            expect(email['from'][0]['address']).equal('test-admin@localhost');
            expect(email['from'][0]['name']).equal('toto@example.com');
            expect(email['to'][0]['address']).equal('admin' + server.internalServerNumber + '@example.com');
            expect(email['subject']).contains('my subject');
            expect(email['text']).contains('my super message');
        });
    });
    it('Should not be able to send another contact form because of the anti spam checker', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield contact_form_1.sendContactForm({
                url: server.url,
                fromEmail: 'toto@example.com',
                body: 'my super message',
                subject: 'my subject',
                fromName: 'Super toto'
            });
            yield contact_form_1.sendContactForm({
                url: server.url,
                fromEmail: 'toto@example.com',
                body: 'my super message',
                fromName: 'Super toto',
                subject: 'my subject',
                expectedStatus: 403
            });
        });
    });
    it('Should be able to send another contact form after a while', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.wait(1000);
            yield contact_form_1.sendContactForm({
                url: server.url,
                fromEmail: 'toto@example.com',
                fromName: 'Super toto',
                subject: 'my subject',
                body: 'my super message'
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
