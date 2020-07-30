"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = 'DELETE FROM "videoShare" s1 ' +
                'USING (SELECT MIN(id) as id, "actorId", "videoId" FROM "videoShare" GROUP BY "actorId", "videoId" HAVING COUNT(*) > 1) s2 ' +
                'WHERE s1."actorId" = s2."actorId" AND s1."videoId" = s2."videoId" AND s1.id <> s2.id';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null
            };
            yield utils.queryInterface.addColumn('videoShare', 'url', data);
            const query = `UPDATE "videoShare" SET "url" = (SELECT "url" FROM "video" WHERE "id" = "videoId") || '/announces/' || "actorId"`;
            yield utils.sequelize.query(query);
            data.allowNull = false;
            yield utils.queryInterface.changeColumn('videoShare', 'url', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
