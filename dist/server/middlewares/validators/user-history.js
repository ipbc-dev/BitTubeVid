"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const misc_1 = require("../../helpers/custom-validators/misc");
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
