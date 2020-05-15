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
const Sequelize = require("sequelize");
const videos_1 = require("../../../shared/models/videos");
const uuidv4 = require("uuid/v4");
const constants_1 = require("../constants");
function up(utils) {
    return __awaiter(this, void 0, void 0, function* () {
        const transaction = utils.transaction;
        {
            const query = `
CREATE TABLE IF NOT EXISTS "videoPlaylist"
(
  "id"             SERIAL,
  "name"           VARCHAR(255)             NOT NULL,
  "description"    VARCHAR(255),
  "privacy"        INTEGER                  NOT NULL,
  "url"            VARCHAR(2000)            NOT NULL,
  "uuid"           UUID                     NOT NULL,
  "type"           INTEGER                  NOT NULL DEFAULT 1,
  "ownerAccountId" INTEGER                  NOT NULL REFERENCES "account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "videoChannelId" INTEGER REFERENCES "videoChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"      TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("id")
);`;
            yield utils.sequelize.query(query, { transaction });
        }
        {
            const query = `
CREATE TABLE IF NOT EXISTS "videoPlaylistElement"
(
  "id"              SERIAL,
  "url"             VARCHAR(2000)            NOT NULL,
  "position"        INTEGER                  NOT NULL DEFAULT 1,
  "startTimestamp"  INTEGER,
  "stopTimestamp"   INTEGER,
  "videoPlaylistId" INTEGER                  NOT NULL REFERENCES "videoPlaylist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "videoId"         INTEGER                  NOT NULL REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY ("id")
);`;
            yield utils.sequelize.query(query, { transaction });
        }
        {
            const userQuery = 'SELECT "username" FROM "user";';
            const options = { transaction, type: Sequelize.QueryTypes.SELECT };
            const userResult = yield utils.sequelize.query(userQuery, options);
            const usernames = userResult.map(r => r.username);
            for (const username of usernames) {
                const uuid = uuidv4();
                const baseUrl = constants_1.WEBSERVER.URL + '/video-playlists/' + uuid;
                const query = `
 INSERT INTO "videoPlaylist" ("url", "uuid", "name", "privacy", "type", "ownerAccountId", "createdAt", "updatedAt")
 SELECT '${baseUrl}' AS "url",
         '${uuid}' AS "uuid",
         'Watch later' AS "name",
         ${videos_1.VideoPlaylistPrivacy.PRIVATE} AS "privacy",
         ${videos_1.VideoPlaylistType.WATCH_LATER} AS "type",
         "account"."id" AS "ownerAccountId",
         NOW() as "createdAt",
         NOW() as "updatedAt"
 FROM "user" INNER JOIN "account" ON "user"."id" = "account"."userId"
 WHERE "user"."username" = '${username}'`;
                yield utils.sequelize.query(query, { transaction });
            }
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
