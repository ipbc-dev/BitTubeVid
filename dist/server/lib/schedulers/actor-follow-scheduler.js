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
const core_utils_1 = require("../../helpers/core-utils");
const logger_1 = require("../../helpers/logger");
const actor_follow_1 = require("../../models/activitypub/actor-follow");
const abstract_scheduler_1 = require("./abstract-scheduler");
const constants_1 = require("../../initializers/constants");
const files_cache_1 = require("../files-cache");
class ActorFollowScheduler extends abstract_scheduler_1.AbstractScheduler {
    constructor() {
        super();
        this.schedulerIntervalMs = constants_1.SCHEDULER_INTERVALS_MS.actorFollowScores;
    }
    internalExecute() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.processPendingScores();
            yield this.removeBadActorFollows();
        });
    }
    processPendingScores() {
        return __awaiter(this, void 0, void 0, function* () {
            const pendingScores = files_cache_1.ActorFollowScoreCache.Instance.getPendingFollowsScore();
            const badServerIds = files_cache_1.ActorFollowScoreCache.Instance.getBadFollowingServerIds();
            const goodServerIds = files_cache_1.ActorFollowScoreCache.Instance.getGoodFollowingServerIds();
            files_cache_1.ActorFollowScoreCache.Instance.clearPendingFollowsScore();
            files_cache_1.ActorFollowScoreCache.Instance.clearBadFollowingServerIds();
            files_cache_1.ActorFollowScoreCache.Instance.clearGoodFollowingServerIds();
            for (const inbox of Object.keys(pendingScores)) {
                yield actor_follow_1.ActorFollowModel.updateScore(inbox, pendingScores[inbox]);
            }
            yield actor_follow_1.ActorFollowModel.updateScoreByFollowingServers(badServerIds, constants_1.ACTOR_FOLLOW_SCORE.PENALTY);
            yield actor_follow_1.ActorFollowModel.updateScoreByFollowingServers(goodServerIds, constants_1.ACTOR_FOLLOW_SCORE.BONUS);
        });
    }
    removeBadActorFollows() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!core_utils_1.isTestInstance())
                logger_1.logger.info('Removing bad actor follows (scheduler).');
            try {
                yield actor_follow_1.ActorFollowModel.removeBadActorFollows();
            }
            catch (err) {
                logger_1.logger.error('Error in bad actor follows scheduler.', { err });
            }
        });
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.ActorFollowScheduler = ActorFollowScheduler;
