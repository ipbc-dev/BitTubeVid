"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sequelize = require("sequelize");
const videos_1 = require("../../../shared/models/videos");
function up(utils) {
    return __awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('videoBlacklist', 'type', data);
        }
        {
            const query = 'UPDATE "videoBlacklist" SET "type" = ' + videos_1.VideoBlacklistType.MANUAL;
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
