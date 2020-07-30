"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.NOW
            };
            yield utils.queryInterface.addColumn('video', 'publishedAt', data);
        }
        {
            const query = 'UPDATE video SET "publishedAt" = video."createdAt"';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            };
            yield utils.queryInterface.changeColumn('video', 'publishedAt', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
