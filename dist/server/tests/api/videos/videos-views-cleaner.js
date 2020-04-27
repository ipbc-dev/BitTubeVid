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
const expect = chai.expect;
describe('Test video views cleaner', function () {
    let servers;
    let videoIdServer1;
    let videoIdServer2;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            videoIdServer1 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video server 1' })).uuid;
            videoIdServer2 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video server 2' })).uuid;
            yield extra_utils_1.waitJobs(servers);
            yield extra_utils_1.viewVideo(servers[0].url, videoIdServer1);
            yield extra_utils_1.viewVideo(servers[1].url, videoIdServer1);
            yield extra_utils_1.viewVideo(servers[0].url, videoIdServer2);
            yield extra_utils_1.viewVideo(servers[1].url, videoIdServer2);
            yield extra_utils_1.waitJobs(servers);
        });
    });
    it('Should not clean old video views', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            extra_utils_1.killallServers([servers[0]]);
            yield extra_utils_1.reRunServer(servers[0], { views: { videos: { remote: { max_age: '10 days' } } } });
            yield extra_utils_1.wait(6000);
            {
                for (const server of servers) {
                    const total = yield extra_utils_1.countVideoViewsOf(server.internalServerNumber, videoIdServer1);
                    expect(total).to.equal(2);
                }
            }
            {
                for (const server of servers) {
                    const total = yield extra_utils_1.countVideoViewsOf(server.internalServerNumber, videoIdServer2);
                    expect(total).to.equal(2);
                }
            }
        });
    });
    it('Should clean old video views', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            extra_utils_1.killallServers([servers[0]]);
            yield extra_utils_1.reRunServer(servers[0], { views: { videos: { remote: { max_age: '5 seconds' } } } });
            yield extra_utils_1.wait(6000);
            {
                for (const server of servers) {
                    const total = yield extra_utils_1.countVideoViewsOf(server.internalServerNumber, videoIdServer1);
                    expect(total).to.equal(2);
                }
            }
            {
                const totalServer1 = yield extra_utils_1.countVideoViewsOf(servers[0].internalServerNumber, videoIdServer2);
                expect(totalServer1).to.equal(0);
                const totalServer2 = yield extra_utils_1.countVideoViewsOf(servers[1].internalServerNumber, videoIdServer2);
                expect(totalServer2).to.equal(2);
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.closeAllSequelize(servers);
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
