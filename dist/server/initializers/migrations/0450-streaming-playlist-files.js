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
function up(utils) {
    return __awaiter(this, void 0, void 0, function* () {
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
