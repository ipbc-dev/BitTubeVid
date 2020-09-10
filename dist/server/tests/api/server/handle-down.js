"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const video_comments_1 = require("../../../../shared/extra-utils/videos/video-comments");
const expect = chai.expect;
describe('Test handle downs', function () {
    let servers = [];
    let threadIdServer1;
    let threadIdServer2;
    let commentIdServer1;
    let commentIdServer2;
    let missedVideo1;
    let missedVideo2;
    let unlistedVideo;
    const videoIdsServer1 = [];
    const videoAttributes = {
        name: 'my super name for server 1',
        category: 5,
        licence: 4,
        language: 'ja',
        nsfw: true,
        privacy: 1,
        description: 'my super description for server 1',
        support: 'my super support text for server 1',
        tags: ['tag1p1', 'tag2p1'],
        fixture: 'video_short1.webm'
    };
    const unlistedVideoAttributes = extra_utils_1.immutableAssign(videoAttributes, {
        privacy: 2
    });
    let checkAttributes;
    let unlistedCheckAttributes;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3);
            checkAttributes = {
                name: 'my super name for server 1',
                category: 5,
                licence: 4,
                language: 'ja',
                nsfw: true,
                description: 'my super description for server 1',
                support: 'my super support text for server 1',
                account: {
                    name: 'root',
                    host: 'localhost:' + servers[0].port
                },
                isLocal: false,
                duration: 10,
                tags: ['tag1p1', 'tag2p1'],
                privacy: 1,
                commentsEnabled: true,
                downloadEnabled: true,
                channel: {
                    name: 'root_channel',
                    displayName: 'Main root channel',
                    description: '',
                    isLocal: false
                },
                fixture: 'video_short1.webm',
                files: [
                    {
                        resolution: 720,
                        size: 572456
                    }
                ]
            };
            unlistedCheckAttributes = extra_utils_1.immutableAssign(checkAttributes, {
                privacy: 2
            });
            yield extra_utils_1.setAccessTokensToServers(servers);
        });
    });
    it('Should remove followers that are often down', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(240000);
            yield follows_1.follow(servers[1].url, [servers[0].url], servers[1].accessToken);
            yield follows_1.follow(servers[2].url, [servers[0].url], servers[2].accessToken);
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data).to.have.lengthOf(1);
            }
            extra_utils_1.killallServers([servers[1]]);
            for (let i = 0; i < 10; i++) {
                yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            }
            yield jobs_1.waitJobs(servers[0]);
            extra_utils_1.killallServers([servers[2]]);
            const resLastVideo1 = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            missedVideo1 = resLastVideo1.body.video;
            const resLastVideo2 = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            missedVideo2 = resLastVideo2.body.video;
            const resVideo = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, unlistedVideoAttributes);
            unlistedVideo = resVideo.body.video;
            {
                const text = 'thread 1';
                let resComment = yield video_comments_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, missedVideo2.uuid, text);
                let comment = resComment.body.comment;
                threadIdServer1 = comment.id;
                resComment = yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, missedVideo2.uuid, comment.id, 'comment 1-1');
                comment = resComment.body.comment;
                resComment = yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, missedVideo2.uuid, comment.id, 'comment 1-2');
                commentIdServer1 = resComment.body.comment.id;
            }
            yield jobs_1.waitJobs(servers[0]);
            yield extra_utils_1.wait(11000);
            const res = yield follows_1.getFollowersListPaginationAndSort({ url: servers[0].url, start: 0, count: 2, sort: 'createdAt' });
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].follower.host).to.equal('localhost:' + servers[2].port);
        });
    });
    it('Should not have pending/processing jobs anymore', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const states = ['waiting', 'active'];
            for (const state of states) {
                const res = yield jobs_1.getJobsListPaginationAndSort({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    state: state,
                    start: 0,
                    count: 50,
                    sort: '-createdAt'
                });
                expect(res.body.data).to.have.length(0);
            }
        });
    });
    it('Should re-follow server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(35000);
            yield extra_utils_1.reRunServer(servers[1]);
            yield extra_utils_1.reRunServer(servers[2]);
            yield extra_utils_1.unfollow(servers[1].url, servers[1].accessToken, servers[0]);
            yield jobs_1.waitJobs(servers);
            yield follows_1.follow(servers[1].url, [servers[0].url], servers[1].accessToken);
            yield jobs_1.waitJobs(servers);
            const res = yield follows_1.getFollowersListPaginationAndSort({ url: servers[0].url, start: 0, count: 2, sort: 'createdAt' });
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(2);
        });
    });
    it('Should send an update to server 3, and automatically fetch the video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            const res1 = yield extra_utils_1.getVideosList(servers[2].url);
            expect(res1.body.data).to.be.an('array');
            expect(res1.body.data).to.have.lengthOf(11);
            yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, missedVideo1.uuid, {});
            yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, unlistedVideo.uuid, {});
            yield jobs_1.waitJobs(servers);
            const res = yield extra_utils_1.getVideosList(servers[2].url);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(12);
            const resVideo = yield extra_utils_1.getVideo(servers[2].url, unlistedVideo.uuid);
            expect(resVideo.body).not.to.be.undefined;
            yield extra_utils_1.completeVideoCheck(servers[2].url, resVideo.body, unlistedCheckAttributes);
        });
    });
    it('Should send comments on a video to server 3, and automatically fetch the video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(25000);
            yield video_comments_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, missedVideo2.uuid, commentIdServer1, 'comment 1-3');
            yield jobs_1.waitJobs(servers);
            const resVideo = yield extra_utils_1.getVideo(servers[2].url, missedVideo2.uuid);
            expect(resVideo.body).not.to.be.undefined;
            {
                let resComment = yield video_comments_1.getVideoCommentThreads(servers[2].url, missedVideo2.uuid, 0, 5);
                expect(resComment.body.data).to.be.an('array');
                expect(resComment.body.data).to.have.lengthOf(1);
                threadIdServer2 = resComment.body.data[0].id;
                resComment = yield video_comments_1.getVideoThreadComments(servers[2].url, missedVideo2.uuid, threadIdServer2);
                const tree = resComment.body;
                expect(tree.comment.text).equal('thread 1');
                expect(tree.children).to.have.lengthOf(1);
                const firstChild = tree.children[0];
                expect(firstChild.comment.text).to.equal('comment 1-1');
                expect(firstChild.children).to.have.lengthOf(1);
                const childOfFirstChild = firstChild.children[0];
                expect(childOfFirstChild.comment.text).to.equal('comment 1-2');
                expect(childOfFirstChild.children).to.have.lengthOf(1);
                const childOfChildFirstChild = childOfFirstChild.children[0];
                expect(childOfChildFirstChild.comment.text).to.equal('comment 1-3');
                expect(childOfChildFirstChild.children).to.have.lengthOf(0);
                commentIdServer2 = childOfChildFirstChild.comment.id;
            }
        });
    });
    it('Should correctly reply to the comment', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            yield video_comments_1.addVideoCommentReply(servers[2].url, servers[2].accessToken, missedVideo2.uuid, commentIdServer2, 'comment 1-4');
            yield jobs_1.waitJobs(servers);
            {
                const resComment = yield video_comments_1.getVideoThreadComments(servers[0].url, missedVideo2.uuid, threadIdServer1);
                const tree = resComment.body;
                expect(tree.comment.text).equal('thread 1');
                expect(tree.children).to.have.lengthOf(1);
                const firstChild = tree.children[0];
                expect(firstChild.comment.text).to.equal('comment 1-1');
                expect(firstChild.children).to.have.lengthOf(1);
                const childOfFirstChild = firstChild.children[0];
                expect(childOfFirstChild.comment.text).to.equal('comment 1-2');
                expect(childOfFirstChild.children).to.have.lengthOf(1);
                const childOfChildFirstChild = childOfFirstChild.children[0];
                expect(childOfChildFirstChild.comment.text).to.equal('comment 1-3');
                expect(childOfChildFirstChild.children).to.have.lengthOf(1);
                const childOfChildOfChildOfFirstChild = childOfChildFirstChild.children[0];
                expect(childOfChildOfChildOfFirstChild.comment.text).to.equal('comment 1-4');
                expect(childOfChildOfChildOfFirstChild.children).to.have.lengthOf(0);
            }
        });
    });
    it('Should upload many videos on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            for (let i = 0; i < 10; i++) {
                const uuid = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video ' + i })).uuid;
                videoIdsServer1.push(uuid);
            }
            yield jobs_1.waitJobs(servers);
            for (const id of videoIdsServer1) {
                yield extra_utils_1.getVideo(servers[1].url, id);
            }
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.setActorFollowScores(servers[1].internalServerNumber, 20);
            yield extra_utils_1.wait(11000);
            yield extra_utils_1.getVideo(servers[1].url, videoIdsServer1[0]);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should remove followings that are down', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            extra_utils_1.killallServers([servers[0]]);
            yield extra_utils_1.wait(11000);
            for (let i = 0; i < 3; i++) {
                yield extra_utils_1.getVideo(servers[1].url, videoIdsServer1[i]);
                yield extra_utils_1.wait(1000);
                yield jobs_1.waitJobs([servers[1]]);
            }
            for (const id of videoIdsServer1) {
                yield extra_utils_1.getVideo(servers[1].url, id, 403);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.closeAllSequelize([servers[1]]);
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
