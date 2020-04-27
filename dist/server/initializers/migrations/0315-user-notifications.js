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
