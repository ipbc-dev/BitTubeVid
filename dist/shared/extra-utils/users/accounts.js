"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountRatings = exports.checkActorFilesWereRemoved = exports.getAccountsList = exports.expectAccountFollows = exports.getAccount = void 0;
const tslib_1 = require("tslib");
const request = require("supertest");
const chai_1 = require("chai");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const miscs_1 = require("../miscs/miscs");
const requests_1 = require("../requests/requests");
function getAccountsList(url, sort = '-createdAt', statusCodeExpected = 200) {
    const path = '/api/v1/accounts';
    return requests_1.makeGetRequest({
        url,
        query: { sort },
        path,
        statusCodeExpected
    });
}
exports.getAccountsList = getAccountsList;
function getAccount(url, accountName, statusCodeExpected = 200) {
    const path = '/api/v1/accounts/' + accountName;
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected
    });
}
exports.getAccount = getAccount;
function expectAccountFollows(url, nameWithDomain, followersCount, followingCount) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield getAccountsList(url);
        const account = res.body.data.find((a) => a.name + '@' + a.host === nameWithDomain);
        const message = `${nameWithDomain} on ${url}`;
        chai_1.expect(account.followersCount).to.equal(followersCount, message);
        chai_1.expect(account.followingCount).to.equal(followingCount, message);
    });
}
exports.expectAccountFollows = expectAccountFollows;
function checkActorFilesWereRemoved(filename, serverNumber) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const testDirectory = 'test' + serverNumber;
        for (const directory of ['avatars']) {
            const directoryPath = path_1.join(miscs_1.root(), testDirectory, directory);
            const directoryExists = fs_extra_1.existsSync(directoryPath);
            chai_1.expect(directoryExists).to.be.true;
            const files = yield fs_extra_1.readdir(directoryPath);
            for (const file of files) {
                chai_1.expect(file).to.not.contain(filename);
            }
        }
    });
}
exports.checkActorFilesWereRemoved = checkActorFilesWereRemoved;
function getAccountRatings(url, accountName, accessToken, rating, statusCodeExpected = 200) {
    const path = '/api/v1/accounts/' + accountName + '/ratings';
    const query = rating ? { rating } : {};
    return request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(statusCodeExpected)
        .expect('Content-Type', /json/);
}
exports.getAccountRatings = getAccountRatings;
