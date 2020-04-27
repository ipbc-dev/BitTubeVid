"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sequelize = require("sequelize");
function up(utils) {
    return __awaiter(this, void 0, void 0, function* () {
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
