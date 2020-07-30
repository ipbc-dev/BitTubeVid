"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.sequelize.query('DROP INDEX IF EXISTS video_share_account_id;');
        yield utils.sequelize.query('DROP INDEX IF EXISTS video_published_at;');
        yield utils.sequelize.query('ALTER TABLE "avatar" DROP COLUMN IF EXISTS "avatarId"');
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
