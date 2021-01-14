"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUsingExternalToken = exports.setAccessTokensToServers = exports.getAccessToken = exports.userLogin = exports.refreshToken = exports.serverLogin = exports.logout = exports.login = void 0;
const tslib_1 = require("tslib");
const request = require("supertest");
const clients_1 = require("../server/clients");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function login(url, client, user, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/token';
    const body = {
        client_id: client.id,
        client_secret: client.secret,
        username: user.username,
        password: user.password,
        response_type: 'code',
        grant_type: 'password',
        scope: 'upload'
    };
    return request(url)
        .post(path)
        .type('form')
        .send(body)
        .expect(expectedStatus);
}
exports.login = login;
function logout(url, token, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/revoke-token';
    return request(url)
        .post(path)
        .set('Authorization', 'Bearer ' + token)
        .type('form')
        .expect(expectedStatus);
}
exports.logout = logout;
function serverLogin(server) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield login(server.url, server.client, server.user, http_error_codes_1.HttpStatusCode.OK_200);
        return res.body.access_token;
    });
}
exports.serverLogin = serverLogin;
function refreshToken(server, refreshToken, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/token';
    const body = {
        client_id: server.client.id,
        client_secret: server.client.secret,
        refresh_token: refreshToken,
        response_type: 'code',
        grant_type: 'refresh_token'
    };
    return request(server.url)
        .post(path)
        .type('form')
        .send(body)
        .expect(expectedStatus);
}
exports.refreshToken = refreshToken;
function userLogin(server, user, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const res = yield login(server.url, server.client, user, expectedStatus);
        return res.body.access_token;
    });
}
exports.userLogin = userLogin;
function getAccessToken(url, username, password) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const resClient = yield clients_1.getClient(url);
        const client = {
            id: resClient.body.client_id,
            secret: resClient.body.client_secret
        };
        const user = { username, password };
        try {
            const res = yield login(url, client, user);
            return res.body.access_token;
        }
        catch (err) {
            throw new Error('Cannot authenticate. Please check your username/password.');
        }
    });
}
exports.getAccessToken = getAccessToken;
function setAccessTokensToServers(servers) {
    const tasks = [];
    for (const server of servers) {
        const p = serverLogin(server).then(t => { server.accessToken = t; });
        tasks.push(p);
    }
    return Promise.all(tasks);
}
exports.setAccessTokensToServers = setAccessTokensToServers;
function loginUsingExternalToken(server, username, externalAuthToken, expectedStatus = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/token';
    const body = {
        client_id: server.client.id,
        client_secret: server.client.secret,
        username: username,
        response_type: 'code',
        grant_type: 'password',
        scope: 'upload',
        externalAuthToken
    };
    return request(server.url)
        .post(path)
        .type('form')
        .send(body)
        .expect(expectedStatus);
}
exports.loginUsingExternalToken = loginUsingExternalToken;
