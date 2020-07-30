"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unblockServerByServerValidator = exports.unblockAccountByServerValidator = exports.unblockServerByAccountValidator = exports.unblockAccountByAccountValidator = exports.blockAccountValidator = exports.blockServerValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const account_blocklist_1 = require("../../models/account/account-blocklist");
const servers_1 = require("../../helpers/custom-validators/servers");
const server_blocklist_1 = require("../../models/server/server-blocklist");
const server_1 = require("../../models/server/server");
const constants_1 = require("../../initializers/constants");
const middlewares_1 = require("../../helpers/middlewares");
const application_1 = require("@server/models/application/application");
const blockAccountValidator = [
    express_validator_1.body('accountName').exists().withMessage('Should have an account name with host'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking blockAccountByAccountValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountNameWithHostExist(req.body.accountName, res)))
            return;
        const user = res.locals.oauth.token.User;
        const accountToBlock = res.locals.account;
        if (user.Account.id === accountToBlock.id) {
            res.status(409)
                .json({ error: 'You cannot block yourself.' });
            return;
        }
        return next();
    })
];
exports.blockAccountValidator = blockAccountValidator;
const unblockAccountByAccountValidator = [
    express_validator_1.param('accountName').exists().withMessage('Should have an account name with host'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
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
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking unblockAccountByServerValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountNameWithHostExist(req.params.accountName, res)))
            return;
        const serverActor = yield application_1.getServerActor();
        const targetAccount = res.locals.account;
        if (!(yield doesUnblockAccountExist(serverActor.Account.id, targetAccount.id, res)))
            return;
        return next();
    })
];
exports.unblockAccountByServerValidator = unblockAccountByServerValidator;
const blockServerValidator = [
    express_validator_1.body('host').custom(servers_1.isHostValid).withMessage('Should have a valid host'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking serverGetValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const host = req.body.host;
        if (host === constants_1.WEBSERVER.HOST) {
            return res.status(409)
                .json({ error: 'You cannot block your own server.' });
        }
        const server = yield server_1.ServerModel.loadOrCreateByHost(host);
        res.locals.server = server;
        return next();
    })
];
exports.blockServerValidator = blockServerValidator;
const unblockServerByAccountValidator = [
    express_validator_1.param('host').custom(servers_1.isHostValid).withMessage('Should have an account name with host'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
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
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking unblockServerByServerValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        const serverActor = yield application_1.getServerActor();
        if (!(yield doesUnblockServerExist(serverActor.Account.id, req.params.host, res)))
            return;
        return next();
    })
];
exports.unblockServerByServerValidator = unblockServerByServerValidator;
function doesUnblockAccountExist(accountId, targetAccountId, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const accountBlock = yield account_blocklist_1.AccountBlocklistModel.loadByAccountAndTarget(accountId, targetAccountId);
        if (!accountBlock) {
            res.status(404)
                .json({ error: 'Account block entry not found.' });
            return false;
        }
        res.locals.accountBlock = accountBlock;
        return true;
    });
}
function doesUnblockServerExist(accountId, host, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverBlock = yield server_blocklist_1.ServerBlocklistModel.loadByAccountAndHost(accountId, host);
        if (!serverBlock) {
            res.status(404)
                .json({ error: 'Server block entry not found.' });
            return false;
        }
        res.locals.serverBlock = serverBlock;
        return true;
    });
}
