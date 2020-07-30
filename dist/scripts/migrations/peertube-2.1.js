"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("../../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const database_1 = require("../../server/initializers/database");
const Sequelize = require("sequelize");
const path_1 = require("path");
const constants_1 = require("@server/initializers/constants");
const fs_extra_1 = require("fs-extra");
const webtorrent_1 = require("@server/helpers/webtorrent");
const config_1 = require("@server/initializers/config");
const parseTorrent = require("parse-torrent");
const logger_1 = require("@server/helpers/logger");
run()
    .then(() => process.exit(0))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
function run() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Creating torrents and updating database for HSL files.');
        yield database_1.initDatabaseModels(true);
        const query = 'select "videoFile".id as id, "videoFile".resolution as resolution, "video".uuid as uuid from "videoFile" ' +
            'inner join "videoStreamingPlaylist" ON "videoStreamingPlaylist".id = "videoFile"."videoStreamingPlaylistId" ' +
            'inner join video ON video.id = "videoStreamingPlaylist"."videoId" ' +
            'WHERE video.remote IS FALSE';
        const options = {
            type: Sequelize.QueryTypes.SELECT
        };
        const res = yield database_1.sequelizeTypescript.query(query, options);
        for (const row of res) {
            const videoFilename = `${row['uuid']}-${row['resolution']}-fragmented.mp4`;
            const videoFilePath = path_1.join(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, row['uuid'], videoFilename);
            logger_1.logger.info('Processing %s.', videoFilePath);
            if (!(yield fs_extra_1.pathExists(videoFilePath))) {
                console.warn('Cannot generate torrent of %s: file does not exist.', videoFilePath);
                continue;
            }
            const createTorrentOptions = {
                name: `video ${row['uuid']}`,
                createdBy: 'PeerTube',
                announceList: [
                    [constants_1.WEBSERVER.WS + '://' + constants_1.WEBSERVER.HOSTNAME + ':' + constants_1.WEBSERVER.PORT + '/tracker/socket'],
                    [constants_1.WEBSERVER.URL + '/tracker/announce']
                ],
                urlList: [constants_1.WEBSERVER.URL + path_1.join(constants_1.STATIC_PATHS.STREAMING_PLAYLISTS.HLS, row['uuid'], videoFilename)]
            };
            const torrent = yield webtorrent_1.createTorrentPromise(videoFilePath, createTorrentOptions);
            const torrentName = `${row['uuid']}-${row['resolution']}-hls.torrent`;
            const filePath = path_1.join(config_1.CONFIG.STORAGE.TORRENTS_DIR, torrentName);
            yield fs_extra_1.writeFile(filePath, torrent);
            const parsedTorrent = parseTorrent(torrent);
            const infoHash = parsedTorrent.infoHash;
            const stats = yield fs_extra_1.stat(videoFilePath);
            const size = stats.size;
            const queryUpdate = 'UPDATE "videoFile" SET "infoHash" = ?, "size" = ? WHERE id = ?';
            const options = {
                type: Sequelize.QueryTypes.UPDATE,
                replacements: [infoHash, size, row['id']]
            };
            yield database_1.sequelizeTypescript.query(queryUpdate, options);
        }
    });
}
