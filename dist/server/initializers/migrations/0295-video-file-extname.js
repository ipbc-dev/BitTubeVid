"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            yield utils.queryInterface.renameColumn('videoFile', 'extname', 'extname_old');
        }
        {
            const data = {
                type: Sequelize.STRING,
                defaultValue: null,
                allowNull: true
            };
            yield utils.queryInterface.addColumn('videoFile', 'extname', data);
        }
        {
            const query = 'UPDATE "videoFile" SET "extname" = "extname_old"::text';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.STRING,
                defaultValue: null,
                allowNull: false
            };
            yield utils.queryInterface.changeColumn('videoFile', 'extname', data);
        }
        {
            yield utils.queryInterface.removeColumn('videoFile', 'extname_old');
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
