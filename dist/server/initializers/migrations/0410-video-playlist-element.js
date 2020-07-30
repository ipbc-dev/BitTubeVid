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
                defaultValue: null
            };
            yield utils.queryInterface.changeColumn('videoPlaylistElement', 'videoId', data);
        }
        yield utils.queryInterface.removeConstraint('videoPlaylistElement', 'videoPlaylistElement_videoId_fkey');
        yield utils.queryInterface.addConstraint('videoPlaylistElement', ['videoId'], {
            type: 'foreign key',
            references: {
                table: 'video',
                field: 'id'
            },
            onDelete: 'set null',
            onUpdate: 'CASCADE'
        });
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
