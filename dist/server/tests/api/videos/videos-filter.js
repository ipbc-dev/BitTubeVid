"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const users_1 = require("../../../../shared/models/users");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
function getVideosNames(server, token, filter, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const paths = [
            '/api/v1/video-channels/root_channel/videos',
            '/api/v1/accounts/root/videos',
            '/api/v1/videos',
            '/api/v1/search/videos'
        ];
        const videosResults = [];
        for (const path of paths) {
            const res = yield extra_utils_1.makeGetRequest({
                url: server.url,
                path,
                token,
                query: {
                    sort: 'createdAt',
                    filter
                },
                statusCodeExpected
            });
            videosResults.push(res.body.data.map(v => v.name));
        }
        return videosResults;
    });
}
describe('Test videos filter validator', function () {
    let servers;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            for (const server of servers) {
                const moderator = { username: 'moderator', password: 'my super password' };
                yield extra_utils_1.createUser({
                    url: server.url,
                    accessToken: server.accessToken,
                    username: moderator.username,
                    password: moderator.password,
                    videoQuota: undefined,
                    videoQuotaDaily: undefined,
                    role: users_1.UserRole.MODERATOR
                });
                server['moderatorAccessToken'] = yield extra_utils_1.userLogin(server, moderator);
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'public ' + server.serverNumber });
                {
                    const attributes = { name: 'unlisted ' + server.serverNumber, privacy: 2 };
                    yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes);
                }
                {
                    const attributes = { name: 'private ' + server.serverNumber, privacy: 3 };
                    yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes);
                }
            }
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('Check videos filter', function () {
        it('Should display local videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    const namesResults = yield getVideosNames(server, server.accessToken, 'local');
                    for (const names of namesResults) {
                        expect(names).to.have.lengthOf(1);
                        expect(names[0]).to.equal('public ' + server.serverNumber);
                    }
                }
            });
        });
        it('Should display all local videos by the admin or the moderator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    for (const token of [server.accessToken, server['moderatorAccessToken']]) {
                        const namesResults = yield getVideosNames(server, token, 'all-local');
                        for (const names of namesResults) {
                            expect(names).to.have.lengthOf(3);
                            expect(names[0]).to.equal('public ' + server.serverNumber);
                            expect(names[1]).to.equal('unlisted ' + server.serverNumber);
                            expect(names[2]).to.equal('private ' + server.serverNumber);
                        }
                    }
                }
            });
        });
        it('Should display all videos by the admin or the moderator', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const server of servers) {
                    for (const token of [server.accessToken, server['moderatorAccessToken']]) {
                        const [channelVideos, accountVideos, videos, searchVideos] = yield getVideosNames(server, token, 'all');
                        expect(channelVideos).to.have.lengthOf(3);
                        expect(accountVideos).to.have.lengthOf(3);
                        expect(videos).to.have.lengthOf(5);
                        expect(searchVideos).to.have.lengthOf(5);
                    }
                }
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
