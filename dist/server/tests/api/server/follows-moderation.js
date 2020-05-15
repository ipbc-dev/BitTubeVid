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
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
function checkServer1And2HasFollowers(servers, state = 'accepted') {
    return __awaiter(this, void 0, void 0, function* () {
        {
            const res = yield follows_1.getFollowingListPaginationAndSort({ url: servers[0].url, start: 0, count: 5, sort: 'createdAt' });
            expect(res.body.total).to.equal(1);
            const follow = res.body.data[0];
            expect(follow.state).to.equal(state);
            expect(follow.follower.url).to.equal('http://localhost:' + servers[0].port + '/accounts/peertube');
            expect(follow.following.url).to.equal('http://localhost:' + servers[1].port + '/accounts/peertube');
        }
        {
            const res = yield follows_1.getFollowersListPaginationAndSort({ url: servers[1].url, start: 0, count: 5, sort: 'createdAt' });
            expect(res.body.total).to.equal(1);
            const follow = res.body.data[0];
            expect(follow.state).to.equal(state);
            expect(follow.follower.url).to.equal('http://localhost:' + servers[0].port + '/accounts/peertube');
            expect(follow.following.url).to.equal('http://localhost:' + servers[1].port + '/accounts/peertube');
        }
    });
}
function checkNoFollowers(servers) {
    return __awaiter(this, void 0, void 0, function* () {
        {
            const res = yield follows_1.getFollowingListPaginationAndSort({ url: servers[0].url, start: 0, count: 5, sort: 'createdAt' });
            expect(res.body.total).to.equal(0);
        }
        {
            const res = yield follows_1.getFollowersListPaginationAndSort({ url: servers[1].url, start: 0, count: 5, sort: 'createdAt' });
            expect(res.body.total).to.equal(0);
        }
    });
}
describe('Test follows moderation', function () {
    let servers = [];
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield index_1.flushAndRunMultipleServers(3);
            yield index_1.setAccessTokensToServers(servers);
        });
    });
    it('Should have server 1 following server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield follows_1.follow(servers[0].url, [servers[1].url], servers[0].accessToken);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have correct follows', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield checkServer1And2HasFollowers(servers);
        });
    });
    it('Should remove follower on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield follows_1.removeFollower(servers[1].url, servers[1].accessToken, servers[0]);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should not not have follows anymore', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield checkNoFollowers(servers);
        });
    });
    it('Should disable followers on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const subConfig = {
                followers: {
                    instance: {
                        enabled: false,
                        manualApproval: false
                    }
                }
            };
            yield index_1.updateCustomSubConfig(servers[1].url, servers[1].accessToken, subConfig);
            yield follows_1.follow(servers[0].url, [servers[1].url], servers[0].accessToken);
            yield jobs_1.waitJobs(servers);
            yield checkNoFollowers(servers);
        });
    });
    it('Should re enable followers on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const subConfig = {
                followers: {
                    instance: {
                        enabled: true,
                        manualApproval: false
                    }
                }
            };
            yield index_1.updateCustomSubConfig(servers[1].url, servers[1].accessToken, subConfig);
            yield follows_1.follow(servers[0].url, [servers[1].url], servers[0].accessToken);
            yield jobs_1.waitJobs(servers);
            yield checkServer1And2HasFollowers(servers);
        });
    });
    it('Should manually approve followers', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield follows_1.removeFollower(servers[1].url, servers[1].accessToken, servers[0]);
            yield jobs_1.waitJobs(servers);
            const subConfig = {
                followers: {
                    instance: {
                        enabled: true,
                        manualApproval: true
                    }
                }
            };
            yield index_1.updateCustomSubConfig(servers[1].url, servers[1].accessToken, subConfig);
            yield index_1.updateCustomSubConfig(servers[2].url, servers[2].accessToken, subConfig);
            yield follows_1.follow(servers[0].url, [servers[1].url], servers[0].accessToken);
            yield jobs_1.waitJobs(servers);
            yield checkServer1And2HasFollowers(servers, 'pending');
        });
    });
    it('Should accept a follower', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.acceptFollower(servers[1].url, servers[1].accessToken, 'peertube@localhost:' + servers[0].port);
            yield jobs_1.waitJobs(servers);
            yield checkServer1And2HasFollowers(servers);
        });
    });
    it('Should reject another follower', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield follows_1.follow(servers[0].url, [servers[2].url], servers[0].accessToken);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield follows_1.getFollowingListPaginationAndSort({ url: servers[0].url, start: 0, count: 5, sort: 'createdAt' });
                expect(res.body.total).to.equal(2);
            }
            {
                const res = yield follows_1.getFollowersListPaginationAndSort({ url: servers[1].url, start: 0, count: 5, sort: 'createdAt' });
                expect(res.body.total).to.equal(1);
            }
            {
                const res = yield follows_1.getFollowersListPaginationAndSort({ url: servers[2].url, start: 0, count: 5, sort: 'createdAt' });
                expect(res.body.total).to.equal(1);
            }
            yield follows_1.rejectFollower(servers[2].url, servers[2].accessToken, 'peertube@localhost:' + servers[0].port);
            yield jobs_1.waitJobs(servers);
            yield checkServer1And2HasFollowers(servers);
            {
                const res = yield follows_1.getFollowersListPaginationAndSort({ url: servers[2].url, start: 0, count: 5, sort: 'createdAt' });
                expect(res.body.total).to.equal(0);
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
