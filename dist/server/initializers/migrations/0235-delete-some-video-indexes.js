"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.sequelize.query('DROP INDEX IF EXISTS video_id_privacy_state_wait_transcoding;');
        yield utils.sequelize.query('DROP INDEX IF EXISTS video_name;');
        for (let i = 0; i < 5; i++) {
            const query = 'DELETE FROM "videoFile" WHERE id IN ' +
                '(SELECT id FROM (SELECT MIN(id) AS id, "videoId", "resolution", "fps" ' +
                'FROM "videoFile" GROUP BY "videoId", "resolution", "fps" HAVING COUNT(*) > 1) t)';
            yield utils.sequelize.query(query);
        }
        for (let i = 0; i < 5; i++) {
            const query = 'DELETE FROM "actor" WHERE id IN ' +
                '(SELECT id FROM (SELECT MIN(id) AS id, "uuid" ' +
                'FROM "actor" GROUP BY "uuid" HAVING COUNT(*) > 1) t)';
            yield utils.sequelize.query(query);
        }
        for (let i = 0; i < 5; i++) {
            const query = 'DELETE FROM "account" WHERE id IN ' +
                '(SELECT id FROM (SELECT MIN(id) AS id, "actorId" ' +
                'FROM "account" GROUP BY "actorId" HAVING COUNT(*) > 1) t)';
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
