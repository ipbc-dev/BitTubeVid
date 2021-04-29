"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processActorKeys = void 0;
const tslib_1 = require("tslib");
const actor_1 = require("@server/lib/activitypub/actor");
const actor_2 = require("@server/models/activitypub/actor");
const logger_1 = require("../../../helpers/logger");
function processActorKeys(job) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = job.data;
        logger_1.logger.info('Processing actor keys in job %d.', job.id);
        const actor = yield actor_2.ActorModel.load(payload.actorId);
        yield actor_1.generateAndSaveActorKeys(actor);
    });
}
exports.processActorKeys = processActorKeys;
