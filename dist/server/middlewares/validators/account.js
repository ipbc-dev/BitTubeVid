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
const accounts_1 = require("../../helpers/custom-validators/accounts");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const middlewares_1 = require("../../helpers/middlewares");
const localAccountValidator = [
    express_validator_1.param('name').custom(accounts_1.isAccountNameValid).withMessage('Should have a valid account name'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking accountsNameWithHostGetValidator parameters', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesAccountNameWithHostExist(req.params.accountName, res)))
            return;
        return next();
    })
];
exports.accountNameWithHostGetValidator = accountNameWithHostGetValidator;
