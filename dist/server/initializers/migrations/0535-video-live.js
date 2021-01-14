"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = `
    CREATE TABLE IF NOT EXISTS "videoLive" (
      "id"   SERIAL ,
      "streamKey" VARCHAR(255),
      "videoId" INTEGER NOT NULL REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      PRIMARY KEY ("id")
    );
    `;
            yield utils.sequelize.query(query);
        }
        {
            yield utils.queryInterface.addColumn('video', 'isLive', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            });
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
