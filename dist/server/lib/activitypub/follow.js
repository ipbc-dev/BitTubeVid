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
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const job_queue_1 = require("../job-queue");
const logger_1 = require("../../helpers/logger");
const server_1 = require("../../models/server/server");
const application_1 = require("@server/models/application/application");
function autoFollowBackIfNeeded(actorFollow) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_BACK.ENABLED)
            return;
        const follower = actorFollow.ActorFollower;
        if (follower.type === 'Application' && follower.preferredUsername === constants_1.SERVER_ACTOR_NAME) {
            logger_1.logger.info('Auto follow back %s.', follower.url);
            const me = yield application_1.getServerActor();
            const server = yield server_1.ServerModel.load(follower.serverId);
            const host = server.host;
            const payload = {
                host,
                name: constants_1.SERVER_ACTOR_NAME,
                followerActorId: me.id,
                isAutoFollow: true
            };
            job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-follow', payload });
        }
    });
}
exports.autoFollowBackIfNeeded = autoFollowBackIfNeeded;
