"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const index_1 = require("../../../../shared/index");
const index_2 = require("../../../../shared/extra-utils/index");
const login_1 = require("../../../../shared/extra-utils/users/login");
const videos_1 = require("../../../../shared/extra-utils/videos/videos");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const blocklist_1 = require("../../../../shared/extra-utils/users/blocklist");
const user_notifications_1 = require("../../../../shared/extra-utils/users/user-notifications");
const expect = chai.expect;
function checkAllVideos(url, token) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const res = yield videos_1.getVideosListWithToken(url, token);
            expect(res.body.data).to.have.lengthOf(5);
        }
        {
            const res = yield videos_1.getVideosList(url);
            expect(res.body.data).to.have.lengthOf(5);
        }
    });
}
function checkAllComments(url, token, videoUUID) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const resThreads = yield video_comments_1.getVideoCommentThreads(url, videoUUID, 0, 25, '-createdAt', token);
        const allThreads = resThreads.body.data;
        const threads = allThreads.filter(t => t.isDeleted === false);
        expect(threads).to.have.lengthOf(2);
        for (const thread of threads) {
            const res = yield video_comments_1.getVideoThreadComments(url, videoUUID, thread.id, token);
            const tree = res.body;
            expect(tree.children).to.have.lengthOf(1);
        }
    });
}
function checkCommentNotification(mainServer, comment, check) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const resComment = yield video_comments_1.addVideoCommentThread(comment.server.url, comment.token, comment.videoUUID, comment.text);
        const created = resComment.body.comment;
        const threadId = created.id;
        const createdAt = created.createdAt;
        yield jobs_1.waitJobs([mainServer, comment.server]);
        const res = yield user_notifications_1.getUserNotifications(mainServer.url, mainServer.accessToken, 0, 30);
        const commentNotifications = res.body.data
            .filter(n => n.comment && n.comment.video.uuid === comment.videoUUID && n.createdAt >= createdAt);
        if (check === 'presence')
            expect(commentNotifications).to.have.lengthOf(1);
        else
            expect(commentNotifications).to.have.lengthOf(0);
        yield index_2.deleteVideoComment(comment.server.url, comment.token, comment.videoUUID, threadId);
        yield jobs_1.waitJobs([mainServer, comment.server]);
    });
}
describe('Test blocklist', function () {
    let servers;
    let videoUUID1;
    let videoUUID2;
    let videoUUID3;
    let userToken1;
    let userModeratorToken;
    let userToken2;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield index_2.flushAndRunMultipleServers(3);
            yield login_1.setAccessTokensToServers(servers);
            {
                const user = { username: 'user1', password: 'password' };
                yield index_2.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
                userToken1 = yield index_2.userLogin(servers[0], user);
                yield index_2.uploadVideo(servers[0].url, userToken1, { name: 'video user 1' });
            }
            {
                const user = { username: 'moderator', password: 'password' };
                yield index_2.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: user.username, password: user.password });
                userModeratorToken = yield index_2.userLogin(servers[0], user);
            }
            {
                const user = { username: 'user2', password: 'password' };
                yield index_2.createUser({ url: servers[1].url, accessToken: servers[1].accessToken, username: user.username, password: user.password });
                userToken2 = yield index_2.userLogin(servers[1], user);
                yield index_2.uploadVideo(servers[1].url, userToken2, { name: 'video user 2' });
            }
            {
                const res = yield index_2.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video server 1' });
                videoUUID1 = res.body.video.uuid;
            }
            {
                const res = yield index_2.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video server 2' });
                videoUUID2 = res.body.video.uuid;
            }
            {
                const res = yield index_2.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video 2 server 1' });
                videoUUID3 = res.body.video.uuid;
            }
            yield index_2.doubleFollow(servers[0], servers[1]);
            yield index_2.doubleFollow(servers[0], servers[2]);
            {
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID1, 'comment root 1');
                const resReply = yield video_comments_1.addVideoCommentReply(servers[0].url, userToken1, videoUUID1, resComment.body.comment.id, 'comment user 1');
                yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID1, resReply.body.comment.id, 'comment root 1');
            }
            {
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, userToken1, videoUUID1, 'comment user 1');
                yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID1, resComment.body.comment.id, 'comment root 1');
            }
            yield jobs_1.waitJobs(servers);
        });
    });
    describe('User blocklist', function () {
        describe('When managing account blocklist', function () {
            it('Should list all videos', function () {
                return checkAllVideos(servers[0].url, servers[0].accessToken);
            });
            it('Should list the comments', function () {
                return checkAllComments(servers[0].url, servers[0].accessToken, videoUUID1);
            });
            it('Should block a remote account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, servers[0].accessToken, 'user2@localhost:' + servers[1].port);
                });
            });
            it('Should hide its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield videos_1.getVideosListWithToken(servers[0].url, servers[0].accessToken);
                    const videos = res.body.data;
                    expect(videos).to.have.lengthOf(4);
                    const v = videos.find(v => v.name === 'video user 2');
                    expect(v).to.be.undefined;
                });
            });
            it('Should block a local account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, servers[0].accessToken, 'user1');
                });
            });
            it('Should hide its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield videos_1.getVideosListWithToken(servers[0].url, servers[0].accessToken);
                    const videos = res.body.data;
                    expect(videos).to.have.lengthOf(3);
                    const v = videos.find(v => v.name === 'video user 1');
                    expect(v).to.be.undefined;
                });
            });
            it('Should hide its comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const resThreads = yield video_comments_1.getVideoCommentThreads(servers[0].url, videoUUID1, 0, 25, '-createdAt', servers[0].accessToken);
                    const threads = resThreads.body.data;
                    expect(threads).to.have.lengthOf(1);
                    expect(threads[0].totalReplies).to.equal(0);
                    const t = threads.find(t => t.text === 'comment user 1');
                    expect(t).to.be.undefined;
                    for (const thread of threads) {
                        const res = yield video_comments_1.getVideoThreadComments(servers[0].url, videoUUID1, thread.id, servers[0].accessToken);
                        const tree = res.body;
                        expect(tree.children).to.have.lengthOf(0);
                    }
                });
            });
            it('Should not have notifications from blocked accounts', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(20000);
                    {
                        const comment = { server: servers[0], token: userToken1, videoUUID: videoUUID1, text: 'hidden comment' };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                    {
                        const comment = {
                            server: servers[0],
                            token: userToken1,
                            videoUUID: videoUUID2,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                });
            });
            it('Should list all the videos with another user', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    return checkAllVideos(servers[0].url, userToken1);
                });
            });
            it('Should list blocked accounts', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    {
                        const res = yield blocklist_1.getAccountBlocklistByAccount(servers[0].url, servers[0].accessToken, 0, 1, 'createdAt');
                        const blocks = res.body.data;
                        expect(res.body.total).to.equal(2);
                        const block = blocks[0];
                        expect(block.byAccount.displayName).to.equal('root');
                        expect(block.byAccount.name).to.equal('root');
                        expect(block.blockedAccount.displayName).to.equal('user2');
                        expect(block.blockedAccount.name).to.equal('user2');
                        expect(block.blockedAccount.host).to.equal('localhost:' + servers[1].port);
                    }
                    {
                        const res = yield blocklist_1.getAccountBlocklistByAccount(servers[0].url, servers[0].accessToken, 1, 2, 'createdAt');
                        const blocks = res.body.data;
                        expect(res.body.total).to.equal(2);
                        const block = blocks[0];
                        expect(block.byAccount.displayName).to.equal('root');
                        expect(block.byAccount.name).to.equal('root');
                        expect(block.blockedAccount.displayName).to.equal('user1');
                        expect(block.blockedAccount.name).to.equal('user1');
                        expect(block.blockedAccount.host).to.equal('localhost:' + servers[0].port);
                    }
                });
            });
            it('Should not allow a remote blocked user to comment my videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(60000);
                    {
                        yield video_comments_1.addVideoCommentThread(servers[1].url, userToken2, videoUUID3, 'comment user 2');
                        yield jobs_1.waitJobs(servers);
                        yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID3, 'uploader');
                        yield jobs_1.waitJobs(servers);
                        const commentId = yield video_comments_1.findCommentId(servers[1].url, videoUUID3, 'uploader');
                        const message = 'reply by user 2';
                        const resReply = yield video_comments_1.addVideoCommentReply(servers[1].url, userToken2, videoUUID3, commentId, message);
                        yield video_comments_1.addVideoCommentReply(servers[1].url, servers[1].accessToken, videoUUID3, resReply.body.comment.id, 'another reply');
                        yield jobs_1.waitJobs(servers);
                    }
                    {
                        const resThreads = yield video_comments_1.getVideoCommentThreads(servers[1].url, videoUUID3, 0, 25, '-createdAt');
                        const threads = resThreads.body.data;
                        expect(threads).to.have.lengthOf(2);
                        expect(threads[0].text).to.equal('uploader');
                        expect(threads[1].text).to.equal('comment user 2');
                        const resReplies = yield video_comments_1.getVideoThreadComments(servers[1].url, videoUUID3, threads[0].id);
                        const tree = resReplies.body;
                        expect(tree.children).to.have.lengthOf(1);
                        expect(tree.children[0].comment.text).to.equal('reply by user 2');
                        expect(tree.children[0].children).to.have.lengthOf(1);
                        expect(tree.children[0].children[0].comment.text).to.equal('another reply');
                    }
                    for (const server of [servers[0], servers[2]]) {
                        const resThreads = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID3, 0, 25, '-createdAt');
                        const threads = resThreads.body.data;
                        expect(threads).to.have.lengthOf(1);
                        expect(threads[0].text).to.equal('uploader');
                        const resReplies = yield video_comments_1.getVideoThreadComments(server.url, videoUUID3, threads[0].id);
                        const tree = resReplies.body;
                        if (server.serverNumber === 1) {
                            expect(tree.children).to.have.lengthOf(0);
                        }
                        else {
                            expect(tree.children).to.have.lengthOf(1);
                        }
                    }
                });
            });
            it('Should unblock the remote account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, servers[0].accessToken, 'user2@localhost:' + servers[1].port);
                });
            });
            it('Should display its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield videos_1.getVideosListWithToken(servers[0].url, servers[0].accessToken);
                    const videos = res.body.data;
                    expect(videos).to.have.lengthOf(4);
                    const v = videos.find(v => v.name === 'video user 2');
                    expect(v).not.to.be.undefined;
                });
            });
            it('Should display its comments on my video', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const server of servers) {
                        const resThreads = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID3, 0, 25, '-createdAt');
                        const threads = resThreads.body.data;
                        if (server.serverNumber === 3) {
                            expect(threads).to.have.lengthOf(1);
                            continue;
                        }
                        expect(threads).to.have.lengthOf(2);
                        expect(threads[0].text).to.equal('uploader');
                        expect(threads[1].text).to.equal('comment user 2');
                        const resReplies = yield video_comments_1.getVideoThreadComments(server.url, videoUUID3, threads[0].id);
                        const tree = resReplies.body;
                        expect(tree.children).to.have.lengthOf(1);
                        expect(tree.children[0].comment.text).to.equal('reply by user 2');
                        expect(tree.children[0].children).to.have.lengthOf(1);
                        expect(tree.children[0].children[0].comment.text).to.equal('another reply');
                    }
                });
            });
            it('Should unblock the local account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, servers[0].accessToken, 'user1');
                });
            });
            it('Should display its comments', function () {
                return checkAllComments(servers[0].url, servers[0].accessToken, videoUUID1);
            });
            it('Should have a notification from a non blocked account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(20000);
                    {
                        const comment = { server: servers[1], token: userToken2, videoUUID: videoUUID1, text: 'displayed comment' };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                    {
                        const comment = {
                            server: servers[0],
                            token: userToken1,
                            videoUUID: videoUUID2,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                });
            });
        });
        describe('When managing server blocklist', function () {
            it('Should list all videos', function () {
                return checkAllVideos(servers[0].url, servers[0].accessToken);
            });
            it('Should list the comments', function () {
                return checkAllComments(servers[0].url, servers[0].accessToken, videoUUID1);
            });
            it('Should block a remote server', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.addServerToAccountBlocklist(servers[0].url, servers[0].accessToken, 'localhost:' + servers[1].port);
                });
            });
            it('Should hide its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield videos_1.getVideosListWithToken(servers[0].url, servers[0].accessToken);
                    const videos = res.body.data;
                    expect(videos).to.have.lengthOf(3);
                    const v1 = videos.find(v => v.name === 'video user 2');
                    const v2 = videos.find(v => v.name === 'video server 2');
                    expect(v1).to.be.undefined;
                    expect(v2).to.be.undefined;
                });
            });
            it('Should list all the videos with another user', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    return checkAllVideos(servers[0].url, userToken1);
                });
            });
            it('Should hide its comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(10000);
                    const resThreads = yield video_comments_1.addVideoCommentThread(servers[1].url, userToken2, videoUUID1, 'hidden comment 2');
                    const threadId = resThreads.body.comment.id;
                    yield jobs_1.waitJobs(servers);
                    yield checkAllComments(servers[0].url, servers[0].accessToken, videoUUID1);
                    yield index_2.deleteVideoComment(servers[1].url, userToken2, videoUUID1, threadId);
                });
            });
            it('Should not have notifications from blocked server', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(20000);
                    {
                        const comment = { server: servers[1], token: userToken2, videoUUID: videoUUID1, text: 'hidden comment' };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                    {
                        const comment = {
                            server: servers[1],
                            token: userToken2,
                            videoUUID: videoUUID1,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                });
            });
            it('Should list blocked servers', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield blocklist_1.getServerBlocklistByAccount(servers[0].url, servers[0].accessToken, 0, 1, 'createdAt');
                    const blocks = res.body.data;
                    expect(res.body.total).to.equal(1);
                    const block = blocks[0];
                    expect(block.byAccount.displayName).to.equal('root');
                    expect(block.byAccount.name).to.equal('root');
                    expect(block.blockedServer.host).to.equal('localhost:' + servers[1].port);
                });
            });
            it('Should unblock the remote server', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.removeServerFromAccountBlocklist(servers[0].url, servers[0].accessToken, 'localhost:' + servers[1].port);
                });
            });
            it('Should display its videos', function () {
                return checkAllVideos(servers[0].url, servers[0].accessToken);
            });
            it('Should display its comments', function () {
                return checkAllComments(servers[0].url, servers[0].accessToken, videoUUID1);
            });
            it('Should have notification from unblocked server', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(20000);
                    {
                        const comment = { server: servers[1], token: userToken2, videoUUID: videoUUID1, text: 'displayed comment' };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                    {
                        const comment = {
                            server: servers[1],
                            token: userToken2,
                            videoUUID: videoUUID1,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                });
            });
        });
    });
    describe('Server blocklist', function () {
        describe('When managing account blocklist', function () {
            it('Should list all videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        yield checkAllVideos(servers[0].url, token);
                    }
                });
            });
            it('Should list the comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        yield checkAllComments(servers[0].url, token, videoUUID1);
                    }
                });
            });
            it('Should block a remote account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, 'user2@localhost:' + servers[1].port);
                });
            });
            it('Should hide its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        const res = yield videos_1.getVideosListWithToken(servers[0].url, token);
                        const videos = res.body.data;
                        expect(videos).to.have.lengthOf(4);
                        const v = videos.find(v => v.name === 'video user 2');
                        expect(v).to.be.undefined;
                    }
                });
            });
            it('Should block a local account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, 'user1');
                });
            });
            it('Should hide its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        const res = yield videos_1.getVideosListWithToken(servers[0].url, token);
                        const videos = res.body.data;
                        expect(videos).to.have.lengthOf(3);
                        const v = videos.find(v => v.name === 'video user 1');
                        expect(v).to.be.undefined;
                    }
                });
            });
            it('Should hide its comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        const resThreads = yield video_comments_1.getVideoCommentThreads(servers[0].url, videoUUID1, 0, 20, '-createdAt', token);
                        let threads = resThreads.body.data;
                        threads = threads.filter(t => t.isDeleted === false);
                        expect(threads).to.have.lengthOf(1);
                        expect(threads[0].totalReplies).to.equal(0);
                        const t = threads.find(t => t.text === 'comment user 1');
                        expect(t).to.be.undefined;
                        for (const thread of threads) {
                            const res = yield video_comments_1.getVideoThreadComments(servers[0].url, videoUUID1, thread.id, token);
                            const tree = res.body;
                            expect(tree.children).to.have.lengthOf(0);
                        }
                    }
                });
            });
            it('Should not have notification from blocked accounts by instance', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(20000);
                    {
                        const comment = { server: servers[0], token: userToken1, videoUUID: videoUUID1, text: 'hidden comment' };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                    {
                        const comment = {
                            server: servers[1],
                            token: userToken2,
                            videoUUID: videoUUID1,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                });
            });
            it('Should list blocked accounts', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    {
                        const res = yield blocklist_1.getAccountBlocklistByServer(servers[0].url, servers[0].accessToken, 0, 1, 'createdAt');
                        const blocks = res.body.data;
                        expect(res.body.total).to.equal(2);
                        const block = blocks[0];
                        expect(block.byAccount.displayName).to.equal('peertube');
                        expect(block.byAccount.name).to.equal('peertube');
                        expect(block.blockedAccount.displayName).to.equal('user2');
                        expect(block.blockedAccount.name).to.equal('user2');
                        expect(block.blockedAccount.host).to.equal('localhost:' + servers[1].port);
                    }
                    {
                        const res = yield blocklist_1.getAccountBlocklistByServer(servers[0].url, servers[0].accessToken, 1, 2, 'createdAt');
                        const blocks = res.body.data;
                        expect(res.body.total).to.equal(2);
                        const block = blocks[0];
                        expect(block.byAccount.displayName).to.equal('peertube');
                        expect(block.byAccount.name).to.equal('peertube');
                        expect(block.blockedAccount.displayName).to.equal('user1');
                        expect(block.blockedAccount.name).to.equal('user1');
                        expect(block.blockedAccount.host).to.equal('localhost:' + servers[0].port);
                    }
                });
            });
            it('Should unblock the remote account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, 'user2@localhost:' + servers[1].port);
                });
            });
            it('Should display its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        const res = yield videos_1.getVideosListWithToken(servers[0].url, token);
                        const videos = res.body.data;
                        expect(videos).to.have.lengthOf(4);
                        const v = videos.find(v => v.name === 'video user 2');
                        expect(v).not.to.be.undefined;
                    }
                });
            });
            it('Should unblock the local account', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, 'user1');
                });
            });
            it('Should display its comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        yield checkAllComments(servers[0].url, token, videoUUID1);
                    }
                });
            });
            it('Should have notifications from unblocked accounts', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(20000);
                    {
                        const comment = { server: servers[0], token: userToken1, videoUUID: videoUUID1, text: 'displayed comment' };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                    {
                        const comment = {
                            server: servers[1],
                            token: userToken2,
                            videoUUID: videoUUID1,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                });
            });
        });
        describe('When managing server blocklist', function () {
            it('Should list all videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        yield checkAllVideos(servers[0].url, token);
                    }
                });
            });
            it('Should list the comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        yield checkAllComments(servers[0].url, token, videoUUID1);
                    }
                });
            });
            it('Should block a remote server', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.addServerToServerBlocklist(servers[0].url, servers[0].accessToken, 'localhost:' + servers[1].port);
                });
            });
            it('Should hide its videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        const res1 = yield videos_1.getVideosList(servers[0].url);
                        const res2 = yield videos_1.getVideosListWithToken(servers[0].url, token);
                        for (const res of [res1, res2]) {
                            const videos = res.body.data;
                            expect(videos).to.have.lengthOf(3);
                            const v1 = videos.find(v => v.name === 'video user 2');
                            const v2 = videos.find(v => v.name === 'video server 2');
                            expect(v1).to.be.undefined;
                            expect(v2).to.be.undefined;
                        }
                    }
                });
            });
            it('Should hide its comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(10000);
                    const resThreads = yield video_comments_1.addVideoCommentThread(servers[1].url, userToken2, videoUUID1, 'hidden comment 2');
                    const threadId = resThreads.body.comment.id;
                    yield jobs_1.waitJobs(servers);
                    yield checkAllComments(servers[0].url, servers[0].accessToken, videoUUID1);
                    yield index_2.deleteVideoComment(servers[1].url, userToken2, videoUUID1, threadId);
                });
            });
            it('Should not have notification from blocked instances by instance', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(50000);
                    {
                        const comment = { server: servers[1], token: userToken2, videoUUID: videoUUID1, text: 'hidden comment' };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                    {
                        const comment = {
                            server: servers[1],
                            token: userToken2,
                            videoUUID: videoUUID1,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'absence');
                    }
                    {
                        const now = new Date();
                        yield index_2.unfollow(servers[1].url, servers[1].accessToken, servers[0]);
                        yield jobs_1.waitJobs(servers);
                        yield index_2.follow(servers[1].url, [servers[0].host], servers[1].accessToken);
                        yield jobs_1.waitJobs(servers);
                        const res = yield user_notifications_1.getUserNotifications(servers[0].url, servers[0].accessToken, 0, 30);
                        const commentNotifications = res.body.data
                            .filter(n => {
                            return n.type === index_1.UserNotificationType.NEW_INSTANCE_FOLLOWER &&
                                n.createdAt >= now.toISOString();
                        });
                        expect(commentNotifications).to.have.lengthOf(0);
                    }
                });
            });
            it('Should list blocked servers', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield blocklist_1.getServerBlocklistByServer(servers[0].url, servers[0].accessToken, 0, 1, 'createdAt');
                    const blocks = res.body.data;
                    expect(res.body.total).to.equal(1);
                    const block = blocks[0];
                    expect(block.byAccount.displayName).to.equal('peertube');
                    expect(block.byAccount.name).to.equal('peertube');
                    expect(block.blockedServer.host).to.equal('localhost:' + servers[1].port);
                });
            });
            it('Should unblock the remote server', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield blocklist_1.removeServerFromServerBlocklist(servers[0].url, servers[0].accessToken, 'localhost:' + servers[1].port);
                });
            });
            it('Should list all videos', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        yield checkAllVideos(servers[0].url, token);
                    }
                });
            });
            it('Should list the comments', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    for (const token of [userModeratorToken, servers[0].accessToken]) {
                        yield checkAllComments(servers[0].url, token, videoUUID1);
                    }
                });
            });
            it('Should have notification from unblocked instances', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.timeout(50000);
                    {
                        const comment = { server: servers[1], token: userToken2, videoUUID: videoUUID1, text: 'displayed comment' };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                    {
                        const comment = {
                            server: servers[1],
                            token: userToken2,
                            videoUUID: videoUUID1,
                            text: 'hello @root@localhost:' + servers[0].port
                        };
                        yield checkCommentNotification(servers[0], comment, 'presence');
                    }
                    {
                        const now = new Date();
                        yield index_2.unfollow(servers[1].url, servers[1].accessToken, servers[0]);
                        yield jobs_1.waitJobs(servers);
                        yield index_2.follow(servers[1].url, [servers[0].host], servers[1].accessToken);
                        yield jobs_1.waitJobs(servers);
                        const res = yield user_notifications_1.getUserNotifications(servers[0].url, servers[0].accessToken, 0, 30);
                        const commentNotifications = res.body.data
                            .filter(n => {
                            return n.type === index_1.UserNotificationType.NEW_INSTANCE_FOLLOWER &&
                                n.createdAt >= now.toISOString();
                        });
                        expect(commentNotifications).to.have.lengthOf(1);
                    }
                });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield index_2.cleanupTests(servers);
        });
    });
});
