"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const index_1 = require("../../../../shared/extra-utils/index");
const follows_1 = require("../../../../shared/extra-utils/server/follows");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const servers_1 = require("../../../../shared/extra-utils/server/servers");
const videos_1 = require("../../../../shared/extra-utils/videos/videos");
const miscs_1 = require("../../../../shared/extra-utils/miscs/miscs");
const expect = chai.expect;
describe('Test jobs', function () {
    let servers;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield servers_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            yield follows_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should create some jobs', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            yield videos_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video1' });
            yield videos_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video2' });
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should list jobs', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield jobs_1.getJobsList(servers[1].url, servers[1].accessToken, 'completed');
            expect(res.body.total).to.be.above(2);
            expect(res.body.data).to.have.length.above(2);
        });
    });
    it('Should list jobs with sort, pagination and job type', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            {
                const res = yield jobs_1.getJobsListPaginationAndSort({
                    url: servers[1].url,
                    accessToken: servers[1].accessToken,
                    state: 'completed',
                    start: 1,
                    count: 2,
                    sort: 'createdAt'
                });
                expect(res.body.total).to.be.above(2);
                expect(res.body.data).to.have.lengthOf(2);
                let job = res.body.data[0];
                if (job.type === 'videos-views')
                    job = res.body.data[1];
                expect(job.state).to.equal('completed');
                expect(job.type.startsWith('activitypub-')).to.be.true;
                expect(miscs_1.dateIsValid(job.createdAt)).to.be.true;
                expect(miscs_1.dateIsValid(job.processedOn)).to.be.true;
                expect(miscs_1.dateIsValid(job.finishedOn)).to.be.true;
            }
            {
                const res = yield jobs_1.getJobsListPaginationAndSort({
                    url: servers[1].url,
                    accessToken: servers[1].accessToken,
                    state: 'completed',
                    start: 0,
                    count: 100,
                    sort: 'createdAt',
                    jobType: 'activitypub-http-broadcast'
                });
                expect(res.body.total).to.be.above(2);
                for (const j of res.body.data) {
                    expect(j.type).to.equal('activitypub-http-broadcast');
                }
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield index_1.cleanupTests(servers);
        });
    });
});
