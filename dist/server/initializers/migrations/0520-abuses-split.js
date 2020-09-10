"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.queryInterface.renameTable('videoAbuse', 'abuse');
        yield utils.sequelize.query(`
    ALTER TABLE "abuse"
    ADD COLUMN "flaggedAccountId" INTEGER REFERENCES "account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  `);
        yield utils.sequelize.query(`
    UPDATE "abuse" SET "videoId" = NULL
    WHERE "videoId" NOT IN (SELECT "id" FROM "video")
  `);
        yield utils.sequelize.query(`
    UPDATE "abuse" SET "flaggedAccountId" = "videoChannel"."accountId"
    FROM "video" INNER JOIN "videoChannel" ON "video"."channelId" = "videoChannel"."id"
    WHERE "abuse"."videoId" = "video"."id"
  `);
        yield utils.sequelize.query('DROP INDEX IF EXISTS video_abuse_video_id;');
        yield utils.sequelize.query('DROP INDEX IF EXISTS video_abuse_reporter_account_id;');
        yield utils.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "videoAbuse" (
      "id" serial,
      "startAt" integer DEFAULT NULL,
      "endAt" integer DEFAULT NULL,
      "deletedVideo" jsonb DEFAULT NULL,
      "abuseId" integer NOT NULL REFERENCES "abuse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "videoId" integer REFERENCES "video" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "createdAt" TIMESTAMP WITH time zone NOT NULL,
      "updatedAt" timestamp WITH time zone NOT NULL,
      PRIMARY KEY ("id")
    );
  `);
        yield utils.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "commentAbuse" (
      "id" serial,
      "abuseId" integer NOT NULL REFERENCES "abuse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "videoCommentId" integer REFERENCES "videoComment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "createdAt" timestamp WITH time zone NOT NULL,
      "updatedAt" timestamp WITH time zone NOT NULL,
      PRIMARY KEY ("id")
    );
  `);
        yield utils.sequelize.query(`
      INSERT INTO "videoAbuse" ("startAt", "endAt", "deletedVideo", "abuseId", "videoId", "createdAt", "updatedAt")
      SELECT "abuse"."startAt", "abuse"."endAt", "abuse"."deletedVideo", "abuse"."id", "abuse"."videoId",
      "abuse"."createdAt", "abuse"."updatedAt"
      FROM "abuse"
  `);
        yield utils.queryInterface.removeColumn('abuse', 'startAt');
        yield utils.queryInterface.removeColumn('abuse', 'endAt');
        yield utils.queryInterface.removeColumn('abuse', 'deletedVideo');
        yield utils.queryInterface.removeColumn('abuse', 'videoId');
        yield utils.sequelize.query('DROP INDEX IF EXISTS user_notification_video_abuse_id');
        yield utils.queryInterface.renameColumn('userNotification', 'videoAbuseId', 'abuseId');
        yield utils.sequelize.query('ALTER INDEX IF EXISTS "videoAbuse_pkey" RENAME TO "abuse_pkey"');
        yield utils.queryInterface.renameColumn('userNotificationSetting', 'videoAbuseAsModerator', 'abuseAsModerator');
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
