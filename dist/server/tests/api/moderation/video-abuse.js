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
describe('Test video abuses', function () {
    let servers = [];
    let abuseServer2;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            servers = yield index_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            yield follows_1.doubleFollow(servers[0], servers[1]);
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
    it('Should not have video abuses', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
            expect(res.body.total).to.equal(0);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(0);
        });
    });
    it('Should report abuse on a local video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(15000);
            const reason = 'my super bad reason';
            yield index_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, servers[0].video.id, reason);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have 1 video abuses on server 1 and 0 on server 2', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res1 = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
            expect(res1.body.total).to.equal(1);
            expect(res1.body.data).to.be.an('array');
            expect(res1.body.data.length).to.equal(1);
            const abuse = res1.body.data[0];
            expect(abuse.reason).to.equal('my super bad reason');
            expect(abuse.reporterAccount.name).to.equal('root');
            expect(abuse.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuse.video.id).to.equal(servers[0].video.id);
            expect(abuse.video.channel).to.exist;
            expect(abuse.video.countReports).to.equal(1);
            expect(abuse.video.nthReport).to.equal(1);
            expect(abuse.countReportsForReporter).to.equal(1);
            expect(abuse.countReportsForReportee).to.equal(1);
            const res2 = yield index_1.getVideoAbusesList({ url: servers[1].url, token: servers[1].accessToken });
            expect(res2.body.total).to.equal(0);
            expect(res2.body.data).to.be.an('array');
            expect(res2.body.data.length).to.equal(0);
        });
    });
    it('Should report abuse on a remote video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const reason = 'my super bad reason 2';
            yield index_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, servers[1].video.id, reason);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have 2 video abuses on server 1 and 1 on server 2', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res1 = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
            expect(res1.body.total).to.equal(2);
            expect(res1.body.data).to.be.an('array');
            expect(res1.body.data.length).to.equal(2);
            const abuse1 = res1.body.data[0];
            expect(abuse1.reason).to.equal('my super bad reason');
            expect(abuse1.reporterAccount.name).to.equal('root');
            expect(abuse1.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuse1.video.id).to.equal(servers[0].video.id);
            expect(abuse1.state.id).to.equal(1);
            expect(abuse1.state.label).to.equal('Pending');
            expect(abuse1.moderationComment).to.be.null;
            expect(abuse1.video.countReports).to.equal(1);
            expect(abuse1.video.nthReport).to.equal(1);
            const abuse2 = res1.body.data[1];
            expect(abuse2.reason).to.equal('my super bad reason 2');
            expect(abuse2.reporterAccount.name).to.equal('root');
            expect(abuse2.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuse2.video.id).to.equal(servers[1].video.id);
            expect(abuse2.state.id).to.equal(1);
            expect(abuse2.state.label).to.equal('Pending');
            expect(abuse2.moderationComment).to.be.null;
            const res2 = yield index_1.getVideoAbusesList({ url: servers[1].url, token: servers[1].accessToken });
            expect(res2.body.total).to.equal(1);
            expect(res2.body.data).to.be.an('array');
            expect(res2.body.data.length).to.equal(1);
            abuseServer2 = res2.body.data[0];
            expect(abuseServer2.reason).to.equal('my super bad reason 2');
            expect(abuseServer2.reporterAccount.name).to.equal('root');
            expect(abuseServer2.reporterAccount.host).to.equal('localhost:' + servers[0].port);
            expect(abuseServer2.state.id).to.equal(1);
            expect(abuseServer2.state.label).to.equal('Pending');
            expect(abuseServer2.moderationComment).to.be.null;
        });
    });
    it('Should update the state of a video abuse', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const body = { state: 2 };
            yield index_1.updateVideoAbuse(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid, abuseServer2.id, body);
            const res = yield index_1.getVideoAbusesList({ url: servers[1].url, token: servers[1].accessToken });
            expect(res.body.data[0].state.id).to.equal(2);
        });
    });
    it('Should add a moderation comment', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const body = { state: 3, moderationComment: 'It is valid' };
            yield index_1.updateVideoAbuse(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid, abuseServer2.id, body);
            const res = yield index_1.getVideoAbusesList({ url: servers[1].url, token: servers[1].accessToken });
            expect(res.body.data[0].state.id).to.equal(3);
            expect(res.body.data[0].moderationComment).to.equal('It is valid');
        });
    });
    it('Should hide video abuses from blocked accounts', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            {
                yield index_1.reportVideoAbuse(servers[1].url, servers[1].accessToken, servers[0].video.uuid, 'will mute this');
                yield jobs_1.waitJobs(servers);
                const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(3);
            }
            const accountToBlock = 'root@localhost:' + servers[1].port;
            {
                yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, accountToBlock);
                const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(2);
                const abuse = res.body.data.find(a => a.reason === 'will mute this');
                expect(abuse).to.be.undefined;
            }
            {
                yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, accountToBlock);
                const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(3);
            }
        });
    });
    it('Should hide video abuses from blocked servers', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const serverToBlock = servers[1].host;
            {
                yield blocklist_1.addServerToServerBlocklist(servers[0].url, servers[0].accessToken, servers[1].host);
                const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(2);
                const abuse = res.body.data.find(a => a.reason === 'will mute this');
                expect(abuse).to.be.undefined;
            }
            {
                yield blocklist_1.removeServerFromServerBlocklist(servers[0].url, servers[0].accessToken, serverToBlock);
                const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(3);
            }
        });
    });
    it('Should keep the video abuse when deleting the video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield index_1.removeVideo(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid);
            yield jobs_1.waitJobs(servers);
            const res = yield index_1.getVideoAbusesList({ url: servers[1].url, token: servers[1].accessToken });
            expect(res.body.total).to.equal(2, "wrong number of videos returned");
            expect(res.body.data.length).to.equal(2, "wrong number of videos returned");
            expect(res.body.data[0].id).to.equal(abuseServer2.id, "wrong origin server id for first video");
            const abuse = res.body.data[0];
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
            yield index_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, video3.id, reason3);
            const reason4 = 'my super bad reason 4';
            yield index_1.reportVideoAbuse(servers[0].url, userAccessToken, servers[0].video.id, reason4);
            const res2 = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
            {
                for (const abuse of res2.body.data) {
                    if (abuse.video.id === video3.id) {
                        expect(abuse.video.countReports).to.equal(1, "wrong reports count for video 3");
                        expect(abuse.video.nthReport).to.equal(1, "wrong report position in report list for video 3");
                        expect(abuse.countReportsForReportee).to.equal(1, "wrong reports count for reporter on video 3 abuse");
                        expect(abuse.countReportsForReporter).to.equal(3, "wrong reports count for reportee on video 3 abuse");
                    }
                    if (abuse.video.id === servers[0].video.id) {
                        expect(abuse.countReportsForReportee).to.equal(3, "wrong reports count for reporter on video 1 abuse");
                    }
                }
            }
        });
    });
    it('Should list predefined reasons as well as timestamps for the reported video', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            const reason5 = 'my super bad reason 5';
            const predefinedReasons5 = ['violentOrRepulsive', 'captions'];
            const createdAbuse = (yield index_1.reportVideoAbuse(servers[0].url, servers[0].accessToken, servers[0].video.id, reason5, predefinedReasons5, 1, 5)).body.abuse;
            const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
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
            yield index_1.deleteVideoAbuse(servers[1].url, servers[1].accessToken, abuseServer2.video.uuid, abuseServer2.id);
            yield jobs_1.waitJobs(servers);
            {
                const res = yield index_1.getVideoAbusesList({ url: servers[1].url, token: servers[1].accessToken });
                expect(res.body.total).to.equal(1);
                expect(res.body.data.length).to.equal(1);
                expect(res.body.data[0].id).to.not.equal(abuseServer2.id);
            }
            {
                const res = yield index_1.getVideoAbusesList({ url: servers[0].url, token: servers[0].accessToken });
                expect(res.body.total).to.equal(6);
            }
        });
    });
    it('Should list and filter video abuses', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            function list(query) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const options = {
                        url: servers[0].url,
                        token: servers[0].accessToken
                    };
                    Object.assign(options, query);
                    const res = yield index_1.getVideoAbusesList(options);
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
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
