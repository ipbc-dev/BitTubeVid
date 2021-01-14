"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const expect = chai.expect;
describe('Test video comments', function () {
    let server;
    let videoId;
    let videoUUID;
    let threadId;
    let replyToDeleteId;
    let userAccessTokenServer1;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield index_1.flushAndRunServer(1);
            yield index_1.setAccessTokensToServers([server]);
            const res = yield index_1.uploadVideo(server.url, server.accessToken, {});
            videoUUID = res.body.video.uuid;
            videoId = res.body.video.id;
            yield index_1.updateMyAvatar({
                url: server.url,
                accessToken: server.accessToken,
                fixture: 'avatar.png'
            });
            yield index_1.createUser({
                url: server.url,
                accessToken: server.accessToken,
                username: 'user1',
                password: 'password'
            });
            userAccessTokenServer1 = yield index_1.getAccessToken(server.url, 'user1', 'password');
        });
    });
    describe('User comments', function () {
        it('Should not have threads on this video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(0);
            });
        });
        it('Should create a thread in this video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const text = 'my super first comment';
                const res = yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, videoUUID, text);
                const comment = res.body.comment;
                expect(comment.inReplyToCommentId).to.be.null;
                expect(comment.text).equal('my super first comment');
                expect(comment.videoId).to.equal(videoId);
                expect(comment.id).to.equal(comment.threadId);
                expect(comment.account.name).to.equal('root');
                expect(comment.account.host).to.equal('localhost:' + server.port);
                expect(comment.account.url).to.equal('http://localhost:' + server.port + '/accounts/root');
                expect(comment.totalReplies).to.equal(0);
                expect(comment.totalRepliesFromVideoAuthor).to.equal(0);
                expect(index_1.dateIsValid(comment.createdAt)).to.be.true;
                expect(index_1.dateIsValid(comment.updatedAt)).to.be.true;
            });
        });
        it('Should list threads of this video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                expect(res.body.total).to.equal(1);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(1);
                const comment = res.body.data[0];
                expect(comment.inReplyToCommentId).to.be.null;
                expect(comment.text).equal('my super first comment');
                expect(comment.videoId).to.equal(videoId);
                expect(comment.id).to.equal(comment.threadId);
                expect(comment.account.name).to.equal('root');
                expect(comment.account.host).to.equal('localhost:' + server.port);
                yield extra_utils_1.testImage(server.url, 'avatar-resized', comment.account.avatar.path, '.png');
                expect(comment.totalReplies).to.equal(0);
                expect(comment.totalRepliesFromVideoAuthor).to.equal(0);
                expect(index_1.dateIsValid(comment.createdAt)).to.be.true;
                expect(index_1.dateIsValid(comment.updatedAt)).to.be.true;
                threadId = comment.threadId;
            });
        });
        it('Should get all the thread created', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield video_comments_1.getVideoThreadComments(server.url, videoUUID, threadId);
                const rootComment = res.body.comment;
                expect(rootComment.inReplyToCommentId).to.be.null;
                expect(rootComment.text).equal('my super first comment');
                expect(rootComment.videoId).to.equal(videoId);
                expect(index_1.dateIsValid(rootComment.createdAt)).to.be.true;
                expect(index_1.dateIsValid(rootComment.updatedAt)).to.be.true;
            });
        });
        it('Should create multiple replies in this thread', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const text1 = 'my super answer to thread 1';
                const childCommentRes = yield video_comments_1.addVideoCommentReply(server.url, server.accessToken, videoId, threadId, text1);
                const childCommentId = childCommentRes.body.comment.id;
                const text2 = 'my super answer to answer of thread 1';
                yield video_comments_1.addVideoCommentReply(server.url, server.accessToken, videoId, childCommentId, text2);
                const text3 = 'my second answer to thread 1';
                yield video_comments_1.addVideoCommentReply(server.url, server.accessToken, videoId, threadId, text3);
            });
        });
        it('Should get correctly the replies', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield video_comments_1.getVideoThreadComments(server.url, videoUUID, threadId);
                const tree = res.body;
                expect(tree.comment.text).equal('my super first comment');
                expect(tree.children).to.have.lengthOf(2);
                const firstChild = tree.children[0];
                expect(firstChild.comment.text).to.equal('my super answer to thread 1');
                expect(firstChild.children).to.have.lengthOf(1);
                const childOfFirstChild = firstChild.children[0];
                expect(childOfFirstChild.comment.text).to.equal('my super answer to answer of thread 1');
                expect(childOfFirstChild.children).to.have.lengthOf(0);
                const secondChild = tree.children[1];
                expect(secondChild.comment.text).to.equal('my second answer to thread 1');
                expect(secondChild.children).to.have.lengthOf(0);
                replyToDeleteId = secondChild.comment.id;
            });
        });
        it('Should create other threads', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const text1 = 'super thread 2';
                yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, videoUUID, text1);
                const text2 = 'super thread 3';
                yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, videoUUID, text2);
            });
        });
        it('Should list the threads', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5, 'createdAt');
                expect(res.body.total).to.equal(3);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(3);
                expect(res.body.data[0].text).to.equal('my super first comment');
                expect(res.body.data[0].totalReplies).to.equal(3);
                expect(res.body.data[1].text).to.equal('super thread 2');
                expect(res.body.data[1].totalReplies).to.equal(0);
                expect(res.body.data[2].text).to.equal('super thread 3');
                expect(res.body.data[2].totalReplies).to.equal(0);
            });
        });
        it('Should delete a reply', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield video_comments_1.deleteVideoComment(server.url, server.accessToken, videoId, replyToDeleteId);
                const res = yield video_comments_1.getVideoThreadComments(server.url, videoUUID, threadId);
                const tree = res.body;
                expect(tree.comment.text).equal('my super first comment');
                expect(tree.children).to.have.lengthOf(2);
                const firstChild = tree.children[0];
                expect(firstChild.comment.text).to.equal('my super answer to thread 1');
                expect(firstChild.children).to.have.lengthOf(1);
                const childOfFirstChild = firstChild.children[0];
                expect(childOfFirstChild.comment.text).to.equal('my super answer to answer of thread 1');
                expect(childOfFirstChild.children).to.have.lengthOf(0);
                const deletedChildOfFirstChild = tree.children[1];
                expect(deletedChildOfFirstChild.comment.text).to.equal('');
                expect(deletedChildOfFirstChild.comment.isDeleted).to.be.true;
                expect(deletedChildOfFirstChild.comment.deletedAt).to.not.be.null;
                expect(deletedChildOfFirstChild.comment.account).to.be.null;
                expect(deletedChildOfFirstChild.children).to.have.lengthOf(0);
            });
        });
        it('Should delete a complete thread', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield video_comments_1.deleteVideoComment(server.url, server.accessToken, videoId, threadId);
                const res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5, 'createdAt');
                expect(res.body.total).to.equal(3);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(3);
                expect(res.body.data[0].text).to.equal('');
                expect(res.body.data[0].isDeleted).to.be.true;
                expect(res.body.data[0].deletedAt).to.not.be.null;
                expect(res.body.data[0].account).to.be.null;
                expect(res.body.data[0].totalReplies).to.equal(3);
                expect(res.body.data[1].text).to.equal('super thread 2');
                expect(res.body.data[1].totalReplies).to.equal(0);
                expect(res.body.data[2].text).to.equal('super thread 3');
                expect(res.body.data[2].totalReplies).to.equal(0);
            });
        });
        it('Should count replies from the video author correctly', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const text = 'my super first comment';
                yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, videoUUID, text);
                let res = yield video_comments_1.getVideoCommentThreads(server.url, videoUUID, 0, 5);
                const comment = res.body.data[0];
                const threadId2 = comment.threadId;
                const text2 = 'a first answer to thread 4 by a third party';
                yield video_comments_1.addVideoCommentReply(server.url, userAccessTokenServer1, videoId, threadId2, text2);
                const text3 = 'my second answer to thread 4';
                yield video_comments_1.addVideoCommentReply(server.url, server.accessToken, videoId, threadId2, text3);
                res = yield video_comments_1.getVideoThreadComments(server.url, videoUUID, threadId2);
                const tree = res.body;
                expect(tree.comment.totalReplies).to.equal(tree.comment.totalRepliesFromVideoAuthor + 1);
            });
        });
    });
    describe('All instance comments', function () {
        function getComments(options = {}) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield video_comments_1.getAdminVideoComments(Object.assign({
                    url: server.url,
                    token: server.accessToken,
                    start: 0,
                    count: 10
                }, options));
                return { comments: res.body.data, total: res.body.total };
            });
        }
        it('Should list instance comments as admin', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { comments } = yield getComments({ start: 0, count: 1 });
                expect(comments[0].text).to.equal('my second answer to thread 4');
            });
        });
        it('Should filter instance comments by isLocal', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { total, comments } = yield getComments({ isLocal: false });
                expect(comments).to.have.lengthOf(0);
                expect(total).to.equal(0);
            });
        });
        it('Should search instance comments by account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { total, comments } = yield getComments({ searchAccount: 'user' });
                expect(comments).to.have.lengthOf(1);
                expect(total).to.equal(1);
                expect(comments[0].text).to.equal('a first answer to thread 4 by a third party');
            });
        });
        it('Should search instance comments by video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const { total, comments } = yield getComments({ searchVideo: 'video' });
                    expect(comments).to.have.lengthOf(7);
                    expect(total).to.equal(7);
                }
                {
                    const { total, comments } = yield getComments({ searchVideo: 'hello' });
                    expect(comments).to.have.lengthOf(0);
                    expect(total).to.equal(0);
                }
            });
        });
        it('Should search instance comments', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const { total, comments } = yield getComments({ search: 'super thread 3' });
                expect(comments).to.have.lengthOf(1);
                expect(total).to.equal(1);
                expect(comments[0].text).to.equal('super thread 3');
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
