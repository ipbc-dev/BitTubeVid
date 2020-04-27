"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIO = require("socket.io");
const middlewares_1 = require("../middlewares");
const logger_1 = require("../helpers/logger");
class PeerTubeSocket {
    constructor() {
        this.userNotificationSockets = {};
    }
    init(server) {
        const io = SocketIO(server);
        io.of('/user-notifications')
            .use(middlewares_1.authenticateSocket)
            .on('connection', socket => {
            const userId = socket.handshake.query.user.id;
            logger_1.logger.debug('User %d connected on the notification system.', userId);
            if (!this.userNotificationSockets[userId])
                this.userNotificationSockets[userId] = [];
            this.userNotificationSockets[userId].push(socket);
            socket.on('disconnect', () => {
                logger_1.logger.debug('User %d disconnected from SocketIO notifications.', userId);
                this.userNotificationSockets[userId] = this.userNotificationSockets[userId].filter(s => s !== socket);
            });
        });
    }
    sendNotification(userId, notification) {
        const sockets = this.userNotificationSockets[userId];
        if (!sockets)
            return;
        const notificationMessage = notification.toFormattedJSON();
        for (const socket of sockets) {
            socket.emit('new-notification', notificationMessage);
        }
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.PeerTubeSocket = PeerTubeSocket;
