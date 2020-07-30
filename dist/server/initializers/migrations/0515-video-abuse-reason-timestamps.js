"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.queryInterface.addColumn('videoAbuse', 'predefinedReasons', {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
            allowNull: true
        });
        yield utils.queryInterface.addColumn('videoAbuse', 'startAt', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
        yield utils.queryInterface.addColumn('videoAbuse', 'endAt', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
