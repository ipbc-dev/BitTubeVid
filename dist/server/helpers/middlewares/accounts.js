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
const account_1 = require("../../models/account/account");
function doesAccountIdExist(id, res, sendNotFound = true) {
    const promise = account_1.AccountModel.load(id);
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
    return __awaiter(this, void 0, void 0, function* () {
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
