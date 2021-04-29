"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const videos_1 = require("../../../../shared/extra-utils/videos/videos");
const expect = chai.expect;
describe('Test AP cleaner', function () {
    let servers = [];
    let videoUUID1;
    let videoUUID2;
    let videoUUID3;
    let videoUUIDs;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const config = {
                federation: {
                    videos: { cleanup_remote_interactions: true }
                }
            };
            servers = yield index_1.flushAndRunMultipleServers(3, config);
            yield index_1.setAccessTokensToServers(servers);
            yield Promise.all([
                extra_utils_1.doubleFollow(servers[0], servers[1]),
                extra_utils_1.doubleFollow(servers[1], servers[2]),
                extra_utils_1.doubleFollow(servers[0], servers[2])
            ]);
            videoUUID1 = (yield videos_1.uploadVideoAndGetId({ server: servers[0], videoName: 'server 1' })).uuid;
            videoUUID2 = (yield videos_1.uploadVideoAndGetId({ server: servers[1], videoName: 'server 2' })).uuid;
            videoUUID3 = (yield videos_1.uploadVideoAndGetId({ server: servers[2], videoName: 'server 3' })).uuid;
            videoUUIDs = [videoUUID1, videoUUID2, videoUUID3];
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                for (const uuid of videoUUIDs) {
                    yield videos_1.rateVideo(server.url, server.accessToken, uuid, 'like');
                    yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, uuid, 'comment');
                }
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have the correct likes', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                for (const uuid of videoUUIDs) {
                    const res = yield videos_1.getVideo(server.url, uuid);
                    expect(res.body.likes).to.equal(3);
                    expect(res.body.dislikes).to.equal(0);
                }
            }
        });
    });
    it('Should destroy server 3 internal likes and correctly clean them', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.deleteAll(servers[2].internalServerNumber, 'accountVideoRate');
            for (const uuid of videoUUIDs) {
                yield extra_utils_1.setVideoField(servers[2].internalServerNumber, uuid, 'likes', '0');
            }
            yield extra_utils_1.wait(5000);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield videos_1.getVideo(servers[0].url, videoUUID1);
                expect(res.body.likes).to.equal(2);
                expect(res.body.dislikes).to.equal(0);
            }
            {
                const res = yield videos_1.getVideo(servers[0].url, videoUUID2);
                expect(res.body.likes).to.equal(3);
                expect(res.body.dislikes).to.equal(0);
            }
        });
    });
    it('Should update rates to dislikes', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            for (const server of servers) {
                for (const uuid of videoUUIDs) {
                    yield videos_1.rateVideo(server.url, server.accessToken, uuid, 'dislike');
                }
            }
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                for (const uuid of videoUUIDs) {
                    const res = yield videos_1.getVideo(server.url, uuid);
                    expect(res.body.likes).to.equal(0);
                    expect(res.body.dislikes).to.equal(3);
                }
            }
        });
    });
    it('Should destroy server 3 internal dislikes and correctly clean them', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.deleteAll(servers[2].internalServerNumber, 'accountVideoRate');
            for (const uuid of videoUUIDs) {
                yield extra_utils_1.setVideoField(servers[2].internalServerNumber, uuid, 'dislikes', '0');
            }
            yield extra_utils_1.wait(5000);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield videos_1.getVideo(servers[0].url, videoUUID1);
                expect(res.body.likes).to.equal(0);
                expect(res.body.dislikes).to.equal(2);
            }
            {
                const res = yield videos_1.getVideo(servers[0].url, videoUUID2);
                expect(res.body.likes).to.equal(0);
                expect(res.body.dislikes).to.equal(3);
            }
        });
    });
    it('Should destroy server 3 internal shares and correctly clean them', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            const preCount = yield extra_utils_1.getCount(servers[0].internalServerNumber, 'videoShare');
            expect(preCount).to.equal(6);
            yield extra_utils_1.deleteAll(servers[2].internalServerNumber, 'videoShare');
            yield extra_utils_1.wait(5000);
            yield jobs_1.waitJobs(servers);
            const postCount = yield extra_utils_1.getCount(servers[0].internalServerNumber, 'videoShare');
            expect(postCount).to.equal(6);
        });
    });
    it('Should destroy server 3 internal comments and correctly clean them', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            {
                const res = yield video_comments_1.getVideoCommentThreads(servers[0].url, videoUUID1, 0, 5);
                expect(res.body.total).to.equal(3);
            }
            yield extra_utils_1.deleteAll(servers[2].internalServerNumber, 'videoComment');
            yield extra_utils_1.wait(5000);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield video_comments_1.getVideoCommentThreads(servers[0].url, videoUUID1, 0, 5);
                expect(res.body.total).to.equal(2);
            }
        });
    });
    it('Should correctly update rate URLs', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            function check(like, ofServerUrl, urlSuffix, remote) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const query = `SELECT "videoId", "accountVideoRate".url FROM "accountVideoRate" ` +
                        `INNER JOIN video ON "accountVideoRate"."videoId" = video.id AND remote IS ${remote} WHERE "accountVideoRate"."url" LIKE '${like}'`;
                    const res = yield extra_utils_1.selectQuery(servers[0].internalServerNumber, query);
                    for (const rate of res) {
                        const matcher = new RegExp(`^${ofServerUrl}/accounts/root/dislikes/\\d+${urlSuffix}$`);
                        expect(rate.url).to.match(matcher);
                    }
                });
            }
            function checkLocal() {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const startsWith = 'http://' + servers[0].host + '%';
                    yield check(startsWith, servers[0].url, '', 'false');
                    yield check(startsWith, servers[0].url, '', 'true');
                });
            }
            function checkRemote(suffix) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const startsWith = 'http://' + servers[1].host + '%';
                    yield check(startsWith, servers[1].url, suffix, 'false');
                    yield check(startsWith, servers[1].url, '', 'true');
                });
            }
            yield checkLocal();
            yield checkRemote('');
            {
                const query = `UPDATE "accountVideoRate" SET url = url || 'stan'`;
                yield extra_utils_1.updateQuery(servers[1].internalServerNumber, query);
                yield extra_utils_1.wait(5000);
                yield jobs_1.waitJobs(servers);
            }
            yield checkLocal();
            yield checkRemote('stan');
        });
    });
    it('Should correctly update comment URLs', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            function check(like, ofServerUrl, urlSuffix, remote) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const query = `SELECT "videoId", "videoComment".url, uuid as "videoUUID" FROM "videoComment" ` +
                        `INNER JOIN video ON "videoComment"."videoId" = video.id AND remote IS ${remote} WHERE "videoComment"."url" LIKE '${like}'`;
                    const res = yield extra_utils_1.selectQuery(servers[0].internalServerNumber, query);
                    for (const comment of res) {
                        const matcher = new RegExp(`${ofServerUrl}/videos/watch/${comment.videoUUID}/comments/\\d+${urlSuffix}`);
                        expect(comment.url).to.match(matcher);
                    }
                });
            }
            function checkLocal() {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const startsWith = 'http://' + servers[0].host + '%';
                    yield check(startsWith, servers[0].url, '', 'false');
                    yield check(startsWith, servers[0].url, '', 'true');
                });
            }
            function checkRemote(suffix) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const startsWith = 'http://' + servers[1].host + '%';
                    yield check(startsWith, servers[1].url, suffix, 'false');
                    yield check(startsWith, servers[1].url, '', 'true');
                });
            }
            {
                const query = `UPDATE "videoComment" SET url = url || 'kyle'`;
                yield extra_utils_1.updateQuery(servers[1].internalServerNumber, query);
                yield extra_utils_1.wait(5000);
                yield jobs_1.waitJobs(servers);
            }
            yield checkLocal();
            yield checkRemote('kyle');
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
            yield extra_utils_1.closeAllSequelize(servers);
        });
    });
});
