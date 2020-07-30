"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.db.Avatar.sync();
        const data = {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Avatars',
                key: 'id'
            },
            onDelete: 'CASCADE'
        };
        yield utils.queryInterface.addColumn('Accounts', 'avatarId', data);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
