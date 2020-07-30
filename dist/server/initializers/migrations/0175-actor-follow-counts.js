"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const query = 'UPDATE "actor" SET ' +
            '"followersCount" = (SELECT COUNT(*) FROM "actorFollow" WHERE "actor"."id" = "actorFollow"."targetActorId"), ' +
            '"followingCount" = (SELECT COUNT(*) FROM "actorFollow" WHERE "actor"."id" = "actorFollow"."actorId") ' +
            'WHERE "actor"."serverId" IS NULL';
        yield utils.sequelize.query(query);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
