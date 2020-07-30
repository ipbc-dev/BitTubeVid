"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = `
CREATE TABLE IF NOT EXISTS "userNotificationSetting" ("id" SERIAL,
"newVideoFromSubscription" INTEGER NOT NULL DEFAULT NULL,
"newCommentOnMyVideo" INTEGER NOT NULL DEFAULT NULL,
"videoAbuseAsModerator" INTEGER NOT NULL DEFAULT NULL,
"blacklistOnMyVideo" INTEGER NOT NULL DEFAULT NULL,
"myVideoPublished" INTEGER NOT NULL DEFAULT NULL,
"myVideoImportFinished" INTEGER NOT NULL DEFAULT NULL,
"newUserRegistration" INTEGER NOT NULL DEFAULT NULL,
"newFollow" INTEGER NOT NULL DEFAULT NULL,
"commentMention" INTEGER NOT NULL DEFAULT NULL,
"userId" INTEGER REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
PRIMARY KEY ("id"))
`;
            yield utils.sequelize.query(query);
        }
        {
            const query = 'INSERT INTO "userNotificationSetting" ' +
                '("newVideoFromSubscription", "newCommentOnMyVideo", "videoAbuseAsModerator", "blacklistOnMyVideo", ' +
                '"myVideoPublished", "myVideoImportFinished", "newUserRegistration", "newFollow", "commentMention", ' +
                '"userId", "createdAt", "updatedAt") ' +
                '(SELECT 1, 1, 3, 3, 1, 1, 1, 1, 1, id, NOW(), NOW() FROM "user")';
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
