"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
const uuid_1 = require("uuid");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const q = utils.queryInterface;
        {
            const userFeedTokenUUID = {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: true
            };
            yield q.addColumn('user', 'feedToken', userFeedTokenUUID);
        }
        {
            const query = 'SELECT * FROM "user" WHERE "feedToken" IS NULL';
            const options = { type: Sequelize.QueryTypes.SELECT };
            const users = yield utils.sequelize.query(query, options);
            for (const user of users) {
                const queryUpdate = `UPDATE "user" SET "feedToken" = '${uuid_1.v4()}' WHERE id = ${user.id}`;
                yield utils.sequelize.query(queryUpdate);
            }
        }
        {
            const userFeedTokenUUID = {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false
            };
            yield q.changeColumn('user', 'feedToken', userFeedTokenUUID);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
