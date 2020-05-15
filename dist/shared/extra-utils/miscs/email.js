"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const miscs_1 = require("../../core-utils/miscs/miscs");
const servers_1 = require("../server/servers");
class MockSmtpServer {
    constructor() {
        this.started = false;
        this.emailChildProcess = child_process_1.fork(`${__dirname}/email-child-process`, []);
        this.emailChildProcess.on('message', (msg) => {
            if (msg.email) {
                return this.emails.push(msg.email);
            }
        });
        process.on('exit', () => this.kill());
    }
    collectEmails(emailsCollection) {
        return new Promise((res, rej) => {
            const port = servers_1.parallelTests() ? miscs_1.randomInt(1000, 2000) : 1025;
            if (this.started) {
                this.emails = emailsCollection;
                return res();
            }
            this.emailChildProcess.send({ start: true, port });
            this.emailChildProcess.on('exit', () => {
                return rej(new Error('maildev exited unexpectedly, confirm port not in use'));
            });
            this.emailChildProcess.on('message', (msg) => {
                if (msg.err) {
                    return rej(new Error(msg.err));
                }
                this.started = true;
                this.emails = emailsCollection;
                return res(port);
            });
        });
    }
    kill() {
        if (!this.emailChildProcess)
            return;
        process.kill(this.emailChildProcess.pid);
        this.emailChildProcess = null;
        MockSmtpServer.instance = null;
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.MockSmtpServer = MockSmtpServer;
