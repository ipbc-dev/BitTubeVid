"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        {
            const toReplace = ':443';
            const by = '';
            const replacer = column => `replace("${column}", '${toReplace}', '${by}')`;
            const query = `UPDATE video SET url = ${replacer('url')}`;
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
