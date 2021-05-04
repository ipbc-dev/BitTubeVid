"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webfingerRouter = void 0;
const cors = require("cors");
const express = require("express");
const constants_1 = require("@server/initializers/constants");
const middlewares_1 = require("../middlewares");
const validators_1 = require("../middlewares/validators");
const webfingerRouter = express.Router();
exports.webfingerRouter = webfingerRouter;
webfingerRouter.use(cors());
webfingerRouter.get('/.well-known/webfinger', middlewares_1.asyncMiddleware(validators_1.webfingerValidator), webfingerController);
function webfingerController(req, res) {
    const actor = res.locals.actorUrl;
    const json = {
        subject: req.query.resource,
        aliases: [actor.url],
        links: [
            {
                rel: 'self',
                type: 'application/activity+json',
                href: actor.url
            },
            {
                rel: 'http://ostatus.org/schema/1.0/subscribe',
                template: constants_1.WEBSERVER.URL + '/remote-interaction?uri={uri}'
            }
        ]
    };
    return res.json(json);
}