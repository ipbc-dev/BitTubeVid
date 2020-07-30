"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const password = {
                type: Sequelize.STRING,
                allowNull: true
            };
            yield utils.queryInterface.changeColumn('user', 'password', password);
        }
        {
            const pluginAuth = {
                type: Sequelize.STRING,
                allowNull: true
            };
            yield utils.queryInterface.addColumn('user', 'pluginAuth', pluginAuth);
        }
        {
            const authName = {
                type: Sequelize.STRING,
                allowNull: true
            };
            yield utils.queryInterface.addColumn('oAuthToken', 'authName', authName);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
