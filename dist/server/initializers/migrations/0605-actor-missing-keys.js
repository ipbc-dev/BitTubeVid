"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
const Sequelize = require("sequelize");
const core_utils_1 = require("../../helpers/core-utils");
const constants_1 = require("../constants");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const query = 'SELECT * FROM "actor" WHERE "serverId" IS NULL AND "publicKey" IS NULL';
            const options = { type: Sequelize.QueryTypes.SELECT };
            const actors = yield utils.sequelize.query(query, options);
            for (const actor of actors) {
                const { key } = yield core_utils_1.createPrivateKey(constants_1.PRIVATE_RSA_KEY_SIZE);
                const { publicKey } = yield core_utils_1.getPublicKey(key);
                const queryUpdate = `UPDATE "actor" SET "publicKey" = '${publicKey}', "privateKey" = '${key}' WHERE id = ${actor.id}`;
                yield utils.sequelize.query(queryUpdate);
            }
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
