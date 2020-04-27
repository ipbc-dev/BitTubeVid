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
const express = require("express");
const middlewares_1 = require("../../../middlewares");
const redis_1 = require("../../../lib/redis");
const emailer_1 = require("../../../lib/emailer");
const contactRouter = express.Router();
exports.contactRouter = contactRouter;
contactRouter.post('/contact', middlewares_1.asyncMiddleware(middlewares_1.contactAdministratorValidator), middlewares_1.asyncMiddleware(contactAdministrator));
function contactAdministrator(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = req.body;
        yield emailer_1.Emailer.Instance.addContactFormJob(data.fromEmail, data.fromName, data.subject, data.body);
        yield redis_1.Redis.Instance.setContactFormIp(req.ip);
        return res.status(204).end();
    });
}
