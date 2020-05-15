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
const url_1 = require("../url");
const utils_1 = require("./utils");
const send_follow_1 = require("./send-follow");
const logger_1 = require("../../../helpers/logger");
function sendReject(follower, following) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!follower.serverId) {
            logger_1.logger.warn('Do not sending reject to local follower.');
            return;
        }
        logger_1.logger.info('Creating job to reject follower %s.', follower.url);
        const followUrl = url_1.getActorFollowActivityPubUrl(follower, following);
        const followData = send_follow_1.buildFollowActivity(followUrl, follower, following);
        const url = url_1.getActorFollowRejectActivityPubUrl(follower, following);
        const data = buildRejectActivity(url, following, followData);
        return utils_1.unicastTo(data, following, follower.inboxUrl);
    });
}
exports.sendReject = sendReject;
function buildRejectActivity(url, byActor, followActivityData) {
    return {
        type: 'Reject',
        id: url,
        actor: byActor.url,
        object: followActivityData
    };
}
