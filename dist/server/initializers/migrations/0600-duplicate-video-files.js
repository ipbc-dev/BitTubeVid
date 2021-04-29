"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = 'DELETE FROM "videoFile" f1 ' +
                'USING (SELECT MIN(id) as id, "torrentFilename" FROM "videoFile" GROUP BY "torrentFilename" HAVING COUNT(*) > 1) f2 ' +
                'WHERE f1."torrentFilename" = f2."torrentFilename" AND f1.id <> f2.id';
            yield utils.sequelize.query(query);
        }
        {
            const query = 'DELETE FROM "videoFile" f1 ' +
                'USING (SELECT MIN(id) as id, "filename" FROM "videoFile" GROUP BY "filename" HAVING COUNT(*) > 1) f2 ' +
                'WHERE f1."filename" = f2."filename" AND f1.id <> f2.id';
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
