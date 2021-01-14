"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const login_1 = require("../../../../shared/extra-utils/users/login");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test users account verification', function () {
    let server;
    let userId;
    let userAccessToken;
    let verificationString;
    let expectedEmailsLength = 0;
    const user1 = {
        username: 'user_1',
        password: 'super password'
    };
    const user2 = {
        username: 'user_2',
        password: 'super password'
    };
    const emails = [];
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const port = yield email_1.MockSmtpServer.Instance.collectEmails(emails);
            const overrideConfig = {
                smtp: {
                    hostname: 'localhost',
                    port
                }
            };
            server = yield extra_utils_1.flushAndRunServer(1, overrideConfig);
            yield login_1.setAccessTokensToServers([server]);
        });
    });
    it('Should register user and send verification email if verification required', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                signup: {
                    enabled: true,
                    requiresEmailVerification: true,
                    limit: 10
                }
            });
            yield extra_utils_1.registerUser(server.url, user1.username, user1.password);
            yield jobs_1.waitJobs(server);
            expectedEmailsLength++;
            expect(emails).to.have.lengthOf(expectedEmailsLength);
            const email = emails[expectedEmailsLength - 1];
            const verificationStringMatches = /verificationString=([a-z0-9]+)/.exec(email['text']);
            expect(verificationStringMatches).not.to.be.null;
            verificationString = verificationStringMatches[1];
            expect(verificationString).to.have.length.above(2);
            const userIdMatches = /userId=([0-9]+)/.exec(email['text']);
            expect(userIdMatches).not.to.be.null;
            userId = parseInt(userIdMatches[1], 10);
            const resUserInfo = yield extra_utils_1.getUserInformation(server.url, server.accessToken, userId);
            expect(resUserInfo.body.emailVerified).to.be.false;
        });
    });
    it('Should not allow login for user with unverified email', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const resLogin = yield extra_utils_1.login(server.url, server.client, user1, 400);
            expect(resLogin.body.error).to.contain('User email is not verified.');
        });
    });
    it('Should verify the user via email and allow login', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.verifyEmail(server.url, userId, verificationString);
            const res = yield extra_utils_1.login(server.url, server.client, user1);
            userAccessToken = res.body.access_token;
            const resUserVerified = yield extra_utils_1.getUserInformation(server.url, server.accessToken, userId);
            expect(resUserVerified.body.emailVerified).to.be.true;
        });
    });
    it('Should be able to change the user email', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            let updateVerificationString;
            {
                yield extra_utils_1.updateMyUser({
                    url: server.url,
                    accessToken: userAccessToken,
                    email: 'updated@example.com',
                    currentPassword: user1.password
                });
                yield jobs_1.waitJobs(server);
                expectedEmailsLength++;
                expect(emails).to.have.lengthOf(expectedEmailsLength);
                const email = emails[expectedEmailsLength - 1];
                const verificationStringMatches = /verificationString=([a-z0-9]+)/.exec(email['text']);
                updateVerificationString = verificationStringMatches[1];
            }
            {
                const res = yield extra_utils_1.getMyUserInformation(server.url, userAccessToken);
                const me = res.body;
                expect(me.email).to.equal('user_1@example.com');
                expect(me.pendingEmail).to.equal('updated@example.com');
            }
            {
                yield extra_utils_1.verifyEmail(server.url, userId, updateVerificationString, true);
                const res = yield extra_utils_1.getMyUserInformation(server.url, userAccessToken);
                const me = res.body;
                expect(me.email).to.equal('updated@example.com');
                expect(me.pendingEmail).to.be.null;
            }
        });
    });
    it('Should register user not requiring email verification if setting not enabled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(5000);
            yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                signup: {
                    enabled: true,
                    requiresEmailVerification: false,
                    limit: 10
                }
            });
            yield extra_utils_1.registerUser(server.url, user2.username, user2.password);
            yield jobs_1.waitJobs(server);
            expect(emails).to.have.lengthOf(expectedEmailsLength);
            const accessToken = yield extra_utils_1.userLogin(server, user2);
            const resMyUserInfo = yield extra_utils_1.getMyUserInformation(server.url, accessToken);
            expect(resMyUserInfo.body.emailVerified).to.be.null;
        });
    });
    it('Should allow login for user with unverified email when setting later enabled', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                signup: {
                    enabled: true,
                    requiresEmailVerification: true,
                    limit: 10
                }
            });
            yield extra_utils_1.userLogin(server, user2);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
