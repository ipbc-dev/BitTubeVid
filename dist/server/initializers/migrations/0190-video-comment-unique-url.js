"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = 'DELETE FROM "videoComment" s1 ' +
                'USING (SELECT MIN(id) as id, url FROM "videoComment" GROUP BY "url" HAVING COUNT(*) > 1) s2 ' +
                'WHERE s1."url" = s2."url" AND s1.id <> s2.id';
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
