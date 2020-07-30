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
            const query = `
    UPDATE actor SET url = ${replacer('url')}, "inboxUrl" = ${replacer('inboxUrl')}, "outboxUrl" = ${replacer('outboxUrl')},
    "sharedInboxUrl" = ${replacer('sharedInboxUrl')}, "followersUrl" = ${replacer('followersUrl')},
    "followingUrl" = ${replacer('followingUrl')}
  `;
            yield utils.sequelize.query(query);
        }
        {
            const toReplace = '/account/';
            const by = '/accounts/';
            const replacer = column => `replace("${column}", '${toReplace}', '${by}')`;
            const query = `
    UPDATE actor SET url = ${replacer('url')}, "inboxUrl" = ${replacer('inboxUrl')}, "outboxUrl" = ${replacer('outboxUrl')},
    "sharedInboxUrl" = ${replacer('sharedInboxUrl')}, "followersUrl" = ${replacer('followersUrl')},
    "followingUrl" = ${replacer('followingUrl')}
  `;
            yield utils.sequelize.query(query);
        }
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
