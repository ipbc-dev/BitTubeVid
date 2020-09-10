"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAbuseMessage = exports.deleteAbuseMessage = exports.listAbuseMessages = exports.getUserAbusesList = exports.deleteAbuse = exports.updateAbuse = exports.getAdminAbusesList = exports.reportAbuse = void 0;
const requests_1 = require("../requests/requests");
function reportAbuse(options) {
    const path = '/api/v1/abuses';
    const video = options.videoId ? {
        id: options.videoId,
        startAt: options.startAt,
        endAt: options.endAt
    } : undefined;
    const comment = options.commentId ? {
        id: options.commentId
    } : undefined;
    const account = options.accountId ? {
        id: options.accountId
    } : undefined;
    const body = {
        account,
        video,
        comment,
        reason: options.reason,
        predefinedReasons: options.predefinedReasons
    };
    return requests_1.makePostBodyRequest({
        url: options.url,
        path,
        token: options.token,
        fields: body,
        statusCodeExpected: options.statusCodeExpected || 200
    });
}
exports.reportAbuse = reportAbuse;
function getAdminAbusesList(options) {
    const { url, token, start, count, sort, id, predefinedReason, search, filter, state, videoIs, searchReporter, searchReportee, searchVideo, searchVideoChannel } = options;
    const path = '/api/v1/abuses';
    const query = {
        id,
        predefinedReason,
        search,
        state,
        filter,
        videoIs,
        start,
        count,
        sort: sort || 'createdAt',
        searchReporter,
        searchReportee,
        searchVideo,
        searchVideoChannel
    };
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query,
        statusCodeExpected: 200
    });
}
exports.getAdminAbusesList = getAdminAbusesList;
function getUserAbusesList(options) {
    const { url, token, start, count, sort, id, search, state } = options;
    const path = '/api/v1/users/me/abuses';
    const query = {
        id,
        search,
        state,
        start,
        count,
        sort: sort || 'createdAt'
    };
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        query,
        statusCodeExpected: 200
    });
}
exports.getUserAbusesList = getUserAbusesList;
function updateAbuse(url, token, abuseId, body, statusCodeExpected = 204) {
    const path = '/api/v1/abuses/' + abuseId;
    return requests_1.makePutBodyRequest({
        url,
        token,
        path,
        fields: body,
        statusCodeExpected
    });
}
exports.updateAbuse = updateAbuse;
function deleteAbuse(url, token, abuseId, statusCodeExpected = 204) {
    const path = '/api/v1/abuses/' + abuseId;
    return requests_1.makeDeleteRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.deleteAbuse = deleteAbuse;
function listAbuseMessages(url, token, abuseId, statusCodeExpected = 200) {
    const path = '/api/v1/abuses/' + abuseId + '/messages';
    return requests_1.makeGetRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.listAbuseMessages = listAbuseMessages;
function deleteAbuseMessage(url, token, abuseId, messageId, statusCodeExpected = 204) {
    const path = '/api/v1/abuses/' + abuseId + '/messages/' + messageId;
    return requests_1.makeDeleteRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.deleteAbuseMessage = deleteAbuseMessage;
function addAbuseMessage(url, token, abuseId, message, statusCodeExpected = 200) {
    const path = '/api/v1/abuses/' + abuseId + '/messages';
    return requests_1.makePostBodyRequest({
        url,
        token,
        path,
        fields: { message },
        statusCodeExpected
    });
}
exports.addAbuseMessage = addAbuseMessage;
