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
function up(utils) {
    return __awaiter(this, void 0, void 0, function* () {
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
