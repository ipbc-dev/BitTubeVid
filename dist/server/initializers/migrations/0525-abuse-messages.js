"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "abuseMessage" (
      "id" serial,
      "message" text NOT NULL,
      "byModerator" boolean NOT NULL,
      "accountId" integer REFERENCES "account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "abuseId" integer NOT NULL REFERENCES "abuse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "createdAt" timestamp WITH time zone NOT NULL,
      "updatedAt" timestamp WITH time zone NOT NULL,
      PRIMARY KEY ("id")
    );
  `);
        const notificationSettingColumns = ['abuseStateChange', 'abuseNewMessage'];
        for (const column of notificationSettingColumns) {
            const data = {
                type: Sequelize.INTEGER,
                defaultValue: null,
                allowNull: true
            };
            yield utils.queryInterface.addColumn('userNotificationSetting', column, data);
        }
        {
            const query = 'UPDATE "userNotificationSetting" SET "abuseStateChange" = 3, "abuseNewMessage" = 3';
            yield utils.sequelize.query(query);
        }
        for (const column of notificationSettingColumns) {
            const data = {
                type: Sequelize.INTEGER,
                defaultValue: null,
                allowNull: false
            };
            yield utils.queryInterface.changeColumn('userNotificationSetting', column, data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
