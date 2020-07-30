"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'videoStreamingPlaylist',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            };
            yield utils.queryInterface.addColumn('videoFile', 'videoStreamingPlaylistId', data);
        }
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: true
            };
            yield utils.queryInterface.changeColumn('videoFile', 'videoId', data);
        }
        {
            yield utils.queryInterface.removeIndex('videoFile', 'video_file_video_id_resolution_fps');
        }
        {
            const query = 'insert into "videoFile" ' +
                '(resolution, size, "infoHash", "videoId", "createdAt", "updatedAt", fps, extname, "videoStreamingPlaylistId")' +
                '(SELECT "videoFile".resolution, "videoFile".size, \'fake\', NULL, "videoFile"."createdAt", "videoFile"."updatedAt", ' +
                '"videoFile"."fps", "videoFile".extname, "videoStreamingPlaylist".id FROM "videoStreamingPlaylist" ' +
                'inner join video ON video.id = "videoStreamingPlaylist"."videoId" inner join "videoFile" ON "videoFile"."videoId" = video.id)';
            yield utils.sequelize.query(query, { transaction: utils.transaction });
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
