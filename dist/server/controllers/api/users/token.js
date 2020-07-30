"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokensRouter = void 0;
const auth_1 = require("@server/lib/auth");
const RateLimit = require("express-rate-limit");
const config_1 = require("@server/initializers/config");
const express = require("express");
const hooks_1 = require("@server/lib/plugins/hooks");
const middlewares_1 = require("@server/middlewares");
const tokensRouter = express.Router();
exports.tokensRouter = tokensRouter;
const loginRateLimiter = RateLimit({
    windowMs: config_1.CONFIG.RATES_LIMIT.LOGIN.WINDOW_MS,
    max: config_1.CONFIG.RATES_LIMIT.LOGIN.MAX
});
tokensRouter.post('/token', loginRateLimiter, auth_1.handleLogin, tokenSuccess);
tokensRouter.post('/revoke-token', middlewares_1.authenticate, middlewares_1.asyncMiddleware(auth_1.handleTokenRevocation));
function tokenSuccess(req) {
    const username = req.body.username;
    hooks_1.Hooks.runAction('action:api.user.oauth2-got-token', { username, ip: req.ip });
}
