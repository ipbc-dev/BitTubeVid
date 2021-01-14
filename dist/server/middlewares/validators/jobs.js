"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listJobsValidator = void 0;
const express_validator_1 = require("express-validator");
const jobs_1 = require("../../helpers/custom-validators/jobs");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const listJobsValidator = [
    express_validator_1.param('state')
        .optional()
        .custom(jobs_1.isValidJobState).not().isEmpty().withMessage('Should have a valid job state'),
    express_validator_1.query('jobType')
        .optional()
        .custom(jobs_1.isValidJobType).withMessage('Should have a valid job state'),
    (req, res, next) => {
        logger_1.logger.debug('Checking listJobsValidator parameters.', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        return next();
    }
];
exports.listJobsValidator = listJobsValidator;
