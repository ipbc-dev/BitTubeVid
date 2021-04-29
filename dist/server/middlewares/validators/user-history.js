"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHistoryRemoveValidator = exports.userHistoryListValidator = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const misc_1 = require("../../helpers/custom-validators/misc");
const userHistoryListValidator = [
    express_validator_1.query('search')
        .optional()
        .custom(misc_1.exists).withMessage('Should have a valid search'),
    (req, res, next) => {
        logger_1.logger.debug('Checking userHistoryListValidator parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.userHistoryListValidator = userHistoryListValidator;
const userHistoryRemoveValidator = [
    express_validator_1.body('beforeDate')
        .optional()
        .custom(misc_1.isDateValid).withMessage('Should have a valid before date'),
    (req, res, next) => {
        logger_1.logger.debug('Checking userHistoryRemoveValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.userHistoryRemoveValidator = userHistoryRemoveValidator;
