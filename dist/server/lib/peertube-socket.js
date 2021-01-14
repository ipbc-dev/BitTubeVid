"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerTubeSocket = void 0;
const SocketIO = require("socket.io");
const logger_1 = require("../helpers/logger");
const middlewares_1 = require("../middlewares");
const misc_1 = require("@server/helpers/custom-validators/misc");
class PeerTubeSocket {
    constructor() {
        this.userNotificationSockets = {};
    }
    init(server) {
        const io = new SocketIO.Server(server);
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
        this.liveVideosNamespace = io.of('/live-videos')
            .on('connection', socket => {
            socket.on('subscribe', ({ videoId }) => {
                if (!misc_1.isIdValid(videoId))
                    return;
                socket.join(videoId);
            });
            socket.on('unsubscribe', ({ videoId }) => {
                if (!misc_1.isIdValid(videoId))
                    return;
                socket.leave(videoId);
            });
        });
    }
    sendNotification(userId, notification) {
        const sockets = this.userNotificationSockets[userId];
        if (!sockets)
            return;
        logger_1.logger.debug('Sending user notification to user %d.', userId);
        const notificationMessage = notification.toFormattedJSON();
        for (const socket of sockets) {
            socket.emit('new-notification', notificationMessage);
        }
    }
    sendVideoLiveNewState(video) {
        const data = { state: video.state };
        const type = 'state-change';
        logger_1.logger.debug('Sending video live new state notification of %s.', video.url, { state: video.state });
        this.liveVideosNamespace
            .in(video.id)
            .emit(type, data);
    }
    sendVideoViewsUpdate(video) {
        const data = { views: video.views };
        const type = 'views-change';
        logger_1.logger.debug('Sending video live views update notification of %s.', video.url, { views: video.views });
        this.liveVideosNamespace
            .in(video.id)
            .emit(type, data);
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.PeerTubeSocket = PeerTubeSocket;
