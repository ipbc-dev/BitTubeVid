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
function checkFollow(follower, following, exists) {
    return __awaiter(this, void 0, void 0, function* () {
        {
            const res = yield follows_1.getFollowersListPaginationAndSort({ url: following.url, start: 0, count: 5, sort: '-createdAt' });
            const follows = res.body.data;
            const follow = follows.find(f => {
                return f.follower.host === follower.host && f.state === 'accepted';
            });
            if (exists === true) {
                expect(follow).to.exist;
            }
            else {
                expect(follow).to.be.undefined;
            }
        }
        {
            const res = yield follows_1.getFollowingListPaginationAndSort({ url: follower.url, start: 0, count: 5, sort: '-createdAt' });
            const follows = res.body.data;
            const follow = follows.find(f => {
                return f.following.host === following.host && f.state === 'accepted';
            });
            if (exists === true) {
                expect(follow).to.exist;
            }
            else {
                expect(follow).to.be.undefined;
            }
        }
    });
}
function server1Follows2(servers) {
    return __awaiter(this, void 0, void 0, function* () {
        yield follows_1.follow(servers[0].url, [servers[1].host], servers[0].accessToken);
        yield jobs_1.waitJobs(servers);
    });
}
function resetFollows(servers) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield index_1.unfollow(servers[0].url, servers[0].accessToken, servers[1]);
            yield index_1.unfollow(servers[1].url, servers[1].accessToken, servers[0]);
        }
        catch (_a) { }
        yield jobs_1.waitJobs(servers);
        yield checkFollow(servers[0], servers[1], false);
        yield checkFollow(servers[1], servers[0], false);
    });
}
describe('Test auto follows', function () {
    let servers = [];
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield index_1.flushAndRunMultipleServers(3);
            yield index_1.setAccessTokensToServers(servers);
        });
    });
    describe('Auto follow back', function () {
        it('Should not auto follow back if the option is not enabled', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                yield server1Follows2(servers);
                yield checkFollow(servers[0], servers[1], true);
                yield checkFollow(servers[1], servers[0], false);
                yield resetFollows(servers);
            });
        });
        it('Should auto follow back on auto accept if the option is enabled', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                const config = {
                    followings: {
                        instance: {
                            autoFollowBack: { enabled: true }
                        }
                    }
                };
                yield index_1.updateCustomSubConfig(servers[1].url, servers[1].accessToken, config);
                yield server1Follows2(servers);
                yield checkFollow(servers[0], servers[1], true);
                yield checkFollow(servers[1], servers[0], true);
                yield resetFollows(servers);
            });
        });
        it('Should wait the acceptation before auto follow back', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const config = {
                    followings: {
                        instance: {
                            autoFollowBack: { enabled: true }
                        }
                    },
                    followers: {
                        instance: {
                            manualApproval: true
                        }
                    }
                };
                yield index_1.updateCustomSubConfig(servers[1].url, servers[1].accessToken, config);
                yield server1Follows2(servers);
                yield checkFollow(servers[0], servers[1], false);
                yield checkFollow(servers[1], servers[0], false);
                yield index_1.acceptFollower(servers[1].url, servers[1].accessToken, 'peertube@' + servers[0].host);
                yield jobs_1.waitJobs(servers);
                yield checkFollow(servers[0], servers[1], true);
                yield checkFollow(servers[1], servers[0], true);
                yield resetFollows(servers);
                config.followings.instance.autoFollowBack.enabled = false;
                config.followers.instance.manualApproval = false;
                yield index_1.updateCustomSubConfig(servers[1].url, servers[1].accessToken, config);
            });
        });
    });
    describe('Auto follow index', function () {
        const instanceIndexServer = new index_1.MockInstancesIndex();
        before(() => __awaiter(this, void 0, void 0, function* () {
            yield instanceIndexServer.initialize();
        }));
        it('Should not auto follow index if the option is not enabled', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield index_1.wait(5000);
                yield jobs_1.waitJobs(servers);
                yield checkFollow(servers[0], servers[1], false);
                yield checkFollow(servers[1], servers[0], false);
            });
        });
        it('Should auto follow the index', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                instanceIndexServer.addInstance(servers[1].host);
                const config = {
                    followings: {
                        instance: {
                            autoFollowIndex: {
                                indexUrl: 'http://localhost:42100',
                                enabled: true
                            }
                        }
                    }
                };
                yield index_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield index_1.wait(5000);
                yield jobs_1.waitJobs(servers);
                yield checkFollow(servers[0], servers[1], true);
                yield resetFollows(servers);
            });
        });
        it('Should follow new added instances in the index but not old ones', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                instanceIndexServer.addInstance(servers[2].host);
                yield index_1.wait(5000);
                yield jobs_1.waitJobs(servers);
                yield checkFollow(servers[0], servers[1], false);
                yield checkFollow(servers[0], servers[2], true);
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
