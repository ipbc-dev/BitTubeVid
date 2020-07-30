"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactAdministratorValidator = exports.serverGetValidator = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("./utils");
const servers_1 = require("../../helpers/custom-validators/servers");
const server_1 = require("../../models/server/server");
const express_validator_1 = require("express-validator");
const users_1 = require("../../helpers/custom-validators/users");
const redis_1 = require("../../lib/redis");
const config_1 = require("../../initializers/config");
const serverGetValidator = [
    express_validator_1.body('host').custom(servers_1.isHostValid).withMessage('Should have a valid host'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking serverGetValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        const server = yield server_1.ServerModel.loadByHost(req.body.host);
        if (!server) {
            return res.status(404)
                .send({ error: 'Server host not found.' })
                .end();
        }
        res.locals.server = server;
        return next();
    })
];
exports.serverGetValidator = serverGetValidator;
const contactAdministratorValidator = [
    express_validator_1.body('fromName')
        .custom(users_1.isUserDisplayNameValid).withMessage('Should have a valid name'),
    express_validator_1.body('fromEmail')
        .isEmail().withMessage('Should have a valid email'),
    express_validator_1.body('body')
        .custom(servers_1.isValidContactBody).withMessage('Should have a valid body'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking contactAdministratorValidator parameters', { parameters: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (config_1.CONFIG.CONTACT_FORM.ENABLED === false) {
            return res
                .status(409)
                .send({ error: 'Contact form is not enabled on this instance.' })
                .end();
        }
        if (config_1.isEmailEnabled() === false) {
            return res
                .status(409)
                .send({ error: 'Emailer is not enabled on this instance.' })
                .end();
        }
        if (yield redis_1.Redis.Instance.doesContactFormIpExist(req.ip)) {
            logger_1.logger.info('Refusing a contact form by %s: already sent one recently.', req.ip);
            return res
                .status(403)
                .send({ error: 'You already sent a contact form recently.' })
                .end();
        }
        return next();
    })
];
exports.contactAdministratorValidator = contactAdministratorValidator;
