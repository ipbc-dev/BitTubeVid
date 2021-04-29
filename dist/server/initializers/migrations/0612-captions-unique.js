"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.sequelize.query('DELETE FROM "videoCaption" v1 USING (SELECT MIN(id) as id, "filename" FROM "videoCaption" ' +
            'GROUP BY "filename" HAVING COUNT(*) > 1) v2 WHERE v1."filename" = v2."filename" AND v1.id <> v2.id');
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
