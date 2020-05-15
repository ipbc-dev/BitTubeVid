"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../utils");
const constants_1 = require("@server/initializers/constants");
const apPaginationValidator = [
    express_validator_1.query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Should have a valid page number'),
    express_validator_1.query('size')
        .optional()
        .isInt({ min: 0, max: constants_1.PAGINATION.OUTBOX.COUNT.MAX }).withMessage(`Should have a valid page size (max: ${constants_1.PAGINATION.OUTBOX.COUNT.MAX})`),
    (req, res, next) => {
        logger_1.logger.debug('Checking pagination parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.apPaginationValidator = apPaginationValidator;
