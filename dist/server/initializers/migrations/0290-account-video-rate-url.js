"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const data = {
                type: Sequelize.STRING(2000),
                allowNull: true
            };
            yield utils.queryInterface.addColumn('accountVideoRate', 'url', data);
        }
        {
            const builtUrlQuery = `SELECT "actor"."url" || '/' ||  "accountVideoRate"."type" || 's/' || "videoId" ` +
                'FROM "accountVideoRate" ' +
                'INNER JOIN account ON account.id = "accountVideoRate"."accountId" ' +
                'INNER JOIN actor ON actor.id = account."actorId" ' +
                'WHERE "base".id = "accountVideoRate".id';
            const query = 'UPDATE "accountVideoRate" base SET "url" = (' + builtUrlQuery + ') WHERE "url" IS NULL';
            yield utils.sequelize.query(query);
        }
        {
            const data = {
                type: Sequelize.STRING(2000),
                allowNull: false,
                defaultValue: null
            };
            yield utils.queryInterface.changeColumn('accountVideoRate', 'url', data);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
