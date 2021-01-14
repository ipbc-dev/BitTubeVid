"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const query = `
    WITH t AS (
      SELECT actor.id FROM actor
      LEFT JOIN "videoChannel" ON "videoChannel"."actorId" = actor.id
      LEFT JOIN account ON account."actorId" = "actor"."id"
      WHERE "videoChannel".id IS NULL and "account".id IS NULL
    ) DELETE FROM "actorFollow" WHERE "actorId" IN (SELECT t.id FROM t) OR "targetActorId" in (SELECT t.id FROM t)
  `;
        yield utils.sequelize.query(query);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
