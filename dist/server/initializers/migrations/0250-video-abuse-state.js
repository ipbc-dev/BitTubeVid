"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
const videos_1 = require("../../../shared/models/videos");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('videoAbuse', 'state', data);
        }
        {
            const query = 'UPDATE "videoAbuse" SET "state" = ' + videos_1.VideoAbuseState.PENDING;
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: null
            };
            yield utils.queryInterface.changeColumn('videoAbuse', 'state', data);
        }
        {
            const data = {
                type: Sequelize.STRING(300),
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('videoAbuse', 'moderationComment', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
