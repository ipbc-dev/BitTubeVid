"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const indexNames = [
            'video_category',
            'video_licence',
            'video_nsfw',
            'video_language',
            'video_wait_transcoding',
            'video_state',
            'video_remote',
            'video_likes'
        ];
        for (const indexName of indexNames) {
            yield utils.sequelize.query('DROP INDEX IF EXISTS "' + indexName + '";');
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
