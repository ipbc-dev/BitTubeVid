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
const webfinger_1 = require("../../helpers/custom-validators/webfinger");
const logger_1 = require("../../helpers/logger");
const actor_1 = require("../../models/activitypub/actor");
const utils_1 = require("./utils");
const express_utils_1 = require("../../helpers/express-utils");
const webfingerValidator = [
    express_validator_1.query('resource').custom(webfinger_1.isWebfingerLocalResourceValid).withMessage('Should have a valid webfinger resource'),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking webfinger parameters', { parameters: req.query });
        if (utils_1.areValidationErrors(req, res))
            return;
        const nameWithHost = express_utils_1.getHostWithPort(req.query.resource.substr(5));
        const [name] = nameWithHost.split('@');
        const actor = yield actor_1.ActorModel.loadLocalUrlByName(name);
        if (!actor) {
            return res.status(404)
                .send({ error: 'Actor not found' })
                .end();
        }
        res.locals.actorUrl = actor;
        return next();
    })
];
exports.webfingerValidator = webfingerValidator;
