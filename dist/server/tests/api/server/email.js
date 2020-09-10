"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const email_1 = require("../../../../shared/extra-utils/miscs/email");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const expect = chai.expect;
describe('Test emails', function () {
    let server;
    let userId;
    let userId2;
    let userAccessToken;
    let videoUUID;
    let videoId;
    let videoUserUUID;
    let verificationString;
    let verificationString2;
    const emails = [];
    const user = {
        username: 'user_1',
        password: 'super_password'
    };
    let emailPort;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(50000);
            emailPort = yield email_1.MockSmtpServer.Instance.collectEmails(emails);
            const overrideConfig = {
                smtp: {
                    hostname: 'localhost',
                    port: emailPort
                }
            };
            server = yield extra_utils_1.flushAndRunServer(1, overrideConfig);
            yield extra_utils_1.setAccessTokensToServers([server]);
            {
                const res = yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
                userId = res.body.user.id;
                userAccessToken = yield extra_utils_1.userLogin(server, user);
            }
            {
                const attributes = {
                    name: 'my super user video'
                };
                const res = yield extra_utils_1.uploadVideo(server.url, userAccessToken, attributes);
                videoUserUUID = res.body.video.uuid;
            }
            {
                const attributes = {
                    name: 'my super name'
                };
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, attributes);
                videoUUID = res.body.video.uuid;
                videoId = res.body.video.id;
            }
        });
    });
    describe('When resetting user password', function () {
        it('Should ask to reset the password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.askResetPassword(server.url, 'user_1@example.com');
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(1);
                const email = emails[0];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('user_1@example.com');
                expect(email['subject']).contains('password');
                const verificationStringMatches = /verificationString=([a-z0-9]+)/.exec(email['text']);
                expect(verificationStringMatches).not.to.be.null;
                verificationString = verificationStringMatches[1];
                expect(verificationString).to.have.length.above(2);
                const userIdMatches = /userId=([0-9]+)/.exec(email['text']);
                expect(userIdMatches).not.to.be.null;
                userId = parseInt(userIdMatches[1], 10);
                expect(verificationString).to.not.be.undefined;
            });
        });
        it('Should not reset the password with an invalid verification string', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.resetPassword(server.url, userId, verificationString + 'b', 'super_password2', 403);
            });
        });
        it('Should reset the password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.resetPassword(server.url, userId, verificationString, 'super_password2');
            });
        });
        it('Should not reset the password with the same verification string', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.resetPassword(server.url, userId, verificationString, 'super_password3', 403);
            });
        });
        it('Should login with this new password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                user.password = 'super_password2';
                yield extra_utils_1.userLogin(server, user);
            });
        });
    });
    describe('When creating a user without password', function () {
        it('Should send a create password email', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.createUser({
                    url: server.url,
                    accessToken: server.accessToken,
                    username: 'create_password',
                    password: ''
                });
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(2);
                const email = emails[1];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('create_password@example.com');
                expect(email['subject']).contains('account');
                expect(email['subject']).contains('password');
                const verificationStringMatches = /verificationString=([a-z0-9]+)/.exec(email['text']);
                expect(verificationStringMatches).not.to.be.null;
                verificationString2 = verificationStringMatches[1];
                expect(verificationString2).to.have.length.above(2);
                const userIdMatches = /userId=([0-9]+)/.exec(email['text']);
                expect(userIdMatches).not.to.be.null;
                userId2 = parseInt(userIdMatches[1], 10);
            });
        });
        it('Should not reset the password with an invalid verification string', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.resetPassword(server.url, userId2, verificationString2 + 'c', 'newly_created_password', 403);
            });
        });
        it('Should reset the password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.resetPassword(server.url, userId2, verificationString2, 'newly_created_password');
            });
        });
        it('Should login with this new password', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.userLogin(server, {
                    username: 'create_password',
                    password: 'newly_created_password'
                });
            });
        });
    });
    describe('When creating an abuse', function () {
        it('Should send the notification email', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const reason = 'my super bad reason';
                yield extra_utils_1.reportAbuse({ url: server.url, token: server.accessToken, videoId, reason });
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(3);
                const email = emails[2];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('admin' + server.internalServerNumber + '@example.com');
                expect(email['subject']).contains('abuse');
                expect(email['text']).contains(videoUUID);
            });
        });
    });
    describe('When blocking/unblocking user', function () {
        it('Should send the notification email when blocking a user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const reason = 'my super bad reason';
                yield extra_utils_1.blockUser(server.url, userId, server.accessToken, 204, reason);
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(4);
                const email = emails[3];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('user_1@example.com');
                expect(email['subject']).contains(' blocked');
                expect(email['text']).contains(' blocked');
                expect(email['text']).contains(reason);
            });
        });
        it('Should send the notification email when unblocking a user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.unblockUser(server.url, userId, server.accessToken, 204);
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(5);
                const email = emails[4];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('user_1@example.com');
                expect(email['subject']).contains(' unblocked');
                expect(email['text']).contains(' unblocked');
            });
        });
    });
    describe('When blacklisting a video', function () {
        it('Should send the notification email', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                const reason = 'my super reason';
                yield extra_utils_1.addVideoToBlacklist(server.url, server.accessToken, videoUserUUID, reason);
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(6);
                const email = emails[5];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('user_1@example.com');
                expect(email['subject']).contains(' blacklisted');
                expect(email['text']).contains('my super user video');
                expect(email['text']).contains('my super reason');
            });
        });
        it('Should send the notification email', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.removeVideoFromBlacklist(server.url, server.accessToken, videoUserUUID);
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(7);
                const email = emails[6];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('user_1@example.com');
                expect(email['subject']).contains(' unblacklisted');
                expect(email['text']).contains('my super user video');
            });
        });
    });
    describe('When verifying a user email', function () {
        it('Should ask to send the verification email', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                yield extra_utils_1.askSendVerifyEmail(server.url, 'user_1@example.com');
                yield jobs_1.waitJobs(server);
                expect(emails).to.have.lengthOf(8);
                const email = emails[7];
                expect(email['from'][0]['name']).equal('localhost:' + server.port);
                expect(email['from'][0]['address']).equal('test-admin@localhost');
                expect(email['to'][0]['address']).equal('user_1@example.com');
                expect(email['subject']).contains('Verify');
                const verificationStringMatches = /verificationString=([a-z0-9]+)/.exec(email['text']);
                expect(verificationStringMatches).not.to.be.null;
                verificationString = verificationStringMatches[1];
                expect(verificationString).to.not.be.undefined;
                expect(verificationString).to.have.length.above(2);
                const userIdMatches = /userId=([0-9]+)/.exec(email['text']);
                expect(userIdMatches).not.to.be.null;
                userId = parseInt(userIdMatches[1], 10);
            });
        });
        it('Should not verify the email with an invalid verification string', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.verifyEmail(server.url, userId, verificationString + 'b', false, 403);
            });
        });
        it('Should verify the email', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.verifyEmail(server.url, userId, verificationString);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            email_1.MockSmtpServer.Instance.kill();
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
