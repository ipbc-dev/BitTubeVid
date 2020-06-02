"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const users_1 = require("../../helpers/custom-validators/users");
const utils_1 = require("./utils");
const constants_1 = require("../../initializers/constants");
const logger_1 = require("../../helpers/logger");
const express_utils_1 = require("../../helpers/express-utils");
const updateAvatarValidator = [
    express_validator_1.body('avatarfile').custom((value, { req }) => users_1.isAvatarFile(req.files)).withMessage('This file is not supported or too large. Please, make sure it is of the following type : ' +
        constants_1.CONSTRAINTS_FIELDS.ACTORS.AVATAR.EXTNAME.join(', ')),
    (req, res, next) => {
        logger_1.logger.debug('Checking updateAvatarValidator parameters', { files: req.files });
        if (utils_1.areValidationErrors(req, res))
            return express_utils_1.cleanUpReqFiles(req);
        return next();
    }
];
exports.updateAvatarValidator = updateAvatarValidator;
