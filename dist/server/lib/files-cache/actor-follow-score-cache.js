"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActorFollowScoreCache = void 0;
const constants_1 = require("../../initializers/constants");
const logger_1 = require("../../helpers/logger");
class ActorFollowScoreCache {
    constructor() {
        this.pendingFollowsScore = {};
        this.pendingBadServer = new Set();
        this.pendingGoodServer = new Set();
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    updateActorFollowsScore(goodInboxes, badInboxes) {
        if (goodInboxes.length === 0 && badInboxes.length === 0)
            return;
        logger_1.logger.info('Updating %d good actor follows and %d bad actor follows scores in cache.', goodInboxes.length, badInboxes.length);
        for (const goodInbox of goodInboxes) {
            if (this.pendingFollowsScore[goodInbox] === undefined)
                this.pendingFollowsScore[goodInbox] = 0;
            this.pendingFollowsScore[goodInbox] += constants_1.ACTOR_FOLLOW_SCORE.BONUS;
        }
        for (const badInbox of badInboxes) {
            if (this.pendingFollowsScore[badInbox] === undefined)
                this.pendingFollowsScore[badInbox] = 0;
            this.pendingFollowsScore[badInbox] += constants_1.ACTOR_FOLLOW_SCORE.PENALTY;
        }
    }
    addBadServerId(serverId) {
        this.pendingBadServer.add(serverId);
    }
    getBadFollowingServerIds() {
        return Array.from(this.pendingBadServer);
    }
    clearBadFollowingServerIds() {
        this.pendingBadServer = new Set();
    }
    addGoodServerId(serverId) {
        this.pendingGoodServer.add(serverId);
    }
    getGoodFollowingServerIds() {
        return Array.from(this.pendingGoodServer);
    }
    clearGoodFollowingServerIds() {
        this.pendingGoodServer = new Set();
    }
    getPendingFollowsScore() {
        return this.pendingFollowsScore;
    }
    clearPendingFollowsScore() {
        this.pendingFollowsScore = {};
    }
}
exports.ActorFollowScoreCache = ActorFollowScoreCache;
