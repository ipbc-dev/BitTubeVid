"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUserSubscription = exports.listUserSubscriptionVideos = exports.getUserSubscription = exports.listUserSubscriptions = exports.addUserSubscription = exports.areSubscriptionsExist = void 0;
const requests_1 = require("../requests/requests");
const http_error_codes_1 = require("../../../shared/core-utils/miscs/http-error-codes");
function addUserSubscription(url, token, targetUri, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/me/subscriptions';
    return requests_1.makePostBodyRequest({
        url,
        path,
        token,
        statusCodeExpected,
        fields: { uri: targetUri }
    });
}
exports.addUserSubscription = addUserSubscription;
function listUserSubscriptions(parameters) {
    const { url, token, sort = '-createdAt', search, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200 } = parameters;
    const path = '/api/v1/users/me/subscriptions';
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        statusCodeExpected,
        query: {
            sort,
            search
        }
    });
}
exports.listUserSubscriptions = listUserSubscriptions;
function listUserSubscriptionVideos(url, token, sort = '-createdAt', statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/me/subscriptions/videos';
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        statusCodeExpected,
        query: { sort }
    });
}
exports.listUserSubscriptionVideos = listUserSubscriptionVideos;
function getUserSubscription(url, token, uri, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/me/subscriptions/' + uri;
    return requests_1.makeGetRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.getUserSubscription = getUserSubscription;
function removeUserSubscription(url, token, uri, statusCodeExpected = http_error_codes_1.HttpStatusCode.NO_CONTENT_204) {
    const path = '/api/v1/users/me/subscriptions/' + uri;
    return requests_1.makeDeleteRequest({
        url,
        path,
        token,
        statusCodeExpected
    });
}
exports.removeUserSubscription = removeUserSubscription;
function areSubscriptionsExist(url, token, uris, statusCodeExpected = http_error_codes_1.HttpStatusCode.OK_200) {
    const path = '/api/v1/users/me/subscriptions/exist';
    return requests_1.makeGetRequest({
        url,
        path,
        query: { 'uris[]': uris },
        token,
        statusCodeExpected
    });
}
exports.areSubscriptionsExist = areSubscriptionsExist;
