"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            };
            yield utils.queryInterface.addColumn('user', 'webTorrentEnabled', data);
        }
    });
}
exports.up = up;
function down(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.queryInterface.removeColumn('user', 'webTorrentEnabled');
    });
}
exports.down = down;
