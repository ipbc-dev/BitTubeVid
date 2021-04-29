"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserScopedTokens = exports.verifyEmail = exports.generateUserAccessToken = exports.askSendVerifyEmail = exports.updateMyAvatar = exports.renewUserScopedTokens = exports.resetPassword = exports.askResetPassword = exports.unblockUser = exports.blockUser = exports.getUserInformation = exports.updateMyUser = exports.updateUser = exports.removeUser = exports.getUsersListPaginationAndSort = exports.getUsersList = exports.getMyUserVideoQuotaUsed = exports.registerUserWithChannel = exports.deleteMe = exports.getMyUserVideoRating = exports.getMyUserInformation = exports.registerUser = exports.createUser = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const request = require("supertest");
const user_role_1 = require("../../models/users/user-role");
const requests_1 = require("../requests/requests");
const login_1 = require("./login");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function createUser(parameters) {
    const { url, accessToken, username, adminFlags, password = 'password', videoQuota = 1000000, videoQuotaDaily = -1, role = user_role_1.UserRole.USER, specialStatus = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
    const path = '/api/v1/users';
    const body = {
        username,
        password,
        role,
        adminFlags,
        email: username + '@example.com',
        videoQuota,
        videoQuotaDaily
    };
    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .send(body)
        .expect(specialStatus);
}
exports.createUser = createUser;
function generateUserAccessToken(server, username) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const password = 'my super password';
        yield createUser({ url: server.url, accessToken: server.accessToken, username: username, password: password });
        return login_1.userLogin(server, { username, password });
    });
}
exports.generateUserAccessToken = generateUserAccessToken;
function registerUser(url, username, password, specialStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/register';
    const body = {
        username,
        password,
        email: username + '@example.com'
    };
    return request(url)
        .post(path)
        .set('Accept', 'application/json')
        .send(body)
        .expect(specialStatus);
}
exports.registerUser = registerUser;
function registerUserWithChannel(options) {
    const path = '/api/v1/users/register';
    const body = {
        username: options.user.username,
        password: options.user.password,
        email: options.user.username + '@example.com',
        channel: options.channel
    };
    if (options.user.displayName) {
        Object.assign(body, { displayName: options.user.displayName });
    }
    return requests_1.makePostBodyRequest({
        url: options.url,
        path,
        fields: body,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.registerUserWithChannel = registerUserWithChannel;
function getMyUserInformation(url, accessToken, specialStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/me';
    return request(url)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(specialStatus)
        .expect('Content-Type', /json/);
}
exports.getMyUserInformation = getMyUserInformation;
function getUserScopedTokens(url, token, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/scoped-tokens';
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.getUserScopedTokens = getUserScopedTokens;
function renewUserScopedTokens(url, token, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/scoped-tokens';
    return requests_1.makePostBodyRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.renewUserScopedTokens = renewUserScopedTokens;
function deleteMe(url, accessToken, specialStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/me';
    return request(url)
        .delete(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(specialStatus);
}
exports.deleteMe = deleteMe;
function getMyUserVideoQuotaUsed(url, accessToken, specialStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/me/video-quota-used';
    return request(url)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(specialStatus)
        .expect('Content-Type', /json/);
}
exports.getMyUserVideoQuotaUsed = getMyUserVideoQuotaUsed;
function getUserInformation(url, accessToken, userId, withStats = false) {
    const path = '/api/v1/users/' + userId;
    return request(url)
        .get(path)
        .query({ withStats })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getUserInformation = getUserInformation;
function getMyUserVideoRating(url, accessToken, videoId, specialStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/me/videos/' + videoId + '/rating';
    return request(url)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(specialStatus)
        .expect('Content-Type', /json/);
}
exports.getMyUserVideoRating = getMyUserVideoRating;
function getUsersList(url, accessToken) {
    const path = '/api/v1/users';
    return request(url)
        .get(path)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getUsersList = getUsersList;
function getUsersListPaginationAndSort(url, accessToken, start, count, sort, search, blocked) {
    const path = '/api/v1/users';
    const query = {
        start,
        count,
        sort,
        search,
        blocked
    };
    return request(url)
        .get(path)
        .query(query)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(http_error_codes_1.HttpStatusCode.OK_200)
        .expect('Content-Type', /json/);
}
exports.getUsersListPaginationAndSort = getUsersListPaginationAndSort;
function removeUser(url, userId, accessToken, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users';
    return request(url)
        .delete(path + '/' + userId)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(expectedStatus);
}
exports.removeUser = removeUser;
function blockUser(url, userId, accessToken, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204, reason) {
    const path = '/api/v1/users';
    let body;
    if (reason)
        body = { reason };
    return request(url)
        .post(path + '/' + userId + '/block')
        .send(body)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(expectedStatus);
}
exports.blockUser = blockUser;
function unblockUser(url, userId, accessToken, expectedStatus = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users';
    return request(url)
        .post(path + '/' + userId + '/unblock')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + accessToken)
        .expect(expectedStatus);
}
exports.unblockUser = unblockUser;
function updateMyUser(options) {
    const path = '/api/v1/users/me';
    const toSend = lodash_1.omit(options, 'url', 'accessToken');
    return requests_1.makePutBodyRequest({
        url: options.url,
        path,
        token: options.accessToken,
        fields: toSend,
        statusCodeExpected: options.statusCodeExpected || http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.updateMyUser = updateMyUser;
function updateMyAvatar(options) {
    const path = '/api/v1/users/me/avatar/pick';
    return requests_1.updateAvatarRequest(Object.assign(options, { path }));
}
exports.updateMyAvatar = updateMyAvatar;
function updateUser(options) {
    const path = '/api/v1/users/' + options.userId;
    const toSend = {};
    if (options.password !== undefined && options.password !== null)
        toSend['password'] = options.password;
    if (options.email !== undefined && options.email !== null)
        toSend['email'] = options.email;
    if (options.emailVerified !== undefined && options.emailVerified !== null)
        toSend['emailVerified'] = options.emailVerified;
    if (options.videoQuota !== undefined && options.videoQuota !== null)
        toSend['videoQuota'] = options.videoQuota;
    if (options.videoQuotaDaily !== undefined && options.videoQuotaDaily !== null)
        toSend['videoQuotaDaily'] = options.videoQuotaDaily;
    if (options.role !== undefined && options.role !== null)
        toSend['role'] = options.role;
    if (options.adminFlags !== undefined && options.adminFlags !== null)
        toSend['adminFlags'] = options.adminFlags;
    if (options.pluginAuth !== undefined)
        toSend['pluginAuth'] = options.pluginAuth;
    return requests_1.makePutBodyRequest({
        url: options.url,
        path,
        token: options.accessToken,
        fields: toSend,
        statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.updateUser = updateUser;
function askResetPassword(url, email) {
    const path = '/api/v1/users/ask-reset-password';
    return requests_1.makePostBodyRequest({
        url,
        path,
        fields: { email },
        statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.askResetPassword = askResetPassword;
function resetPassword(url, userId, verificationString, password, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/' + userId + '/reset-password';
    return requests_1.makePostBodyRequest({
        url,
        path,
        fields: { password, verificationString },
        statusCodeExpected
    });
}
exports.resetPassword = resetPassword;
function askSendVerifyEmail(url, email) {
    const path = '/api/v1/users/ask-send-verify-email';
    return requests_1.makePostBodyRequest({
        url,
        path,
        fields: { email },
        statusCodeExpected: http_error_codes_1.HttpStatusCode.NO_CONTENT_204
    });
}
exports.askSendVerifyEmail = askSendVerifyEmail;
function verifyEmail(url, userId, verificationString, isPendingEmail = false, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/' + userId + '/verify-email';
    return requests_1.makePostBodyRequest({
        url,
        path,
        fields: {
            verificationString,
            isPendingEmail
        },
        statusCodeExpected
    });
}
exports.verifyEmail = verifyEmail;
