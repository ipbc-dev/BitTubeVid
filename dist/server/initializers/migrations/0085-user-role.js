"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const q = utils.queryInterface;
        yield q.renameColumn('Users', 'role', 'oldRole');
        const data = {
            type: Sequelize.INTEGER,
            allowNull: true
        };
        yield q.addColumn('Users', 'role', data);
        let query = 'UPDATE "Users" SET "role" = 0 WHERE "oldRole" = \'admin\'';
        yield utils.sequelize.query(query);
        query = 'UPDATE "Users" SET "role" = 2 WHERE "oldRole" = \'user\'';
        yield utils.sequelize.query(query);
        data.allowNull = false;
        yield q.changeColumn('Users', 'role', data);
        yield q.removeColumn('Users', 'oldRole');
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
