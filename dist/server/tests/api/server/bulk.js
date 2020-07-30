"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const index_1 = require("../../../../shared/extra-utils/index");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const expect = chai.expect;
describe('Test bulk actions', function () {
    const commentsUser3 = [];
    let servers = [];
    let user1AccessToken;
    let user2AccessToken;
    let user3AccessToken;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield index_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            {
                const user = { username: 'user1', password: 'password' };
                yield index_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
                user1AccessToken = yield index_1.userLogin(servers[0], user);
            }
            {
                const user = { username: 'user2', password: 'password' };
                yield index_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
                user2AccessToken = yield index_1.userLogin(servers[0], user);
            }
            {
                const user = { username: 'user3', password: 'password' };
                yield index_1.createUser({ url: servers[1].url, accessToken: servers[1].accessToken, username: user.username, password: user.password });
                user3AccessToken = yield index_1.userLogin(servers[1], user);
            }
            yield follows_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('Bulk remove comments', function () {
        function checkInstanceCommentsRemoved() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield index_1.getVideosList(servers[0].url);
                    const videos = res.body.data;
                    for (const video of videos) {
                        const resThreads = yield index_1.getVideoCommentThreads(servers[0].url, video.id, 0, 10);
                        const comments = resThreads.body.data;
                        const comment = comments.find(c => c.text === 'comment by user 3');
                        expect(comment).to.not.exist;
                    }
                }
                {
                    const res = yield index_1.getVideosList(servers[1].url);
                    const videos = res.body.data;
                    for (const video of videos) {
                        const resThreads = yield index_1.getVideoCommentThreads(servers[1].url, video.id, 0, 10);
                        const comments = resThreads.body.data;
                        const comment = comments.find(c => c.text === 'comment by user 3');
                        if (video.account.host === 'localhost:' + servers[0].port) {
                            expect(comment).to.not.exist;
                        }
                        else {
                            expect(comment).to.exist;
                        }
                    }
                }
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video 1 server 1' });
                yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video 2 server 1' });
                yield index_1.uploadVideo(servers[0].url, user1AccessToken, { name: 'video 3 server 1' });
                yield index_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video 1 server 2' });
                yield index_1.waitJobs(servers);
                {
                    const res = yield index_1.getVideosList(servers[0].url);
                    for (const video of res.body.data) {
                        yield index_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, video.id, 'comment by root server 1');
                        yield index_1.addVideoCommentThread(servers[0].url, user1AccessToken, video.id, 'comment by user 1');
                        yield index_1.addVideoCommentThread(servers[0].url, user2AccessToken, video.id, 'comment by user 2');
                    }
                }
                {
                    const res = yield index_1.getVideosList(servers[1].url);
                    for (const video of res.body.data) {
                        yield index_1.addVideoCommentThread(servers[1].url, servers[1].accessToken, video.id, 'comment by root server 2');
                        const res = yield index_1.addVideoCommentThread(servers[1].url, user3AccessToken, video.id, 'comment by user 3');
                        commentsUser3.push({ videoId: video.id, commentId: res.body.comment.id });
                    }
                }
                yield index_1.waitJobs(servers);
            });
        });
        it('Should delete comments of an account on my videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield index_1.bulkRemoveCommentsOf({
                    url: servers[0].url,
                    token: user1AccessToken,
                    attributes: {
                        accountName: 'user2',
                        scope: 'my-videos'
                    }
                });
                yield index_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield index_1.getVideosList(server.url);
                    for (const video of res.body.data) {
                        const resThreads = yield index_1.getVideoCommentThreads(server.url, video.id, 0, 10);
                        const comments = resThreads.body.data;
                        const comment = comments.find(c => c.text === 'comment by user 2');
                        if (video.name === 'video 3 server 1') {
                            expect(comment).to.not.exist;
                        }
                        else {
                            expect(comment).to.exist;
                        }
                    }
                }
            });
        });
        it('Should delete comments of an account on the instance', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield index_1.bulkRemoveCommentsOf({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    attributes: {
                        accountName: 'user3@localhost:' + servers[1].port,
                        scope: 'instance'
                    }
                });
                yield index_1.waitJobs(servers);
                yield checkInstanceCommentsRemoved();
            });
        });
        it('Should not re create the comment on video update', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                for (const obj of commentsUser3) {
                    yield index_1.addVideoCommentReply(servers[1].url, user3AccessToken, obj.videoId, obj.commentId, 'comment by user 3 bis');
                }
                yield index_1.waitJobs(servers);
                yield checkInstanceCommentsRemoved();
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
