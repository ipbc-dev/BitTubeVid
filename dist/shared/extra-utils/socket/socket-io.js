"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotificationSocket = void 0;
const io = require("socket.io-client");
function getUserNotificationSocket(serverUrl, accessToken) {
    return io(serverUrl + '/user-notifications', {
        query: { accessToken }
    });
}
exports.getUserNotificationSocket = getUserNotificationSocket;
