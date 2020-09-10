"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesAccountExist = exports.doesAccountNameWithHostExist = exports.doesLocalAccountNameExist = exports.doesAccountIdExist = void 0;
const tslib_1 = require("tslib");
const account_1 = require("../../models/account/account");
function doesAccountIdExist(id, res, sendNotFound = true) {
    const promise = account_1.AccountModel.load(parseInt(id + '', 10));
    return doesAccountExist(promise, res, sendNotFound);
}
exports.doesAccountIdExist = doesAccountIdExist;
function doesLocalAccountNameExist(name, res, sendNotFound = true) {
    const promise = account_1.AccountModel.loadLocalByName(name);
    return doesAccountExist(promise, res, sendNotFound);
}
exports.doesLocalAccountNameExist = doesLocalAccountNameExist;
function doesAccountNameWithHostExist(nameWithDomain, res, sendNotFound = true) {
    const promise = account_1.AccountModel.loadByNameWithHost(nameWithDomain);
    return doesAccountExist(promise, res, sendNotFound);
}
exports.doesAccountNameWithHostExist = doesAccountNameWithHostExist;
function doesAccountExist(p, res, sendNotFound) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const account = yield p;
        if (!account) {
            if (sendNotFound === true) {
                res.status(404)
                    .send({ error: 'Account not found' })
                    .end();
            }
            return false;
        }
        res.locals.account = account;
        return true;
    });
}
exports.doesAccountExist = doesAccountExist;
