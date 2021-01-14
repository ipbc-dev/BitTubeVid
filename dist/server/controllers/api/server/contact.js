"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const middlewares_1 = require("../../../middlewares");
const redis_1 = require("../../../lib/redis");
const emailer_1 = require("../../../lib/emailer");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const contactRouter = express.Router();
exports.contactRouter = contactRouter;
contactRouter.post('/contact', middlewares_1.asyncMiddleware(middlewares_1.contactAdministratorValidator), middlewares_1.asyncMiddleware(contactAdministrator));
function contactAdministrator(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const data = req.body;
        yield emailer_1.Emailer.Instance.addContactFormJob(data.fromEmail, data.fromName, data.subject, data.body);
        yield redis_1.Redis.Instance.setContactFormIp(req.ip);
        return res.status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204).end();
    });
}
