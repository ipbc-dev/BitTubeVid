"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = `CREATE TABLE IF NOT EXISTS "tracker" (
      "id" serial,
      "url" varchar(255) NOT NULL,
      "createdAt" timestamp WITH time zone NOT NULL,
      "updatedAt" timestamp WITH time zone NOT NULL,
      PRIMARY KEY ("id")
    );`;
            yield utils.sequelize.query(query);
        }
        {
            const query = `CREATE TABLE IF NOT EXISTS "videoTracker" (
      "videoId" integer REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "trackerId" integer REFERENCES "tracker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "createdAt" timestamp WITH time zone NOT NULL,
      "updatedAt" timestamp WITH time zone NOT NULL,
      UNIQUE ("videoId", "trackerId"),
      PRIMARY KEY ("videoId", "trackerId")
    );`;
            yield utils.sequelize.query(query);
        }
        yield utils.sequelize.query(`CREATE UNIQUE INDEX "tracker_url" ON "tracker" ("url")`);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
