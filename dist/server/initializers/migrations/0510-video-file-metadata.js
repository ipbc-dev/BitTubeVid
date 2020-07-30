"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const tableDefinition = yield utils.queryInterface.describeTable('videoFile');
        if (!tableDefinition['metadata']) {
            const metadata = {
                type: Sequelize.JSONB,
                allowNull: true
            };
            yield utils.queryInterface.addColumn('videoFile', 'metadata', metadata);
        }
        if (!tableDefinition['metadataUrl']) {
            const metadataUrl = {
                type: Sequelize.STRING,
                allowNull: true
            };
            yield utils.queryInterface.addColumn('videoFile', 'metadataUrl', metadataUrl);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
