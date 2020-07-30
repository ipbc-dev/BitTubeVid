"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = 'DELETE FROM "server" s1 USING "server" s2 WHERE s1.id < s2.id AND s1."host" = s2."host"';
            yield utils.sequelize.query(query);
        }
        {
            const query = 'DELETE FROM "videoFile" vf1 USING "videoFile" vf2 WHERE vf1.id < vf2.id ' +
                'AND vf1."videoId" = vf2."videoId" AND vf1.resolution = vf2.resolution AND vf1.fps IS NULL';
            yield utils.sequelize.query(query);
        }
        {
            const query = 'UPDATE "videoFile" SET fps = -1 WHERE fps IS NULL;';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: -1
            };
            yield utils.queryInterface.changeColumn('videoFile', 'fps', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
