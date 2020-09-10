"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const index_1 = require("../../../../shared/extra-utils/index");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const blocklist_1 = require("../../../../shared/extra-utils/users/blocklist");
const expect = chai.expect;
describe('Test abuses', function () {
    let servers = [];
    let abuseServer1;
    let abuseServer2;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            servers = yield index_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            yield follows_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('Video abuses', function () {
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                const video1Attributes = {
                    name: 'my super name for server 1',
                    description: 'my super description for server 1'
                };
                yield index_1.uploadVideo(servers[0].url, servers[0].accessToken, video1Attributes);
                const video2Attributes = {
                    name: 'my super name for server 2',
                    description: 'my super description for server 2'
                };
                yield index_1.uploadVideo(servers[1].url, servers[1].accessToken, video2Attributes);
                yield jobs_1.waitJobs(servers);
                const res = yield index_1.getVideosList(servers[0].url);
                const videos = res.body.data;
                expect(videos.length).to.equal(2);
                servers[0].video = videos.find(video => video.name === 'my super name for server 1');
                servers[1].video = videos.find(video => video.name === 'my super name for server 2');
            });
        });
        it('Should not have abuses', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.equal(0);
            });
        });
        it('Should report abuse on a local video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                const reason = 'my super bad reason';
                yield index_1.reportAbuse({ url: servers[0].url, token: servers[0].accessToken, videoId: servers[0].video.id, reason });
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have 1 video abuses on server 1 and 0 on server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res1 = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res1.body.total).to.equal(1);
                expect(res1.body.data).to.be.an('array');
                expect(res1.body.data.length).to.equal(1);
                const abuse = res1.body.data[0];
                expect(abuse.reason).to.equal('my super bad reason');
                expect(abuse.reporterAccount.name).to.equal('root');
                expect(abuse.reporterAccount.host).to.equal(servers[0].host);
                expect(abuse.video.id).to.equal(servers[0].video.id);
                expect(abuse.video.channel).to.exist;
                expect(abuse.comment).to.be.null;
                expect(abuse.flaggedAccount.name).to.equal('root');
                expect(abuse.flaggedAccount.host).to.equal(servers[0].host);
                expect(abuse.video.countReports).to.equal(1);
                expect(abuse.video.nthReport).to.equal(1);
                expect(abuse.countReportsForReporter).to.equal(1);
                expect(abuse.countReportsForReportee).to.equal(1);
                const res2 = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken });
                expect(res2.body.total).to.equal(0);
                expect(res2.body.data).to.be.an('array');
                expect(res2.body.data.length).to.equal(0);
            });
        });
        it('Should report abuse on a remote video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const reason = 'my super bad reason 2';
                const videoId = yield index_1.getVideoIdFromUUID(servers[0].url, servers[1].video.uuid);
                yield index_1.reportAbuse({ url: servers[0].url, token: servers[0].accessToken, videoId, reason });
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have 2 video abuses on server 1 and 1 on server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res1 = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res1.body.total).to.equal(2);
                expect(res1.body.data.length).to.equal(2);
                const abuse1 = res1.body.data[0];
                expect(abuse1.reason).to.equal('my super bad reason');
                expect(abuse1.reporterAccount.name).to.equal('root');
                expect(abuse1.reporterAccount.host).to.equal(servers[0].host);
                expect(abuse1.video.id).to.equal(servers[0].video.id);
                expect(abuse1.video.countReports).to.equal(1);
                expect(abuse1.video.nthReport).to.equal(1);
                expect(abuse1.comment).to.be.null;
                expect(abuse1.flaggedAccount.name).to.equal('root');
                expect(abuse1.flaggedAccount.host).to.equal(servers[0].host);
                expect(abuse1.state.id).to.equal(1);
                expect(abuse1.state.label).to.equal('Pending');
                expect(abuse1.moderationComment).to.be.null;
                const abuse2 = res1.body.data[1];
                expect(abuse2.reason).to.equal('my super bad reason 2');
                expect(abuse2.reporterAccount.name).to.equal('root');
                expect(abuse2.reporterAccount.host).to.equal(servers[0].host);
                expect(abuse2.video.id).to.equal(servers[1].video.id);
                expect(abuse2.comment).to.be.null;
                expect(abuse2.flaggedAccount.name).to.equal('root');
                expect(abuse2.flaggedAccount.host).to.equal(servers[1].host);
                expect(abuse2.state.id).to.equal(1);
                expect(abuse2.state.label).to.equal('Pending');
                expect(abuse2.moderationComment).to.be.null;
                const res2 = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken });
                expect(res2.body.total).to.equal(1);
                expect(res2.body.data.length).to.equal(1);
                abuseServer2 = res2.body.data[0];
                expect(abuseServer2.reason).to.equal('my super bad reason 2');
                expect(abuseServer2.reporterAccount.name).to.equal('root');
                expect(abuseServer2.reporterAccount.host).to.equal(servers[0].host);
                expect(abuse2.flaggedAccount.name).to.equal('root');
                expect(abuse2.flaggedAccount.host).to.equal(servers[1].host);
                expect(abuseServer2.state.id).to.equal(1);
                expect(abuseServer2.state.label).to.equal('Pending');
                expect(abuseServer2.moderationComment).to.be.null;
            });
        });
        it('Should hide video abuses from blocked accounts', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                {
                    const videoId = yield index_1.getVideoIdFromUUID(servers[1].url, servers[0].video.uuid);
                    yield index_1.reportAbuse({ url: servers[1].url, token: servers[1].accessToken, videoId, reason: 'will mute this' });
                    yield jobs_1.waitJobs(servers);
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                    expect(res.body.total).to.equal(3);
                }
                const accountToBlock = 'root@' + servers[1].host;
                {
                    yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, accountToBlock);
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                    expect(res.body.total).to.equal(2);
                    const abuse = res.body.data.find(a => a.reason === 'will mute this');
                    expect(abuse).to.be.undefined;
                }
                {
                    yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, accountToBlock);
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                    expect(res.body.total).to.equal(3);
                }
            });
        });
        it('Should hide video abuses from blocked servers', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const serverToBlock = servers[1].host;
                {
                    yield blocklist_1.addServerToServerBlocklist(servers[0].url, servers[0].accessToken, servers[1].host);
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                    expect(res.body.total).to.equal(2);
                    const abuse = res.body.data.find(a => a.reason === 'will mute this');
                    expect(abuse).to.be.undefined;
                }
                {
                    yield blocklist_1.removeServerFromServerBlocklist(servers[0].url, servers[0].accessToken, serverToBlock);
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                    expect(res.body.total).to.equal(3);
                }
            });
        });
        it('Should keep the video abuse when deleting the video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.removeVideo(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid);
                yield jobs_1.waitJobs(servers);
                const res = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken });
                expect(res.body.total).to.equal(2, "wrong number of videos returned");
                expect(res.body.data).to.have.lengthOf(2, "wrong number of videos returned");
                const abuse = res.body.data[0];
                expect(abuse.id).to.equal(abuseServer2.id, "wrong origin server id for first video");
                expect(abuse.video.id).to.equal(abuseServer2.video.id, "wrong video id");
                expect(abuse.video.channel).to.exist;
                expect(abuse.video.deleted).to.be.true;
            });
        });
        it('Should include counts of reports from reporter and reportee', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const user = { username: 'user2', password: 'password' };
                yield index_1.createUser(Object.assign({ url: servers[0].url, accessToken: servers[0].accessToken }, user));
                const userAccessToken = yield index_1.userLogin(servers[0], user);
                const video3Attributes = {
                    name: 'my second super name for server 1',
                    description: 'my second super description for server 1'
                };
                yield index_1.uploadVideo(servers[0].url, userAccessToken, video3Attributes);
                const res1 = yield index_1.getVideosList(servers[0].url);
                const videos = res1.body.data;
                const video3 = videos.find(video => video.name === 'my second super name for server 1');
                const reason3 = 'my super bad reason 3';
                yield index_1.reportAbuse({ url: servers[0].url, token: servers[0].accessToken, videoId: video3.id, reason: reason3 });
                const reason4 = 'my super bad reason 4';
                yield index_1.reportAbuse({ url: servers[0].url, token: userAccessToken, videoId: servers[0].video.id, reason: reason4 });
                {
                    const res2 = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                    const abuses = res2.body.data;
                    const abuseVideo3 = res2.body.data.find(a => a.video.id === video3.id);
                    expect(abuseVideo3).to.not.be.undefined;
                    expect(abuseVideo3.video.countReports).to.equal(1, "wrong reports count for video 3");
                    expect(abuseVideo3.video.nthReport).to.equal(1, "wrong report position in report list for video 3");
                    expect(abuseVideo3.countReportsForReportee).to.equal(1, "wrong reports count for reporter on video 3 abuse");
                    expect(abuseVideo3.countReportsForReporter).to.equal(3, "wrong reports count for reportee on video 3 abuse");
                    const abuseServer1 = abuses.find(a => a.video.id === servers[0].video.id);
                    expect(abuseServer1.countReportsForReportee).to.equal(3, "wrong reports count for reporter on video 1 abuse");
                }
            });
        });
        it('Should list predefined reasons as well as timestamps for the reported video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const reason5 = 'my super bad reason 5';
                const predefinedReasons5 = ['violentOrRepulsive', 'captions'];
                const createdAbuse = (yield index_1.reportAbuse({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    videoId: servers[0].video.id,
                    reason: reason5,
                    predefinedReasons: predefinedReasons5,
                    startAt: 1,
                    endAt: 5
                })).body.abuse;
                const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                {
                    const abuse = res.body.data.find(a => a.id === createdAbuse.id);
                    expect(abuse.reason).to.equals(reason5);
                    expect(abuse.predefinedReasons).to.deep.equals(predefinedReasons5, "predefined reasons do not match the one reported");
                    expect(abuse.video.startAt).to.equal(1, "starting timestamp doesn't match the one reported");
                    expect(abuse.video.endAt).to.equal(5, "ending timestamp doesn't match the one reported");
                }
            });
        });
        it('Should delete the video abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.deleteAbuse(servers[1].url, servers[1].accessToken, abuseServer2.id);
                yield jobs_1.waitJobs(servers);
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken });
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data.length).to.equal(1);
                    expect(res.body.data[0].id).to.not.equal(abuseServer2.id);
                }
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                    expect(res.body.total).to.equal(6);
                }
            });
        });
        it('Should list and filter video abuses', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                function list(query) {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const options = {
                            url: servers[0].url,
                            token: servers[0].accessToken
                        };
                        Object.assign(options, query);
                        const res = yield index_1.getAdminAbusesList(options);
                        return res.body.data;
                    });
                }
                expect(yield list({ id: 56 })).to.have.lengthOf(0);
                expect(yield list({ id: 1 })).to.have.lengthOf(1);
                expect(yield list({ search: 'my super name for server 1' })).to.have.lengthOf(4);
                expect(yield list({ search: 'aaaaaaaaaaaaaaaaaaaaaaaaaa' })).to.have.lengthOf(0);
                expect(yield list({ searchVideo: 'my second super name for server 1' })).to.have.lengthOf(1);
                expect(yield list({ searchVideoChannel: 'root' })).to.have.lengthOf(4);
                expect(yield list({ searchVideoChannel: 'aaaa' })).to.have.lengthOf(0);
                expect(yield list({ searchReporter: 'user2' })).to.have.lengthOf(1);
                expect(yield list({ searchReporter: 'root' })).to.have.lengthOf(5);
                expect(yield list({ searchReportee: 'root' })).to.have.lengthOf(5);
                expect(yield list({ searchReportee: 'aaaa' })).to.have.lengthOf(0);
                expect(yield list({ videoIs: 'deleted' })).to.have.lengthOf(1);
                expect(yield list({ videoIs: 'blacklisted' })).to.have.lengthOf(0);
                expect(yield list({ state: 3 })).to.have.lengthOf(0);
                expect(yield list({ state: 1 })).to.have.lengthOf(6);
                expect(yield list({ predefinedReason: 'violentOrRepulsive' })).to.have.lengthOf(1);
                expect(yield list({ predefinedReason: 'serverRules' })).to.have.lengthOf(0);
            });
        });
    });
    describe('Comment abuses', function () {
        function getComment(url, videoIdArg) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const videoId = typeof videoIdArg === 'string'
                    ? yield index_1.getVideoIdFromUUID(url, videoIdArg)
                    : videoIdArg;
                const res = yield index_1.getVideoCommentThreads(url, videoId, 0, 5);
                return res.body.data[0];
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                servers[0].video = yield index_1.uploadVideoAndGetId({ server: servers[0], videoName: 'server 1' });
                servers[1].video = yield index_1.uploadVideoAndGetId({ server: servers[1], videoName: 'server 2' });
                yield index_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, servers[0].video.id, 'comment server 1');
                yield index_1.addVideoCommentThread(servers[1].url, servers[1].accessToken, servers[1].video.id, 'comment server 2');
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should report abuse on a comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                const comment = yield getComment(servers[0].url, servers[0].video.id);
                const reason = 'it is a bad comment';
                yield index_1.reportAbuse({ url: servers[0].url, token: servers[0].accessToken, commentId: comment.id, reason });
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have 1 comment abuse on server 1 and 0 on server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const comment = yield getComment(servers[0].url, servers[0].video.id);
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'comment' });
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                    const abuse = res.body.data[0];
                    expect(abuse.reason).to.equal('it is a bad comment');
                    expect(abuse.reporterAccount.name).to.equal('root');
                    expect(abuse.reporterAccount.host).to.equal(servers[0].host);
                    expect(abuse.video).to.be.null;
                    expect(abuse.comment.deleted).to.be.false;
                    expect(abuse.comment.id).to.equal(comment.id);
                    expect(abuse.comment.text).to.equal(comment.text);
                    expect(abuse.comment.video.name).to.equal('server 1');
                    expect(abuse.comment.video.id).to.equal(servers[0].video.id);
                    expect(abuse.comment.video.uuid).to.equal(servers[0].video.uuid);
                    expect(abuse.countReportsForReporter).to.equal(5);
                    expect(abuse.countReportsForReportee).to.equal(5);
                }
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken, filter: 'comment' });
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data.length).to.equal(0);
                }
            });
        });
        it('Should report abuse on a remote comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const comment = yield getComment(servers[0].url, servers[1].video.uuid);
                const reason = 'it is a really bad comment';
                yield index_1.reportAbuse({ url: servers[0].url, token: servers[0].accessToken, commentId: comment.id, reason });
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have 2 comment abuses on server 1 and 1 on server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const commentServer2 = yield getComment(servers[0].url, servers[1].video.id);
                const res1 = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'comment' });
                expect(res1.body.total).to.equal(2);
                expect(res1.body.data.length).to.equal(2);
                const abuse = res1.body.data[0];
                expect(abuse.reason).to.equal('it is a bad comment');
                expect(abuse.countReportsForReporter).to.equal(6);
                expect(abuse.countReportsForReportee).to.equal(5);
                const abuse2 = res1.body.data[1];
                expect(abuse2.reason).to.equal('it is a really bad comment');
                expect(abuse2.reporterAccount.name).to.equal('root');
                expect(abuse2.reporterAccount.host).to.equal(servers[0].host);
                expect(abuse2.video).to.be.null;
                expect(abuse2.comment.deleted).to.be.false;
                expect(abuse2.comment.id).to.equal(commentServer2.id);
                expect(abuse2.comment.text).to.equal(commentServer2.text);
                expect(abuse2.comment.video.name).to.equal('server 2');
                expect(abuse2.comment.video.uuid).to.equal(servers[1].video.uuid);
                expect(abuse2.state.id).to.equal(1);
                expect(abuse2.state.label).to.equal('Pending');
                expect(abuse2.moderationComment).to.be.null;
                expect(abuse2.countReportsForReporter).to.equal(6);
                expect(abuse2.countReportsForReportee).to.equal(2);
                const res2 = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken, filter: 'comment' });
                expect(res2.body.total).to.equal(1);
                expect(res2.body.data.length).to.equal(1);
                abuseServer2 = res2.body.data[0];
                expect(abuseServer2.reason).to.equal('it is a really bad comment');
                expect(abuseServer2.reporterAccount.name).to.equal('root');
                expect(abuseServer2.reporterAccount.host).to.equal(servers[0].host);
                expect(abuseServer2.state.id).to.equal(1);
                expect(abuseServer2.state.label).to.equal('Pending');
                expect(abuseServer2.moderationComment).to.be.null;
                expect(abuseServer2.countReportsForReporter).to.equal(1);
                expect(abuseServer2.countReportsForReportee).to.equal(1);
            });
        });
        it('Should keep the comment abuse when deleting the comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const commentServer2 = yield getComment(servers[0].url, servers[1].video.id);
                yield index_1.deleteVideoComment(servers[0].url, servers[0].accessToken, servers[1].video.uuid, commentServer2.id);
                yield jobs_1.waitJobs(servers);
                const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'comment' });
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(2);
                const abuse = res.body.data.find(a => { var _a; return ((_a = a.comment) === null || _a === void 0 ? void 0 : _a.id) === commentServer2.id; });
                expect(abuse).to.not.be.undefined;
                expect(abuse.comment.text).to.be.empty;
                expect(abuse.comment.video.name).to.equal('server 2');
                expect(abuse.comment.deleted).to.be.true;
            });
        });
        it('Should delete the comment abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.deleteAbuse(servers[1].url, servers[1].accessToken, abuseServer2.id);
                yield jobs_1.waitJobs(servers);
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken, filter: 'comment' });
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data.length).to.equal(0);
                }
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'comment' });
                    expect(res.body.total).to.equal(2);
                }
            });
        });
        it('Should list and filter video abuses', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield index_1.getAdminAbusesList({
                        url: servers[0].url,
                        token: servers[0].accessToken,
                        filter: 'comment',
                        searchReportee: 'foo'
                    });
                    expect(res.body.total).to.equal(0);
                }
                {
                    const res = yield index_1.getAdminAbusesList({
                        url: servers[0].url,
                        token: servers[0].accessToken,
                        filter: 'comment',
                        searchReportee: 'ot'
                    });
                    expect(res.body.total).to.equal(2);
                }
                {
                    const baseParams = { url: servers[0].url, token: servers[0].accessToken, filter: 'comment', start: 1, count: 1 };
                    const res1 = yield index_1.getAdminAbusesList(index_1.immutableAssign(baseParams, { sort: 'createdAt' }));
                    expect(res1.body.data).to.have.lengthOf(1);
                    expect(res1.body.data[0].comment.text).to.be.empty;
                    const res2 = yield index_1.getAdminAbusesList(index_1.immutableAssign(baseParams, { sort: '-createdAt' }));
                    expect(res2.body.data).to.have.lengthOf(1);
                    expect(res2.body.data[0].comment.text).to.equal('comment server 1');
                }
            });
        });
    });
    describe('Account abuses', function () {
        function getAccountFromServer(url, name, server) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield index_1.getAccount(url, name + '@' + server.host);
                return res.body;
            });
        }
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(50000);
                yield index_1.createUser({ url: servers[0].url, accessToken: servers[0].accessToken, username: 'user_1', password: 'donald' });
                const token = yield index_1.generateUserAccessToken(servers[1], 'user_2');
                yield index_1.uploadVideo(servers[1].url, token, { name: 'super video' });
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should report abuse on an account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                const account = yield getAccountFromServer(servers[0].url, 'user_1', servers[0]);
                const reason = 'it is a bad account';
                yield index_1.reportAbuse({ url: servers[0].url, token: servers[0].accessToken, accountId: account.id, reason });
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have 1 account abuse on server 1 and 0 on server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'account' });
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                    const abuse = res.body.data[0];
                    expect(abuse.reason).to.equal('it is a bad account');
                    expect(abuse.reporterAccount.name).to.equal('root');
                    expect(abuse.reporterAccount.host).to.equal(servers[0].host);
                    expect(abuse.video).to.be.null;
                    expect(abuse.comment).to.be.null;
                    expect(abuse.flaggedAccount.name).to.equal('user_1');
                    expect(abuse.flaggedAccount.host).to.equal(servers[0].host);
                }
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken, filter: 'comment' });
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data.length).to.equal(0);
                }
            });
        });
        it('Should report abuse on a remote account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const account = yield getAccountFromServer(servers[0].url, 'user_2', servers[1]);
                const reason = 'it is a really bad account';
                yield index_1.reportAbuse({ url: servers[0].url, token: servers[0].accessToken, accountId: account.id, reason });
                yield jobs_1.waitJobs(servers);
            });
        });
        it('Should have 2 comment abuses on server 1 and 1 on server 2', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res1 = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'account' });
                expect(res1.body.total).to.equal(2);
                expect(res1.body.data.length).to.equal(2);
                const abuse = res1.body.data[0];
                expect(abuse.reason).to.equal('it is a bad account');
                const abuse2 = res1.body.data[1];
                expect(abuse2.reason).to.equal('it is a really bad account');
                expect(abuse2.reporterAccount.name).to.equal('root');
                expect(abuse2.reporterAccount.host).to.equal(servers[0].host);
                expect(abuse2.video).to.be.null;
                expect(abuse2.comment).to.be.null;
                expect(abuse2.state.id).to.equal(1);
                expect(abuse2.state.label).to.equal('Pending');
                expect(abuse2.moderationComment).to.be.null;
                const res2 = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken, filter: 'account' });
                expect(res2.body.total).to.equal(1);
                expect(res2.body.data.length).to.equal(1);
                abuseServer2 = res2.body.data[0];
                expect(abuseServer2.reason).to.equal('it is a really bad account');
                expect(abuseServer2.reporterAccount.name).to.equal('root');
                expect(abuseServer2.reporterAccount.host).to.equal(servers[0].host);
                expect(abuseServer2.state.id).to.equal(1);
                expect(abuseServer2.state.label).to.equal('Pending');
                expect(abuseServer2.moderationComment).to.be.null;
            });
        });
        it('Should keep the account abuse when deleting the account', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const account = yield getAccountFromServer(servers[1].url, 'user_2', servers[1]);
                yield index_1.removeUser(servers[1].url, account.userId, servers[1].accessToken);
                yield jobs_1.waitJobs(servers);
                const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'account' });
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(2);
                const abuse = res.body.data.find(a => a.reason === 'it is a really bad account');
                expect(abuse).to.not.be.undefined;
            });
        });
        it('Should delete the account abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield index_1.deleteAbuse(servers[1].url, servers[1].accessToken, abuseServer2.id);
                yield jobs_1.waitJobs(servers);
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[1].url, token: servers[1].accessToken, filter: 'account' });
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data.length).to.equal(0);
                }
                {
                    const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, filter: 'account' });
                    expect(res.body.total).to.equal(2);
                    abuseServer1 = res.body.data[0];
                }
            });
        });
    });
    describe('Common actions on abuses', function () {
        it('Should update the state of an abuse', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { state: 2 };
                yield index_1.updateAbuse(servers[0].url, servers[0].accessToken, abuseServer1.id, body);
                const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, id: abuseServer1.id });
                expect(res.body.data[0].state.id).to.equal(2);
            });
        });
        it('Should add a moderation comment', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const body = { state: 3, moderationComment: 'It is valid' };
                yield index_1.updateAbuse(servers[0].url, servers[0].accessToken, abuseServer1.id, body);
                const res = yield index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, id: abuseServer1.id });
                expect(res.body.data[0].state.id).to.equal(3);
                expect(res.body.data[0].moderationComment).to.equal('It is valid');
            });
        });
    });
    describe('My abuses', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let abuseId1;
            let userAccessToken;
            before(function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    userAccessToken = yield index_1.generateUserAccessToken(servers[0], 'user_42');
                    yield index_1.reportAbuse({ url: servers[0].url, token: userAccessToken, videoId: servers[0].video.id, reason: 'user reason 1' });
                    const videoId = yield index_1.getVideoIdFromUUID(servers[0].url, servers[1].video.uuid);
                    yield index_1.reportAbuse({ url: servers[0].url, token: userAccessToken, videoId, reason: 'user reason 2' });
                });
            });
            it('Should correctly list my abuses', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    {
                        const res = yield index_1.getUserAbusesList({ url: servers[0].url, token: userAccessToken, start: 0, count: 5, sort: 'createdAt' });
                        expect(res.body.total).to.equal(2);
                        const abuses = res.body.data;
                        expect(abuses[0].reason).to.equal('user reason 1');
                        expect(abuses[1].reason).to.equal('user reason 2');
                        abuseId1 = abuses[0].id;
                    }
                    {
                        const res = yield index_1.getUserAbusesList({ url: servers[0].url, token: userAccessToken, start: 1, count: 1, sort: 'createdAt' });
                        expect(res.body.total).to.equal(2);
                        const abuses = res.body.data;
                        expect(abuses[0].reason).to.equal('user reason 2');
                    }
                    {
                        const res = yield index_1.getUserAbusesList({ url: servers[0].url, token: userAccessToken, start: 1, count: 1, sort: '-createdAt' });
                        expect(res.body.total).to.equal(2);
                        const abuses = res.body.data;
                        expect(abuses[0].reason).to.equal('user reason 1');
                    }
                });
            });
            it('Should correctly filter my abuses by id', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield index_1.getUserAbusesList({ url: servers[0].url, token: userAccessToken, id: abuseId1 });
                    expect(res.body.total).to.equal(1);
                    const abuses = res.body.data;
                    expect(abuses[0].reason).to.equal('user reason 1');
                });
            });
            it('Should correctly filter my abuses by search', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield index_1.getUserAbusesList({
                        url: servers[0].url,
                        token: userAccessToken,
                        search: 'server 2'
                    });
                    expect(res.body.total).to.equal(1);
                    const abuses = res.body.data;
                    expect(abuses[0].reason).to.equal('user reason 2');
                });
            });
            it('Should correctly filter my abuses by state', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const body = { state: 2 };
                    yield index_1.updateAbuse(servers[0].url, servers[0].accessToken, abuseId1, body);
                    const res = yield index_1.getUserAbusesList({
                        url: servers[0].url,
                        token: userAccessToken,
                        state: 2
                    });
                    expect(res.body.total).to.equal(1);
                    const abuses = res.body.data;
                    expect(abuses[0].reason).to.equal('user reason 1');
                });
            });
        });
    });
    describe('Abuse messages', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let abuseId;
            let userAccessToken;
            let abuseMessageUserId;
            let abuseMessageModerationId;
            before(function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    userAccessToken = yield index_1.generateUserAccessToken(servers[0], 'user_43');
                    const res = yield index_1.reportAbuse({
                        url: servers[0].url,
                        token: userAccessToken,
                        videoId: servers[0].video.id,
                        reason: 'user 43 reason 1'
                    });
                    abuseId = res.body.abuse.id;
                });
            });
            it('Should create some messages on the abuse', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield index_1.addAbuseMessage(servers[0].url, userAccessToken, abuseId, 'message 1');
                    yield index_1.addAbuseMessage(servers[0].url, servers[0].accessToken, abuseId, 'message 2');
                    yield index_1.addAbuseMessage(servers[0].url, servers[0].accessToken, abuseId, 'message 3');
                    yield index_1.addAbuseMessage(servers[0].url, userAccessToken, abuseId, 'message 4');
                });
            });
            it('Should have the correct messages count when listing abuses', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const results = yield Promise.all([
                        index_1.getAdminAbusesList({ url: servers[0].url, token: servers[0].accessToken, start: 0, count: 50 }),
                        index_1.getUserAbusesList({ url: servers[0].url, token: userAccessToken, start: 0, count: 50 })
                    ]);
                    for (const res of results) {
                        const abuses = res.body.data;
                        const abuse = abuses.find(a => a.id === abuseId);
                        expect(abuse.countMessages).to.equal(4);
                    }
                });
            });
            it('Should correctly list messages of this abuse', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const results = yield Promise.all([
                        index_1.listAbuseMessages(servers[0].url, servers[0].accessToken, abuseId),
                        index_1.listAbuseMessages(servers[0].url, userAccessToken, abuseId)
                    ]);
                    for (const res of results) {
                        expect(res.body.total).to.equal(4);
                        const abuseMessages = res.body.data;
                        expect(abuseMessages[0].message).to.equal('message 1');
                        expect(abuseMessages[0].byModerator).to.be.false;
                        expect(abuseMessages[0].account.name).to.equal('user_43');
                        abuseMessageUserId = abuseMessages[0].id;
                        expect(abuseMessages[1].message).to.equal('message 2');
                        expect(abuseMessages[1].byModerator).to.be.true;
                        expect(abuseMessages[1].account.name).to.equal('root');
                        expect(abuseMessages[2].message).to.equal('message 3');
                        expect(abuseMessages[2].byModerator).to.be.true;
                        expect(abuseMessages[2].account.name).to.equal('root');
                        abuseMessageModerationId = abuseMessages[2].id;
                        expect(abuseMessages[3].message).to.equal('message 4');
                        expect(abuseMessages[3].byModerator).to.be.false;
                        expect(abuseMessages[3].account.name).to.equal('user_43');
                    }
                });
            });
            it('Should delete messages', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    yield index_1.deleteAbuseMessage(servers[0].url, servers[0].accessToken, abuseId, abuseMessageModerationId);
                    yield index_1.deleteAbuseMessage(servers[0].url, userAccessToken, abuseId, abuseMessageUserId);
                    const results = yield Promise.all([
                        index_1.listAbuseMessages(servers[0].url, servers[0].accessToken, abuseId),
                        index_1.listAbuseMessages(servers[0].url, userAccessToken, abuseId)
                    ]);
                    for (const res of results) {
                        expect(res.body.total).to.equal(2);
                        const abuseMessages = res.body.data;
                        expect(abuseMessages[0].message).to.equal('message 2');
                        expect(abuseMessages[1].message).to.equal('message 4');
                    }
                });
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
