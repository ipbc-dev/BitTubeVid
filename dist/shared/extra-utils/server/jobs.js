"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobsListPaginationAndSort = exports.waitJobs = exports.getJobsList = void 0;
const tslib_1 = require("tslib");
const request = require("supertest");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
const extra_utils_1 = require("../../../shared/extra-utils");
const miscs_1 = require("../miscs/miscs");
function buildJobsUrl(state) {
    let path = '/api/v1/jobs';
    if (state)
        path += '/' + state;
    return path;
}
function getJobsList(url, accessToken, state) {
    const path = buildJobsUrl(state);
    return request(url)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getJobsList = getJobsList;
function getJobsListPaginationAndSort(options) {
    const { url, accessToken, state, start, count, sort, jobType } = options;
    const path = buildJobsUrl(state);
    const query = {
        start,
        count,
        sort,
        jobType
    };
    return extra_utils_1.makeGetRequest({
        url,
        path,
        token: accessToken,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.OK_200,
        query
    });
}
exports.getJobsListPaginationAndSort = getJobsListPaginationAndSort;
function waitJobs(serversArg) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pendingJobWait = process.env.NODE_PENDING_JOB_WAIT ? parseInt(process.env.NODE_PENDING_JOB_WAIT, 10) : 2000;
        let servers;
        if (Array.isArray(serversArg) === false)
            servers = [serversArg];
        else
            servers = serversArg;
        const states = ['waiting', 'active', 'delayed'];
        let pendingRequests;
        function tasksBuilder() {
            const tasks = [];
            for (const server of servers) {
                for (const state of states) {
                    const p = getJobsListPaginationAndSort({
                        url: server.url,
                        accessToken: server.accessToken,
                        state: state,
                        start: 0,
                        count: 10,
                        sort: '-createdAt'
                    })
                        .then(res => res.body.data)
                        .then((jobs) => jobs.filter(j => j.type !== 'videos-views'))
                        .then(jobs => {
                        if (jobs.length !== 0) {
                            pendingRequests = true;
                        }
                    });
                    tasks.push(p);
                }
            }
            return tasks;
        }
        do {
            pendingRequests = false;
            yield Promise.all(tasksBuilder());
            if (pendingRequests === false) {
                yield miscs_1.wait(pendingJobWait);
                yield Promise.all(tasksBuilder());
            }
            if (pendingRequests) {
                yield miscs_1.wait(1000);
            }
        } while (pendingRequests);
    });
}
exports.waitJobs = waitJobs;
