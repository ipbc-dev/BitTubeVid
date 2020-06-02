"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
const clients_1 = require("../server/clients");
function login(url, client, user, expectedStatus = 200) {
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
function logout(url, token, expectedStatus = 200) {
    const path = '/api/v1/users/revoke-token';
    return request(url)
        .post(path)
        .set('Authorization', 'Bearer ' + token)
        .type('form')
        .expect(expectedStatus);
}
exports.logout = logout;
function serverLogin(server) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield login(server.url, server.client, server.user, 200);
        return res.body.access_token;
    });
}
exports.serverLogin = serverLogin;
function refreshToken(server, refreshToken, expectedStatus = 200) {
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
function userLogin(server, user, expectedStatus = 200) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield login(server.url, server.client, user, expectedStatus);
        return res.body.access_token;
    });
}
exports.userLogin = userLogin;
function getAccessToken(url, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
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
function loginUsingExternalToken(server, username, externalAuthToken, expectedStatus = 200) {
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
