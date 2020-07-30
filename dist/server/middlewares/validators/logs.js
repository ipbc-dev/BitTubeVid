"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogsValidator = exports.getLogsValidator = void 0;
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const misc_1 = require("../../helpers/custom-validators/misc");
const express_validator_1 = require("express-validator");
const logs_1 = require("../../helpers/custom-validators/logs");
const getLogsValidator = [
    express_validator_1.query('startDate')
        .custom(misc_1.isDateValid).withMessage('Should have a valid start date'),
    express_validator_1.query('level')
        .optional()
        .custom(logs_1.isValidLogLevel).withMessage('Should have a valid level'),
    express_validator_1.query('endDate')
        .optional()
        .custom(misc_1.isDateValid).withMessage('Should have a valid end date'),
    (req, res, next) => {
        logger_1.logger.debug('Checking getLogsValidator parameters.', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.getLogsValidator = getLogsValidator;
const getAuditLogsValidator = [
    express_validator_1.query('startDate')
        .custom(misc_1.isDateValid).withMessage('Should have a valid start date'),
    express_validator_1.query('endDate')
        .optional()
        .custom(misc_1.isDateValid).withMessage('Should have a valid end date'),
    (req, res, next) => {
        logger_1.logger.debug('Checking getAuditLogsValidator parameters.', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.getAuditLogsValidator = getAuditLogsValidator;
