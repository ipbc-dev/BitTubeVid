"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cors = require("cors");
const express = require("express");
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
            }
        ]
    };
    return res.json(json);
}
