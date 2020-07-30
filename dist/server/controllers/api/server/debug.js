"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugRouter = void 0;
const express = require("express");
const users_1 = require("../../../../shared/models/users");
const middlewares_1 = require("../../../middlewares");
const debugRouter = express.Router();
exports.debugRouter = debugRouter;
debugRouter.get('/debug', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_DEBUG), getDebug);
function getDebug(req, res) {
    return res.json({
        ip: req.ip
    }).end();
}
