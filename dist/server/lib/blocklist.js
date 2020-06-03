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
const database_1 = require("@server/initializers/database");
const account_blocklist_1 = require("../models/account/account-blocklist");
const server_blocklist_1 = require("../models/server/server-blocklist");
function addAccountInBlocklist(byAccountId, targetAccountId) {
    return database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
        return account_blocklist_1.AccountBlocklistModel.upsert({
            accountId: byAccountId,
            targetAccountId: targetAccountId
        }, { transaction: t });
    }));
}
exports.addAccountInBlocklist = addAccountInBlocklist;
function addServerInBlocklist(byAccountId, targetServerId) {
    return database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
        return server_blocklist_1.ServerBlocklistModel.upsert({
            accountId: byAccountId,
            targetServerId
        }, { transaction: t });
    }));
}
exports.addServerInBlocklist = addServerInBlocklist;
function removeAccountFromBlocklist(accountBlock) {
    return database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
        return accountBlock.destroy({ transaction: t });
    }));
}
exports.removeAccountFromBlocklist = removeAccountFromBlocklist;
function removeServerFromBlocklist(serverBlock) {
    return database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
        return serverBlock.destroy({ transaction: t });
    }));
}
exports.removeServerFromBlocklist = removeServerFromBlocklist;
