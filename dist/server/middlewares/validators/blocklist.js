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
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const account_blocklist_1 = require("../../models/account/account-blocklist");
const servers_1 = require("../../helpers/custom-validators/servers");
const server_blocklist_1 = require("../../models/server/server-blocklist");
const server_1 = require("../../models/server/server");
const utils_2 = require("../../helpers/utils");
const constants_1 = require("../../initializers/constants");
const middlewares_1 = require("../../helpers/middlewares");
const blockAccountValidator = [
    express_validator_1.body('accountName').exists().withMessage('Should have an account name with host'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking blockAccountByAccountValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountNameWithHostExist(req.body.accountName, res)))
            return;
        const user = res.locals.oauth.token.User;
        const accountToBlock = res.locals.account;
        if (user.Account.id === accountToBlock.id) {
            res.status(409)
                .send({ error: 'You cannot block yourself.' })
                .end();
            return;
        }
        return next();
    })
];
exports.blockAccountValidator = blockAccountValidator;
const unblockAccountByAccountValidator = [
    express_validator_1.param('accountName').exists().withMessage('Should have an account name with host'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking unblockAccountByAccountValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountNameWithHostExist(req.params.accountName, res)))
            return;
        const user = res.locals.oauth.token.User;
        const targetAccount = res.locals.account;
        if (!(yield doesUnblockAccountExist(user.Account.id, targetAccount.id, res)))
            return;
        return next();
    })
];
exports.unblockAccountByAccountValidator = unblockAccountByAccountValidator;
const unblockAccountByServerValidator = [
    express_validator_1.param('accountName').exists().withMessage('Should have an account name with host'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking unblockAccountByServerValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountNameWithHostExist(req.params.accountName, res)))
            return;
        const serverActor = yield utils_2.getServerActor();
        const targetAccount = res.locals.account;
        if (!(yield doesUnblockAccountExist(serverActor.Account.id, targetAccount.id, res)))
            return;
        return next();
    })
];
exports.unblockAccountByServerValidator = unblockAccountByServerValidator;
const blockServerValidator = [
    express_validator_1.body('host').custom(servers_1.isHostValid).withMessage('Should have a valid host'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking serverGetValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const host = req.body.host;
        if (host === constants_1.WEBSERVER.HOST) {
            return res.status(409)
                .send({ error: 'You cannot block your own server.' })
                .end();
        }
        const server = yield server_1.ServerModel.loadByHost(host);
        if (!server) {
            return res.status(404)
                .send({ error: 'Server host not found.' })
                .end();
        }
        res.locals.server = server;
        return next();
    })
];
exports.blockServerValidator = blockServerValidator;
const unblockServerByAccountValidator = [
    express_validator_1.param('host').custom(servers_1.isHostValid).withMessage('Should have an account name with host'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking unblockServerByAccountValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const user = res.locals.oauth.token.User;
        if (!(yield doesUnblockServerExist(user.Account.id, req.params.host, res)))
            return;
        return next();
    })
];
exports.unblockServerByAccountValidator = unblockServerByAccountValidator;
const unblockServerByServerValidator = [
    express_validator_1.param('host').custom(servers_1.isHostValid).withMessage('Should have an account name with host'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking unblockServerByServerValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const serverActor = yield utils_2.getServerActor();
        if (!(yield doesUnblockServerExist(serverActor.Account.id, req.params.host, res)))
            return;
        return next();
    })
];
exports.unblockServerByServerValidator = unblockServerByServerValidator;
function doesUnblockAccountExist(accountId, targetAccountId, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountBlock = yield account_blocklist_1.AccountBlocklistModel.loadByAccountAndTarget(accountId, targetAccountId);
        if (!accountBlock) {
            res.status(404)
                .send({ error: 'Account block entry not found.' })
                .end();
            return false;
        }
        res.locals.accountBlock = accountBlock;
        return true;
    });
}
function doesUnblockServerExist(accountId, host, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverBlock = yield server_blocklist_1.ServerBlocklistModel.loadByAccountAndHost(accountId, host);
        if (!serverBlock) {
            res.status(404)
                .send({ error: 'Server block entry not found.' })
                .end();
            return false;
        }
        res.locals.serverBlock = serverBlock;
        return true;
    });
}
