"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const fromQueryWebtorrent = `SELECT 'https://' || server.host AS "serverUrl", '/static/webseed/' AS "filePath", "videoFile".id ` +
                `FROM video ` +
                `INNER JOIN "videoChannel" ON "videoChannel".id = video."channelId" ` +
                `INNER JOIN actor ON actor.id = "videoChannel"."actorId" ` +
                `INNER JOIN server ON server.id = actor."serverId" ` +
                `INNER JOIN "videoFile" ON "videoFile"."videoId" = video.id ` +
                `WHERE video.remote IS TRUE`;
            const fromQueryHLS = `SELECT 'https://' || server.host AS "serverUrl", ` +
                `'/static/streaming-playlists/hls/' || video.uuid || '/' AS "filePath", "videoFile".id ` +
                `FROM video ` +
                `INNER JOIN "videoChannel" ON "videoChannel".id = video."channelId" ` +
                `INNER JOIN actor ON actor.id = "videoChannel"."actorId" ` +
                `INNER JOIN server ON server.id = actor."serverId" ` +
                `INNER JOIN "videoStreamingPlaylist" ON "videoStreamingPlaylist"."videoId" = video.id ` +
                `INNER JOIN "videoFile" ON "videoFile"."videoStreamingPlaylistId" = "videoStreamingPlaylist".id ` +
                `WHERE video.remote IS TRUE`;
            for (const fromQuery of [fromQueryWebtorrent, fromQueryHLS]) {
                const query = `UPDATE "videoFile" ` +
                    `SET "torrentUrl" = t."serverUrl" || '/static/torrents/' || "videoFile"."torrentFilename", ` +
                    `"fileUrl" = t."serverUrl" || t."filePath" || "videoFile"."filename" ` +
                    `FROM (${fromQuery}) AS t WHERE t.id = "videoFile"."id" AND "videoFile"."fileUrl" IS NULL`;
                yield utils.sequelize.query(query);
            }
        }
        {
            const fromQuery = `SELECT 'https://' || server.host AS "serverUrl", "video".uuid, "videoCaption".id ` +
                `FROM video ` +
                `INNER JOIN "videoChannel" ON "videoChannel".id = video."channelId" ` +
                `INNER JOIN actor ON actor.id = "videoChannel"."actorId" ` +
                `INNER JOIN server ON server.id = actor."serverId" ` +
                `INNER JOIN "videoCaption" ON "videoCaption"."videoId" = video.id ` +
                `WHERE video.remote IS TRUE`;
            const query = `UPDATE "videoCaption" ` +
                `SET "fileUrl" = t."serverUrl" || '/lazy-static/video-captions/' || t.uuid || '-' || "videoCaption"."language" || '.vtt' ` +
                `FROM (${fromQuery}) AS t WHERE t.id = "videoCaption"."id" AND "videoCaption"."fileUrl" IS NULL`;
            yield utils.sequelize.query(query);
        }
        {
            const fromQuery = `SELECT 'https://' || server.host AS "serverUrl", "video".uuid, "thumbnail".id ` +
                `FROM video ` +
                `INNER JOIN "videoChannel" ON "videoChannel".id = video."channelId" ` +
                `INNER JOIN actor ON actor.id = "videoChannel"."actorId" ` +
                `INNER JOIN server ON server.id = actor."serverId" ` +
                `INNER JOIN "thumbnail" ON "thumbnail"."videoId" = video.id ` +
                `WHERE video.remote IS TRUE`;
            {
                const query = `UPDATE "thumbnail" ` +
                    `SET "fileUrl" = t."serverUrl" || '/static/thumbnails/' || t.uuid || '.jpg' ` +
                    `FROM (${fromQuery}) AS t WHERE t.id = "thumbnail"."id" AND "thumbnail"."fileUrl" IS NULL AND thumbnail.type = 1`;
                yield utils.sequelize.query(query);
            }
            {
                const query = `UPDATE "thumbnail" ` +
                    `SET "fileUrl" = t."serverUrl" || '/lazy-static/previews/' || t.uuid || '.jpg' ` +
                    `FROM (${fromQuery}) AS t WHERE t.id = "thumbnail"."id" AND "thumbnail"."fileUrl" IS NULL AND thumbnail.type = 2`;
                yield utils.sequelize.query(query);
            }
        }
        {
            const trackerUrls = [
                `'https://' || server.host  || '/tracker/announce'`,
                `'wss://' || server.host  || '/tracker/socket'`
            ];
            for (const trackerUrl of trackerUrls) {
                {
                    const query = `INSERT INTO "tracker" ("url", "createdAt", "updatedAt") ` +
                        `SELECT ${trackerUrl} AS "url", NOW(), NOW() ` +
                        `FROM video ` +
                        `INNER JOIN "videoChannel" ON "videoChannel".id = video."channelId" ` +
                        `INNER JOIN actor ON actor.id = "videoChannel"."actorId" ` +
                        `INNER JOIN server ON server.id = actor."serverId" ` +
                        `WHERE video.remote IS TRUE ` +
                        `ON CONFLICT DO NOTHING`;
                    yield utils.sequelize.query(query);
                }
                {
                    const query = `INSERT INTO "videoTracker" ("videoId", "trackerId", "createdAt", "updatedAt") ` +
                        `SELECT video.id, (SELECT tracker.id FROM tracker WHERE url = ${trackerUrl}) AS "trackerId", NOW(), NOW()` +
                        `FROM video ` +
                        `INNER JOIN "videoChannel" ON "videoChannel".id = video."channelId" ` +
                        `INNER JOIN actor ON actor.id = "videoChannel"."actorId" ` +
                        `INNER JOIN server ON server.id = actor."serverId" ` +
                        `WHERE video.remote IS TRUE`;
                    yield utils.sequelize.query(query);
                }
            }
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
