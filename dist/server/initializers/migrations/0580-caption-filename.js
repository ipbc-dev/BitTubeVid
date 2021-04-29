"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('videoCaption', 'filename', data);
        }
        {
            const query = `UPDATE "videoCaption" SET "filename" = s.uuid || '-' || s.language || '.vtt' ` +
                `FROM (` +
                `  SELECT "videoCaption"."id", video.uuid, "videoCaption".language ` +
                `  FROM "videoCaption" INNER JOIN video ON video.id = "videoCaption"."videoId"` +
                `) AS s ` +
                `WHERE "videoCaption".id = s.id`;
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: null
            };
            yield utils.queryInterface.changeColumn('videoCaption', 'filename', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
