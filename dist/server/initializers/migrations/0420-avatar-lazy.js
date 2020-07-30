"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = 'DELETE FROM "avatar" s1 ' +
                'USING (SELECT MIN(id) as id, filename FROM "avatar" GROUP BY "filename" HAVING COUNT(*) > 1) s2 ' +
                'WHERE s1."filename" = s2."filename" AND s1.id <> s2.id';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('avatar', 'fileUrl', data);
        }
        {
            const data = {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('avatar', 'onDisk', data);
        }
        {
            const query = 'UPDATE "avatar" SET "onDisk" = true;';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: null
            };
            yield utils.queryInterface.changeColumn('avatar', 'onDisk', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
