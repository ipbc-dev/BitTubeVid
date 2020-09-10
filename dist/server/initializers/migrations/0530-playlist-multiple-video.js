"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
const constants_1 = require("../constants");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const field = {
                type: Sequelize.STRING,
                allowNull: true
            };
            yield utils.queryInterface.changeColumn('videoPlaylistElement', 'url', field);
        }
        {
            yield utils.sequelize.query('DROP INDEX IF EXISTS video_playlist_element_video_playlist_id_video_id;');
        }
        {
            const selectPlaylistUUID = 'SELECT "uuid" FROM "videoPlaylist" WHERE "id" = "videoPlaylistElement"."videoPlaylistId"';
            const url = `'${constants_1.WEBSERVER.URL}' || '/video-playlists/' || (${selectPlaylistUUID}) || '/videos/' || "videoPlaylistElement"."id"`;
            const query = `
      UPDATE "videoPlaylistElement" SET "url" = ${url} WHERE id IN (
        SELECT "videoPlaylistElement"."id" FROM "videoPlaylistElement"
        INNER JOIN "videoPlaylist" ON "videoPlaylist".id = "videoPlaylistElement"."videoPlaylistId"
        INNER JOIN account ON account.id = "videoPlaylist"."ownerAccountId"
        INNER JOIN actor ON actor.id = account."actorId"
        WHERE actor."serverId" IS NULL
      )`;
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
