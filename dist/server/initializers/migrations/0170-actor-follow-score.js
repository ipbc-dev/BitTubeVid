"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
const constants_1 = require("../constants");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.queryInterface.removeColumn('server', 'score');
        const data = {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: constants_1.ACTOR_FOLLOW_SCORE.BASE
        };
        yield utils.queryInterface.addColumn('actorFollow', 'score', data);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
