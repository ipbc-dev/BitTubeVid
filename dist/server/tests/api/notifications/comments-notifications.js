"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const blocklist_1 = require("../../../../shared/extra-utils/users/blocklist");
const user_notifications_1 = require("../../../../shared/extra-utils/users/user-notifications");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const expect = chai.expect;
describe('Test comments notifications', function () {
    let servers = [];
    let userAccessToken;
    let userNotifications = [];
    let emails = [];
    const commentText = '**hello** <a href="https://joinpeertube.org">world</a>, <h1>what do you think about peertube?</h1>';
    const expectedHtml = '<strong style="-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">hello</strong> ' +
        '<a href="https://joinpeertube.org" target="_blank" rel="noopener noreferrer" style="-ms-text-size-adjust: 100%; ' +
        '-webkit-text-size-adjust: 100%; text-decoration: none; color: #f2690d;">world</a>, </p>what do you think about peertube?';
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const res = yield user_notifications_1.prepareNotificationsTest(2);
            emails = res.emails;
            userAccessToken = res.userAccessToken;
            servers = res.servers;
            userNotifications = res.userNotifications;
        });
    });
    describe('Comment on my video notifications', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
        });
        it('Should not send a new comment notification after a comment on another video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'absence');
            });
        });
        it('Should not send a new comment notification if I comment my own video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, userAccessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'absence');
            });
        });
        it('Should not send a new comment notification if the account is muted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, userAccessToken, 'root');
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'absence');
                yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, userAccessToken, 'root');
            });
        });
        it('Should send a new comment notification after a local comment on my video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'presence');
            });
        });
        it('Should send a new comment notification after a remote comment on my video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield video_comments_1.addVideoCommentThread(servers[1].url, servers[1].accessToken, uuid, 'comment');
                yield jobs_1.waitJobs(servers);
                const resComment = yield extra_utils_1.getVideoCommentThreads(servers[0].url, uuid, 0, 5);
                expect(resComment.body.data).to.have.lengthOf(1);
                const commentId = resComment.body.data[0].id;
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'presence');
            });
        });
        it('Should send a new comment notification after a local reply on my video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resThread = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const threadId = resThread.body.comment.id;
                const resComment = yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, uuid, threadId, 'reply');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, threadId, 'presence');
            });
        });
        it('Should send a new comment notification after a remote reply on my video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                {
                    const resThread = yield video_comments_1.addVideoCommentThread(servers[1].url, servers[1].accessToken, uuid, 'comment');
                    const threadId = resThread.body.comment.id;
                    yield video_comments_1.addVideoCommentReply(servers[1].url, servers[1].accessToken, uuid, threadId, 'reply');
                }
                yield jobs_1.waitJobs(servers);
                const resThread = yield extra_utils_1.getVideoCommentThreads(servers[0].url, uuid, 0, 5);
                expect(resThread.body.data).to.have.lengthOf(1);
                const threadId = resThread.body.data[0].id;
                const resComments = yield extra_utils_1.getVideoThreadComments(servers[0].url, uuid, threadId);
                const tree = resComments.body;
                expect(tree.children).to.have.lengthOf(1);
                const commentId = tree.children[0].comment.id;
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, threadId, 'presence');
            });
        });
        it('Should convert markdown in comment to html', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'cool video' });
                const uuid = resVideo.body.video.uuid;
                yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, commentText);
                yield jobs_1.waitJobs(servers);
                const latestEmail = emails[emails.length - 1];
                expect(latestEmail['html']).to.contain(expectedHtml);
            });
        });
    });
    describe('Mention notifications', function () {
        let baseParams;
        before(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
            yield extra_utils_1.updateMyUser({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                displayName: 'super root name'
            });
            yield extra_utils_1.updateMyUser({
                url: servers[1].url,
                accessToken: servers[1].accessToken,
                displayName: 'super root 2 name'
            });
        }));
        it('Should not send a new mention comment notification if I mention the video owner', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, '@user_1 hello');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, commentId, 'super root name', 'absence');
            });
        });
        it('Should not send a new mention comment notification if I mention myself', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, userAccessToken, uuid, '@user_1 hello');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, commentId, 'super root name', 'absence');
            });
        });
        it('Should not send a new mention notification if the account is muted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, userAccessToken, 'root');
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, '@user_1 hello');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, commentId, 'super root name', 'absence');
                yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, userAccessToken, 'root');
            });
        });
        it('Should not send a new mention notification if the remote account mention a local account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                const resThread = yield video_comments_1.addVideoCommentThread(servers[1].url, servers[1].accessToken, uuid, '@user_1 hello');
                const threadId = resThread.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, threadId, threadId, 'super root 2 name', 'absence');
            });
        });
        it('Should send a new mention notification after local comments', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resThread = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, '@user_1 hello 1');
                const threadId = resThread.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, threadId, threadId, 'super root name', 'presence');
                const resComment = yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, uuid, threadId, 'hello 2 @user_1');
                const commentId = resComment.body.comment.id;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, threadId, 'super root name', 'presence');
            });
        });
        it('Should send a new mention notification after remote comments', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                const text1 = `hello @user_1@localhost:${servers[0].port} 1`;
                const resThread = yield video_comments_1.addVideoCommentThread(servers[1].url, servers[1].accessToken, uuid, text1);
                const server2ThreadId = resThread.body.comment.id;
                yield jobs_1.waitJobs(servers);
                const resThread2 = yield extra_utils_1.getVideoCommentThreads(servers[0].url, uuid, 0, 5);
                expect(resThread2.body.data).to.have.lengthOf(1);
                const server1ThreadId = resThread2.body.data[0].id;
                yield user_notifications_1.checkCommentMention(baseParams, uuid, server1ThreadId, server1ThreadId, 'super root 2 name', 'presence');
                const text2 = `@user_1@localhost:${servers[0].port} hello 2 @root@localhost:${servers[0].port}`;
                yield video_comments_1.addVideoCommentReply(servers[1].url, servers[1].accessToken, uuid, server2ThreadId, text2);
                yield jobs_1.waitJobs(servers);
                const resComments = yield extra_utils_1.getVideoThreadComments(servers[0].url, uuid, server1ThreadId);
                const tree = resComments.body;
                expect(tree.children).to.have.lengthOf(1);
                const commentId = tree.children[0].comment.id;
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, server1ThreadId, 'super root 2 name', 'presence');
            });
        });
        it('Should convert markdown in comment to html', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resThread = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, '@user_1 hello 1');
                const threadId = resThread.body.comment.id;
                yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, uuid, threadId, '@user_1 ' + commentText);
                yield jobs_1.waitJobs(servers);
                const latestEmail = emails[emails.length - 1];
                expect(latestEmail['html']).to.contain(expectedHtml);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
