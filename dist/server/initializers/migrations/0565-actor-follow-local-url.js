"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = `
    UPDATE "actorFollow" SET url = follower.url || '/follows/' || following.id
    FROM actor follower, actor following
    WHERE follower."serverId" IS NULL AND follower.id = "actorFollow"."actorId" AND following.id = "actorFollow"."targetActorId"
    `;
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
