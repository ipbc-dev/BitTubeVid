"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('videoBlacklist', 'type', data);
        }
        {
            const query = 'UPDATE "videoBlacklist" SET "type" = ' + 1;
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: null
            };
            yield utils.queryInterface.changeColumn('videoBlacklist', 'type', data);
        }
        {
            const data = {
                type: Sequelize.INTEGER,
                defaultValue: null,
                allowNull: true
            };
            yield utils.queryInterface.addColumn('userNotificationSetting', 'videoAutoBlacklistAsModerator', data);
        }
        {
            const query = 'UPDATE "userNotificationSetting" SET "videoAutoBlacklistAsModerator" = 3';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.INTEGER,
                defaultValue: null,
                allowNull: false
            };
            yield utils.queryInterface.changeColumn('userNotificationSetting', 'videoAutoBlacklistAsModerator', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
