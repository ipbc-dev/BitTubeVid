"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const deletedVideo = {
            type: Sequelize.JSONB,
            allowNull: true
        };
        yield utils.queryInterface.addColumn('videoAbuse', 'deletedVideo', deletedVideo);
        yield utils.sequelize.query(`ALTER TABLE "videoAbuse" ALTER COLUMN "videoId" DROP NOT NULL;`);
        yield utils.sequelize.query(`ALTER TABLE "videoAbuse" DROP CONSTRAINT IF EXISTS "videoAbuse_videoId_fkey";`);
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
