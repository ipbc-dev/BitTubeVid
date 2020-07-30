"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlockedByServerOrAccount = exports.removeServerFromBlocklist = exports.removeAccountFromBlocklist = exports.addServerInBlocklist = exports.addAccountInBlocklist = void 0;
const tslib_1 = require("tslib");
const database_1 = require("@server/initializers/database");
const application_1 = require("@server/models/application/application");
const account_blocklist_1 = require("../models/account/account-blocklist");
const server_blocklist_1 = require("../models/server/server-blocklist");
function addAccountInBlocklist(byAccountId, targetAccountId) {
    return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        return account_blocklist_1.AccountBlocklistModel.upsert({
            accountId: byAccountId,
            targetAccountId: targetAccountId
        }, { transaction: t });
    }));
}
exports.addAccountInBlocklist = addAccountInBlocklist;
function addServerInBlocklist(byAccountId, targetServerId) {
    return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        return server_blocklist_1.ServerBlocklistModel.upsert({
            accountId: byAccountId,
            targetServerId
        }, { transaction: t });
    }));
}
exports.addServerInBlocklist = addServerInBlocklist;
function removeAccountFromBlocklist(accountBlock) {
    return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        return accountBlock.destroy({ transaction: t });
    }));
}
exports.removeAccountFromBlocklist = removeAccountFromBlocklist;
function removeServerFromBlocklist(serverBlock) {
    return database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        return serverBlock.destroy({ transaction: t });
    }));
}
exports.removeServerFromBlocklist = removeServerFromBlocklist;
function isBlockedByServerOrAccount(targetAccount, userAccount) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverAccountId = (yield application_1.getServerActor()).Account.id;
        const sourceAccounts = [serverAccountId];
        if (userAccount)
            sourceAccounts.push(userAccount.id);
        const accountMutedHash = yield account_blocklist_1.AccountBlocklistModel.isAccountMutedByMulti(sourceAccounts, targetAccount.id);
        if (accountMutedHash[serverAccountId] || (userAccount && accountMutedHash[userAccount.id])) {
            return true;
        }
        const instanceMutedHash = yield server_blocklist_1.ServerBlocklistModel.isServerMutedByMulti(sourceAccounts, targetAccount.Actor.serverId);
        if (instanceMutedHash[serverAccountId] || (userAccount && instanceMutedHash[userAccount.id])) {
            return true;
        }
        return false;
    });
}
exports.isBlockedByServerOrAccount = isBlockedByServerOrAccount;
