"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountNameWithHostGetValidator = exports.localAccountValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const accounts_1 = require("../../helpers/custom-validators/accounts");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const middlewares_1 = require("../../helpers/middlewares");
const localAccountValidator = [
    express_validator_1.param('name').custom(accounts_1.isAccountNameValid).withMessage('Should have a valid account name'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking localAccountValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesLocalAccountNameExist(req.params.name, res)))
            return;
        return next();
    })
];
exports.localAccountValidator = localAccountValidator;
const accountNameWithHostGetValidator = [
    express_validator_1.param('accountName').exists().withMessage('Should have an account name with host'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking accountsNameWithHostGetValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountNameWithHostExist(req.params.accountName, res)))
            return;
        return next();
    })
];
exports.accountNameWithHostGetValidator = accountNameWithHostGetValidator;
