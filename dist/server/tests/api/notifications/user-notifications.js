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
const index_1 = require("../../../../shared/extra-utils/index");
const login_1 = require("../../../../shared/extra-utils/users/login");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const socket_io_1 = require("../../../../shared/extra-utils/socket/socket-io");
const user_notifications_1 = require("../../../../shared/extra-utils/users/user-notifications");
const users_1 = require("../../../../shared/models/users");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const user_subscriptions_1 = require("../../../../shared/extra-utils/users/user-subscriptions");
const videos_1 = require("../../../../shared/models/videos");
const video_imports_1 = require("../../../../shared/extra-utils/videos/video-imports");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const uuidv4 = require("uuid/v4");
const blocklist_1 = require("../../../../shared/extra-utils/users/blocklist");
const expect = chai.expect;
function uploadVideoByRemoteAccount(servers, additionalParams = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = 'remote video ' + uuidv4();
        const data = Object.assign({ name }, additionalParams);
        const res = yield index_1.uploadVideo(servers[1].url, servers[1].accessToken, data);
        yield jobs_1.waitJobs(servers);
        return { uuid: res.body.video.uuid, name };
    });
}
function uploadVideoByLocalAccount(servers, additionalParams = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = 'local video ' + uuidv4();
        const data = Object.assign({ name }, additionalParams);
        const res = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, data);
        yield jobs_1.waitJobs(servers);
        return { uuid: res.body.video.uuid, name };
    });
}
describe('Test users notifications', function () {
    let servers = [];
    let userAccessToken;
    let userNotifications = [];
    let adminNotifications = [];
    let adminNotificationsServer2 = [];
    const emails = [];
    let channelId;
    const allNotificationSettings = {
        newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        newCommentOnMyVideo: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        videoAbuseAsModerator: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        videoAutoBlacklistAsModerator: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        blacklistOnMyVideo: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        myVideoImportFinished: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        myVideoPublished: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        commentMention: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        newFollow: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        newUserRegistration: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        newInstanceFollower: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL,
        autoInstanceFollowing: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL
    };
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const port = yield email_1.MockSmtpServer.Instance.collectEmails(emails);
            const overrideConfig = {
                smtp: {
                    hostname: 'localhost',
                    port
                }
            };
            servers = yield extra_utils_1.flushAndRunMultipleServers(3, overrideConfig);
            yield login_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield jobs_1.waitJobs(servers);
            const user = {
                username: 'user_1',
                password: 'super password'
            };
            yield extra_utils_1.createUser({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                username: user.username,
                password: user.password,
                videoQuota: 10 * 1000 * 1000
            });
            userAccessToken = yield extra_utils_1.userLogin(servers[0], user);
            yield user_notifications_1.updateMyNotificationSettings(servers[0].url, userAccessToken, allNotificationSettings);
            yield user_notifications_1.updateMyNotificationSettings(servers[0].url, servers[0].accessToken, allNotificationSettings);
            yield user_notifications_1.updateMyNotificationSettings(servers[1].url, servers[1].accessToken, allNotificationSettings);
            {
                const socket = socket_io_1.getUserNotificationSocket(servers[0].url, userAccessToken);
                socket.on('new-notification', n => userNotifications.push(n));
            }
            {
                const socket = socket_io_1.getUserNotificationSocket(servers[0].url, servers[0].accessToken);
                socket.on('new-notification', n => adminNotifications.push(n));
            }
            {
                const socket = socket_io_1.getUserNotificationSocket(servers[1].url, servers[1].accessToken);
                socket.on('new-notification', n => adminNotificationsServer2.push(n));
            }
            {
                const resChannel = yield extra_utils_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
                channelId = resChannel.body.videoChannels[0].id;
            }
        });
    });
    describe('New video from my subscription notification', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
        });
        it('Should not send notifications if the user does not follow the video publisher', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield uploadVideoByLocalAccount(servers);
                const notification = yield user_notifications_1.getLastNotification(servers[0].url, userAccessToken);
                expect(notification).to.be.undefined;
                expect(emails).to.have.lengthOf(0);
                expect(userNotifications).to.have.lengthOf(0);
            });
        });
        it('Should send a new video notification if the user follows the local video publisher', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                yield user_subscriptions_1.addUserSubscription(servers[0].url, userAccessToken, 'root_channel@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                const { name, uuid } = yield uploadVideoByLocalAccount(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification from a remote account', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                yield user_subscriptions_1.addUserSubscription(servers[0].url, userAccessToken, 'root_channel@localhost:' + servers[1].port);
                yield jobs_1.waitJobs(servers);
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification on a scheduled publication', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                let updateAt = new Date(new Date().getTime() + 2000);
                const data = {
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const { name, uuid } = yield uploadVideoByLocalAccount(servers, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification on a remote scheduled publication', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                let updateAt = new Date(new Date().getTime() + 2000);
                const data = {
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers, data);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should not send a notification before the video is published', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                let updateAt = new Date(new Date().getTime() + 1000000);
                const data = {
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const { name, uuid } = yield uploadVideoByLocalAccount(servers, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
            });
        });
        it('Should send a new video notification when a video becomes public', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const data = { privacy: videos_1.VideoPrivacy.PRIVATE };
                const { name, uuid } = yield uploadVideoByLocalAccount(servers, data);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, uuid, { privacy: videos_1.VideoPrivacy.PUBLIC });
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a new video notification when a remote video becomes public', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const data = { privacy: videos_1.VideoPrivacy.PRIVATE };
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers, data);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
                yield extra_utils_1.updateVideo(servers[1].url, servers[1].accessToken, uuid, { privacy: videos_1.VideoPrivacy.PUBLIC });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
        it('Should not send a new video notification when a video becomes unlisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const data = { privacy: videos_1.VideoPrivacy.PRIVATE };
                const { name, uuid } = yield uploadVideoByLocalAccount(servers, data);
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, uuid, { privacy: videos_1.VideoPrivacy.UNLISTED });
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
            });
        });
        it('Should not send a new video notification when a remote video becomes unlisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const data = { privacy: videos_1.VideoPrivacy.PRIVATE };
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers, data);
                yield extra_utils_1.updateVideo(servers[1].url, servers[1].accessToken, uuid, { privacy: videos_1.VideoPrivacy.UNLISTED });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'absence');
            });
        });
        it('Should send a new video notification after a video import', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(100000);
                const name = 'video import ' + uuidv4();
                const attributes = {
                    name,
                    channelId,
                    privacy: videos_1.VideoPrivacy.PUBLIC,
                    targetUrl: video_imports_1.getYoutubeVideoUrl()
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
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
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'absence');
            });
        });
        it('Should not send a new comment notification if I comment my own video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, userAccessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'absence');
            });
        });
        it('Should not send a new comment notification if the account is muted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, userAccessToken, 'root');
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'absence');
                yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, userAccessToken, 'root');
            });
        });
        it('Should send a new comment notification after a local comment on my video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, commentId, 'presence');
            });
        });
        it('Should send a new comment notification after a remote comment on my video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
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
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resThread = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, 'comment');
                const threadId = resThread.body.comment.id;
                const resComment = yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, uuid, threadId, 'reply');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewCommentOnMyVideo(baseParams, uuid, commentId, threadId, 'presence');
            });
        });
        it('Should send a new comment notification after a remote reply on my video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
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
    });
    describe('Mention notifications', function () {
        let baseParams;
        before(() => __awaiter(this, void 0, void 0, function* () {
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
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, '@user_1 hello');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, commentId, 'super root name', 'absence');
            });
        });
        it('Should not send a new mention comment notification if I mention myself', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, userAccessToken, uuid, '@user_1 hello');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, commentId, 'super root name', 'absence');
            });
        });
        it('Should not send a new mention notification if the account is muted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, userAccessToken, 'root');
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, '@user_1 hello');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, commentId, 'super root name', 'absence');
                yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, userAccessToken, 'root');
            });
        });
        it('Should not send a new mention notification if the remote account mention a local account', function () {
            return __awaiter(this, void 0, void 0, function* () {
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
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'super video' });
                const uuid = resVideo.body.video.uuid;
                const resThread = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, uuid, '@user_1 hello 1');
                const threadId = resThread.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, threadId, threadId, 'super root name', 'presence');
                const resComment = yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, uuid, threadId, 'hello 2 @user_1');
                const commentId = resComment.body.comment.id;
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkCommentMention(baseParams, uuid, commentId, threadId, 'super root name', 'presence');
            });
        });
        it('Should send a new mention notification after remote comments', function () {
            return __awaiter(this, void 0, void 0, function* () {
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
    });
    describe('Video abuse for moderators notification', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
        });
        it('Should send a notification to moderators on local video abuse', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuidv4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, uuid, 'super reason');
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoAbuseForModerators(baseParams, uuid, name, 'presence');
            });
        });
        it('Should send a notification to moderators on remote video abuse', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuidv4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.reportVideoAbuse(servers[1].url, servers[1].accessToken, uuid, 'super reason');
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewVideoAbuseForModerators(baseParams, uuid, name, 'presence');
            });
        });
    });
    describe('Video blacklist on my video', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
        });
        it('Should send a notification to video owner on blacklist', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuidv4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewBlacklistOnMyVideo(baseParams, uuid, name, 'blacklist');
            });
        });
        it('Should send a notification to video owner on unblacklist', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const name = 'video for abuse ' + uuidv4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield extra_utils_1.wait(500);
                yield user_notifications_1.checkNewBlacklistOnMyVideo(baseParams, uuid, name, 'unblacklist');
            });
        });
    });
    describe('My video is published', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[1],
                emails,
                socketNotifications: adminNotificationsServer2,
                token: servers[1].accessToken
            };
        });
        it('Should not send a notification if transcoding is not enabled', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const { name, uuid } = yield uploadVideoByLocalAccount(servers);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'absence');
            });
        });
        it('Should not send a notification if the wait transcoding is false', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                yield uploadVideoByRemoteAccount(servers, { waitTranscoding: false });
                yield jobs_1.waitJobs(servers);
                const notification = yield user_notifications_1.getLastNotification(servers[0].url, userAccessToken);
                if (notification) {
                    expect(notification.type).to.not.equal(users_1.UserNotificationType.MY_VIDEO_PUBLISHED);
                }
            });
        });
        it('Should send a notification even if the video is not transcoded in other resolutions', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers, { waitTranscoding: true, fixture: 'video_short_240p.mp4' });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a notification with a transcoded video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers, { waitTranscoding: true });
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a notification when an imported video is transcoded', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const name = 'video import ' + uuidv4();
                const attributes = {
                    name,
                    channelId,
                    privacy: videos_1.VideoPrivacy.PUBLIC,
                    targetUrl: video_imports_1.getYoutubeVideoUrl(),
                    waitTranscoding: true
                };
                const res = yield video_imports_1.importVideo(servers[1].url, servers[1].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should send a notification when the scheduled update has been proceeded', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(70000);
                let updateAt = new Date(new Date().getTime() + 2000);
                const data = {
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'presence');
            });
        });
        it('Should not send a notification before the video is published', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                let updateAt = new Date(new Date().getTime() + 1000000);
                const data = {
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const { name, uuid } = yield uploadVideoByRemoteAccount(servers, data);
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkVideoIsPublished(baseParams, name, uuid, 'absence');
            });
        });
    });
    describe('My video is imported', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
        });
        it('Should send a notification when the video import failed', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(70000);
                const name = 'video import ' + uuidv4();
                const attributes = {
                    name,
                    channelId,
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    targetUrl: video_imports_1.getBadVideoUrl()
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkMyVideoImportIsFinished(baseParams, name, uuid, video_imports_1.getBadVideoUrl(), false, 'presence');
            });
        });
        it('Should send a notification when the video import succeeded', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(70000);
                const name = 'video import ' + uuidv4();
                const attributes = {
                    name,
                    channelId,
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    targetUrl: video_imports_1.getYoutubeVideoUrl()
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                const uuid = res.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkMyVideoImportIsFinished(baseParams, name, uuid, video_imports_1.getYoutubeVideoUrl(), true, 'presence');
            });
        });
    });
    describe('New registration', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
        });
        it('Should send a notification only to moderators when a user registers on the instance', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.registerUser(servers[0].url, 'user_45', 'password');
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkUserRegistered(baseParams, 'user_45', 'presence');
                const userOverride = { socketNotifications: userNotifications, token: userAccessToken, check: { web: true, mail: false } };
                yield user_notifications_1.checkUserRegistered(extra_utils_1.immutableAssign(baseParams, userOverride), 'user_45', 'absence');
            });
        });
    });
    describe('New instance follows', function () {
        const instanceIndexServer = new extra_utils_1.MockInstancesIndex();
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
        let baseParams;
        before(() => __awaiter(this, void 0, void 0, function* () {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
            yield instanceIndexServer.initialize();
            instanceIndexServer.addInstance(servers[1].host);
        }));
        it('Should send a notification only to admin when there is a new instance follower', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield extra_utils_1.follow(servers[2].url, [servers[0].url], servers[2].accessToken);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewInstanceFollower(baseParams, 'localhost:' + servers[2].port, 'presence');
                const userOverride = { socketNotifications: userNotifications, token: userAccessToken, check: { web: true, mail: false } };
                yield user_notifications_1.checkNewInstanceFollower(extra_utils_1.immutableAssign(baseParams, userOverride), 'localhost:' + servers[2].port, 'absence');
            });
        });
        it('Should send a notification on auto follow back', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(40000);
                yield extra_utils_1.unfollow(servers[2].url, servers[2].accessToken, servers[0]);
                yield jobs_1.waitJobs(servers);
                const config = {
                    followings: {
                        instance: {
                            autoFollowBack: { enabled: true }
                        }
                    }
                };
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.follow(servers[2].url, [servers[0].url], servers[2].accessToken);
                yield jobs_1.waitJobs(servers);
                const followerHost = servers[0].host;
                const followingHost = servers[2].host;
                yield user_notifications_1.checkAutoInstanceFollowing(baseParams, followerHost, followingHost, 'presence');
                const userOverride = { socketNotifications: userNotifications, token: userAccessToken, check: { web: true, mail: false } };
                yield user_notifications_1.checkAutoInstanceFollowing(extra_utils_1.immutableAssign(baseParams, userOverride), followerHost, followingHost, 'absence');
                config.followings.instance.autoFollowBack.enabled = false;
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[2]);
                yield extra_utils_1.unfollow(servers[2].url, servers[2].accessToken, servers[0]);
            });
        });
        it('Should send a notification on auto instances index follow', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[1]);
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.wait(5000);
                yield jobs_1.waitJobs(servers);
                const followerHost = servers[0].host;
                const followingHost = servers[1].host;
                yield user_notifications_1.checkAutoInstanceFollowing(baseParams, followerHost, followingHost, 'presence');
                config.followings.instance.autoFollowIndex.enabled = false;
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, config);
                yield extra_utils_1.unfollow(servers[0].url, servers[0].accessToken, servers[1]);
            });
        });
    });
    describe('New actor follow', function () {
        let baseParams;
        let myChannelName = 'super channel name';
        let myUserName = 'super user name';
        before(() => __awaiter(this, void 0, void 0, function* () {
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
                url: servers[0].url,
                accessToken: userAccessToken,
                displayName: myUserName
            });
            yield extra_utils_1.updateMyUser({
                url: servers[1].url,
                accessToken: servers[1].accessToken,
                displayName: 'super root 2 name'
            });
            yield extra_utils_1.updateVideoChannel(servers[0].url, userAccessToken, 'user_1_channel', { displayName: myChannelName });
        }));
        it('Should notify when a local channel is following one of our channel', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield user_subscriptions_1.addUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewActorFollow(baseParams, 'channel', 'root', 'super root name', myChannelName, 'presence');
                yield user_subscriptions_1.removeUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            });
        });
        it('Should notify when a remote channel is following one of our channel', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield user_subscriptions_1.addUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewActorFollow(baseParams, 'channel', 'root', 'super root 2 name', myChannelName, 'presence');
                yield user_subscriptions_1.removeUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            });
        });
        it('Should notify when a local account is following one of our channel', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield user_subscriptions_1.addUserSubscription(servers[0].url, servers[0].accessToken, 'user_1@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewActorFollow(baseParams, 'account', 'root', 'super root name', myUserName, 'presence');
            });
        });
        it('Should notify when a remote account is following one of our channel', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield user_subscriptions_1.addUserSubscription(servers[1].url, servers[1].accessToken, 'user_1@localhost:' + servers[0].port);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewActorFollow(baseParams, 'account', 'root', 'super root 2 name', myUserName, 'presence');
            });
        });
    });
    describe('Video-related notifications when video auto-blacklist is enabled', function () {
        let userBaseParams;
        let adminBaseParamsServer1;
        let adminBaseParamsServer2;
        let videoUUID;
        let videoName;
        let currentCustomConfig;
        before(() => __awaiter(this, void 0, void 0, function* () {
            adminBaseParamsServer1 = {
                server: servers[0],
                emails,
                socketNotifications: adminNotifications,
                token: servers[0].accessToken
            };
            adminBaseParamsServer2 = {
                server: servers[1],
                emails,
                socketNotifications: adminNotificationsServer2,
                token: servers[1].accessToken
            };
            userBaseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
            const resCustomConfig = yield extra_utils_1.getCustomConfig(servers[0].url, servers[0].accessToken);
            currentCustomConfig = resCustomConfig.body;
            const autoBlacklistTestsCustomConfig = extra_utils_1.immutableAssign(currentCustomConfig, {
                autoBlacklist: {
                    videos: {
                        ofUsers: {
                            enabled: true
                        }
                    }
                }
            });
            autoBlacklistTestsCustomConfig.transcoding.enabled = true;
            yield extra_utils_1.updateCustomConfig(servers[0].url, servers[0].accessToken, autoBlacklistTestsCustomConfig);
            yield user_subscriptions_1.addUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            yield user_subscriptions_1.addUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
        }));
        it('Should send notification to moderators on new video with auto-blacklist', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                videoName = 'video with auto-blacklist ' + uuidv4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, { name: videoName });
                videoUUID = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoAutoBlacklistForModerators(adminBaseParamsServer1, videoUUID, videoName, 'presence');
            });
        });
        it('Should not send video publish notification if auto-blacklisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkVideoIsPublished(userBaseParams, videoName, videoUUID, 'absence');
            });
        });
        it('Should not send a local user subscription notification if auto-blacklisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, videoName, videoUUID, 'absence');
            });
        });
        it('Should not send a remote user subscription notification if auto-blacklisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, videoName, videoUUID, 'absence');
            });
        });
        it('Should send video published and unblacklist after video unblacklisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, videoUUID);
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should send a local user subscription notification after removed from blacklist', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, videoName, videoUUID, 'presence');
            });
        });
        it('Should send a remote user subscription notification after removed from blacklist', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, videoName, videoUUID, 'presence');
            });
        });
        it('Should send unblacklist but not published/subscription notes after unblacklisted if scheduled update pending', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                let updateAt = new Date(new Date().getTime() + 1000000);
                const name = 'video with auto-blacklist and future schedule ' + uuidv4();
                const data = {
                    name,
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, data);
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, uuid);
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkNewBlacklistOnMyVideo(userBaseParams, uuid, name, 'unblacklist');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, name, uuid, 'absence');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, name, uuid, 'absence');
            });
        });
        it('Should not send publish/subscription notifications after scheduled update if video still auto-blacklisted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                let updateAt = new Date(new Date().getTime() + 2000);
                const name = 'video with schedule done and still auto-blacklisted ' + uuidv4();
                const data = {
                    name,
                    privacy: videos_1.VideoPrivacy.PRIVATE,
                    scheduleUpdate: {
                        updateAt: updateAt.toISOString(),
                        privacy: videos_1.VideoPrivacy.PUBLIC
                    }
                };
                const resVideo = yield index_1.uploadVideo(servers[0].url, userAccessToken, data);
                const uuid = resVideo.body.video.uuid;
                yield extra_utils_1.wait(6000);
                yield user_notifications_1.checkVideoIsPublished(userBaseParams, name, uuid, 'absence');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer1, name, uuid, 'absence');
                yield user_notifications_1.checkNewVideoFromSubscription(adminBaseParamsServer2, name, uuid, 'absence');
            });
        });
        it('Should not send a notification to moderators on new video without auto-blacklist', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const name = 'video without auto-blacklist ' + uuidv4();
                const resVideo = yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, { name });
                const uuid = resVideo.body.video.uuid;
                yield jobs_1.waitJobs(servers);
                yield user_notifications_1.checkVideoAutoBlacklistForModerators(adminBaseParamsServer1, uuid, name, 'absence');
            });
        });
        after(() => __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateCustomConfig(servers[0].url, servers[0].accessToken, currentCustomConfig);
            yield user_subscriptions_1.removeUserSubscription(servers[0].url, servers[0].accessToken, 'user_1_channel@localhost:' + servers[0].port);
            yield user_subscriptions_1.removeUserSubscription(servers[1].url, servers[1].accessToken, 'user_1_channel@localhost:' + servers[0].port);
        }));
    });
    describe('Mark as read', function () {
        it('Should mark as read some notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(servers[0].url, userAccessToken, 2, 3);
                const ids = res.body.data.map(n => n.id);
                yield user_notifications_1.markAsReadNotifications(servers[0].url, userAccessToken, ids);
            });
        });
        it('Should have the notifications marked as read', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(servers[0].url, userAccessToken, 0, 10);
                const notifications = res.body.data;
                expect(notifications[0].read).to.be.false;
                expect(notifications[1].read).to.be.false;
                expect(notifications[2].read).to.be.true;
                expect(notifications[3].read).to.be.true;
                expect(notifications[4].read).to.be.true;
                expect(notifications[5].read).to.be.false;
            });
        });
        it('Should only list read notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(servers[0].url, userAccessToken, 0, 10, false);
                const notifications = res.body.data;
                for (const notification of notifications) {
                    expect(notification.read).to.be.true;
                }
            });
        });
        it('Should only list unread notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield user_notifications_1.getUserNotifications(servers[0].url, userAccessToken, 0, 10, true);
                const notifications = res.body.data;
                for (const notification of notifications) {
                    expect(notification.read).to.be.false;
                }
            });
        });
        it('Should mark as read all notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield user_notifications_1.markAsReadAllNotifications(servers[0].url, userAccessToken);
                const res = yield user_notifications_1.getUserNotifications(servers[0].url, userAccessToken, 0, 10, true);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.have.lengthOf(0);
            });
        });
    });
    describe('Notification settings', function () {
        let baseParams;
        before(() => {
            baseParams = {
                server: servers[0],
                emails,
                socketNotifications: userNotifications,
                token: userAccessToken
            };
        });
        it('Should not have notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(servers[0].url, userAccessToken, extra_utils_1.immutableAssign(allNotificationSettings, {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.NONE
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(servers[0].url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.NONE);
                }
                const { name, uuid } = yield uploadVideoByLocalAccount(servers);
                const check = { web: true, mail: true };
                yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'absence');
            });
        });
        it('Should only have web notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(servers[0].url, userAccessToken, extra_utils_1.immutableAssign(allNotificationSettings, {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(servers[0].url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.WEB);
                }
                const { name, uuid } = yield uploadVideoByLocalAccount(servers);
                {
                    const check = { mail: true, web: false };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'absence');
                }
                {
                    const check = { mail: false, web: true };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'presence');
                }
            });
        });
        it('Should only have mail notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(servers[0].url, userAccessToken, extra_utils_1.immutableAssign(allNotificationSettings, {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.EMAIL
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(servers[0].url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.EMAIL);
                }
                const { name, uuid } = yield uploadVideoByLocalAccount(servers);
                {
                    const check = { mail: false, web: true };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'absence');
                }
                {
                    const check = { mail: true, web: false };
                    yield user_notifications_1.checkNewVideoFromSubscription(extra_utils_1.immutableAssign(baseParams, { check }), name, uuid, 'presence');
                }
            });
        });
        it('Should have email and web notifications', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                yield user_notifications_1.updateMyNotificationSettings(servers[0].url, userAccessToken, extra_utils_1.immutableAssign(allNotificationSettings, {
                    newVideoFromSubscription: users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL
                }));
                {
                    const res = yield extra_utils_1.getMyUserInformation(servers[0].url, userAccessToken);
                    const info = res.body;
                    expect(info.notificationSettings.newVideoFromSubscription).to.equal(users_1.UserNotificationSettingValue.WEB | users_1.UserNotificationSettingValue.EMAIL);
                }
                const { name, uuid } = yield uploadVideoByLocalAccount(servers);
                yield user_notifications_1.checkNewVideoFromSubscription(baseParams, name, uuid, 'presence');
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
