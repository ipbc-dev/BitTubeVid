"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = `INSERT INTO "videoShare" (url, "actorId", "videoId", "createdAt", "updatedAt") ` +
                `(` +
                `SELECT ` +
                `video.url || '/announces/' || "videoChannel"."actorId" as url, ` +
                `"videoChannel"."actorId" AS "actorId", ` +
                `"video"."id" AS "videoId", ` +
                `NOW() AS "createdAt", ` +
                `NOW() AS "updatedAt" ` +
                `FROM video ` +
                `INNER JOIN "videoChannel" ON "video"."channelId" = "videoChannel"."id" ` +
                `WHERE "video"."remote" = false AND "video"."privacy" != 3 AND "video"."state" = 1` +
                `) ` +
                `ON CONFLICT DO NOTHING`;
            yield utils.sequelize.query(query);
        }
        {
            const query = `INSERT INTO "videoShare" (url, "actorId", "videoId", "createdAt", "updatedAt") ` +
                `(` +
                `SELECT ` +
                `video.url || '/announces/' || (SELECT id FROM actor WHERE "preferredUsername" = 'peertube' ORDER BY id ASC LIMIT 1) as url, ` +
                `(SELECT id FROM actor WHERE "preferredUsername" = 'peertube' ORDER BY id ASC LIMIT 1) AS "actorId", ` +
                `"video"."id" AS "videoId", ` +
                `NOW() AS "createdAt", ` +
                `NOW() AS "updatedAt" ` +
                `FROM video ` +
                `WHERE "video"."remote" = false AND "video"."privacy" != 3 AND "video"."state" = 1` +
                `) ` +
                `ON CONFLICT DO NOTHING`;
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
