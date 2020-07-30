"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRejectActivity = void 0;
const tslib_1 = require("tslib");
const database_1 = require("../../../initializers/database");
const actor_follow_1 = require("../../../models/activitypub/actor-follow");
function processRejectActivity(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { byActor: targetActor, inboxActor } = options;
        if (inboxActor === undefined)
            throw new Error('Need to reject on explicit inbox.');
        return processReject(inboxActor, targetActor);
    });
}
exports.processRejectActivity = processRejectActivity;
function processReject(follower, targetActor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const actorFollow = yield actor_follow_1.ActorFollowModel.loadByActorAndTarget(follower.id, targetActor.id, t);
            if (!actorFollow)
                throw new Error(`'Unknown actor follow ${follower.id} -> ${targetActor.id}.`);
            yield actorFollow.destroy({ transaction: t });
            return undefined;
        }));
    });
}
