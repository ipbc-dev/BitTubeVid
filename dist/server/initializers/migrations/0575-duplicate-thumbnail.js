"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = 'DELETE FROM "thumbnail" s1 ' +
                'USING (SELECT MIN(id) as id, "filename", "type" FROM "thumbnail" GROUP BY "filename", "type" HAVING COUNT(*) > 1) s2 ' +
                'WHERE s1."filename" = s2."filename" AND s1."type" = s2."type" AND s1.id <> s2.id';
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
