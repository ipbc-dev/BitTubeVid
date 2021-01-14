"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLiveNotificationSocket = exports.getUserNotificationSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
function getUserNotificationSocket(serverUrl, accessToken) {
    return socket_io_client_1.io(serverUrl + '/user-notifications', {
        query: { accessToken }
    });
}
exports.getUserNotificationSocket = getUserNotificationSocket;
function getLiveNotificationSocket(serverUrl) {
    return socket_io_client_1.io(serverUrl + '/live-videos');
}
exports.getLiveNotificationSocket = getLiveNotificationSocket;
