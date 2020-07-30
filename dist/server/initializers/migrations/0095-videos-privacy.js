"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const q = utils.queryInterface;
        const data = {
            type: Sequelize.INTEGER,
            defaultValue: null,
            allowNull: true
        };
        yield q.addColumn('Videos', 'privacy', data);
        const query = 'UPDATE "Videos" SET "privacy" = 1';
        const options = {
            type: Sequelize.QueryTypes.BULKUPDATE
        };
        yield utils.sequelize.query(query, options);
        data.allowNull = false;
        yield q.changeColumn('Videos', 'privacy', data);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
