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
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const chai = require("chai");
const expect = chai.expect;
describe('Test ActivityPub fetcher', function () {
    let servers;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3);
            yield extra_utils_1.setAccessTokensToServers(servers);
            const user = { username: 'user1', password: 'password' };
            for (const server of servers) {
                yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
            }
            const userAccessToken = yield extra_utils_1.userLogin(servers[0], user);
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video root' });
            const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'bad video root' });
            const badVideoUUID = res.body.video.uuid;
            yield extra_utils_1.uploadVideo(servers[0].url, userAccessToken, { name: 'video user' });
            {
                const to = 'http://localhost:' + servers[0].port + '/accounts/user1';
                const value = 'http://localhost:' + servers[1].port + '/accounts/user1';
                yield extra_utils_1.setActorField(servers[0].internalServerNumber, to, 'url', value);
            }
            {
                const value = 'http://localhost:' + servers[2].port + '/videos/watch/' + badVideoUUID;
                yield extra_utils_1.setVideoField(servers[0].internalServerNumber, badVideoUUID, 'url', value);
            }
        });
    });
    it('Should add only the video with a valid actor URL', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.waitJobs(servers);
            {
                const res = yield extra_utils_1.getVideosListSort(servers[0].url, 'createdAt');
                expect(res.body.total).to.equal(3);
                const data = res.body.data;
                expect(data[0].name).to.equal('video root');
                expect(data[1].name).to.equal('bad video root');
                expect(data[2].name).to.equal('video user');
            }
            {
                const res = yield extra_utils_1.getVideosListSort(servers[1].url, 'createdAt');
                expect(res.body.total).to.equal(1);
                const data = res.body.data;
                expect(data[0].name).to.equal('video root');
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.cleanupTests(servers);
            yield extra_utils_1.closeAllSequelize(servers);
        });
    });
});
