"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        for (const column of ['filename', 'fileUrl', 'torrentFilename', 'torrentUrl']) {
            const data = {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('videoFile', column, data);
        }
        {
            const webtorrentQuery = `SELECT "videoFile".id, "video".uuid, "videoFile".resolution, "videoFile".extname ` +
                `FROM video INNER JOIN "videoFile" ON "videoFile"."videoId" = video.id`;
            const query = `UPDATE "videoFile" ` +
                `SET filename = t.uuid || '-' || t.resolution || t.extname, ` +
                `"torrentFilename" = t.uuid || '-' || t.resolution || '.torrent' ` +
                `FROM (${webtorrentQuery}) AS t WHERE t.id = "videoFile"."id"`;
            yield utils.sequelize.query(query);
        }
        {
            const hlsQuery = `SELECT "videoFile".id, "video".uuid, "videoFile".resolution, "videoFile".extname ` +
                `FROM video ` +
                `INNER JOIN "videoStreamingPlaylist" ON "videoStreamingPlaylist"."videoId" = video.id ` +
                `INNER JOIN "videoFile" ON "videoFile"."videoStreamingPlaylistId" = "videoStreamingPlaylist".id`;
            const query = `UPDATE "videoFile" ` +
                `SET filename = t.uuid || '-' || t.resolution || '-fragmented' || t.extname, ` +
                `"torrentFilename" = t.uuid || '-' || t.resolution || '-hls.torrent' ` +
                `FROM (${hlsQuery}) AS t WHERE t.id = "videoFile"."id"`;
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
