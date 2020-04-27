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
const index_1 = require("../../../../shared/extra-utils/index");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const videos_1 = require("../../../../shared/extra-utils/videos/videos");
const logs_1 = require("../../../../shared/extra-utils/logs/logs");
const expect = chai.expect;
describe('Test logs', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield index_1.flushAndRunServer(1);
            yield index_1.setAccessTokensToServers([server]);
        });
    });
    describe('With the standard log file', function () {
        it('Should get logs with a start date', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 1' });
                yield jobs_1.waitJobs([server]);
                const now = new Date();
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 2' });
                yield jobs_1.waitJobs([server]);
                const res = yield logs_1.getLogs(server.url, server.accessToken, now);
                const logsString = JSON.stringify(res.body);
                expect(logsString.includes('video 1')).to.be.false;
                expect(logsString.includes('video 2')).to.be.true;
            });
        });
        it('Should get logs with an end date', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 3' });
                yield jobs_1.waitJobs([server]);
                const now1 = new Date();
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 4' });
                yield jobs_1.waitJobs([server]);
                const now2 = new Date();
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 5' });
                yield jobs_1.waitJobs([server]);
                const res = yield logs_1.getLogs(server.url, server.accessToken, now1, now2);
                const logsString = JSON.stringify(res.body);
                expect(logsString.includes('video 3')).to.be.false;
                expect(logsString.includes('video 4')).to.be.true;
                expect(logsString.includes('video 5')).to.be.false;
            });
        });
        it('Should get filter by level', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const now = new Date();
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 6' });
                yield jobs_1.waitJobs([server]);
                {
                    const res = yield logs_1.getLogs(server.url, server.accessToken, now, undefined, 'info');
                    const logsString = JSON.stringify(res.body);
                    expect(logsString.includes('video 6')).to.be.true;
                }
                {
                    const res = yield logs_1.getLogs(server.url, server.accessToken, now, undefined, 'warn');
                    const logsString = JSON.stringify(res.body);
                    expect(logsString.includes('video 6')).to.be.false;
                }
            });
        });
    });
    describe('With the audit log', function () {
        it('Should get logs with a start date', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 7' });
                yield jobs_1.waitJobs([server]);
                const now = new Date();
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 8' });
                yield jobs_1.waitJobs([server]);
                const res = yield logs_1.getAuditLogs(server.url, server.accessToken, now);
                const logsString = JSON.stringify(res.body);
                expect(logsString.includes('video 7')).to.be.false;
                expect(logsString.includes('video 8')).to.be.true;
                expect(res.body).to.have.lengthOf(1);
                const item = res.body[0];
                const message = JSON.parse(item.message);
                expect(message.domain).to.equal('videos');
                expect(message.action).to.equal('create');
            });
        });
        it('Should get logs with an end date', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 9' });
                yield jobs_1.waitJobs([server]);
                const now1 = new Date();
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 10' });
                yield jobs_1.waitJobs([server]);
                const now2 = new Date();
                yield videos_1.uploadVideo(server.url, server.accessToken, { name: 'video 11' });
                yield jobs_1.waitJobs([server]);
                const res = yield logs_1.getAuditLogs(server.url, server.accessToken, now1, now2);
                const logsString = JSON.stringify(res.body);
                expect(logsString.includes('video 9')).to.be.false;
                expect(logsString.includes('video 10')).to.be.true;
                expect(logsString.includes('video 11')).to.be.false;
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests([server]);
        });
    });
});
