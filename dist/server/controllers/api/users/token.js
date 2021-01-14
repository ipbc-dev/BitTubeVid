"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokensRouter = void 0;
const tslib_1 = require("tslib");
const auth_1 = require("@server/lib/auth");
const RateLimit = require("express-rate-limit");
const config_1 = require("@server/initializers/config");
const express = require("express");
const hooks_1 = require("@server/lib/plugins/hooks");
const middlewares_1 = require("@server/middlewares");
const uuid_1 = require("uuid");
const tokensRouter = express.Router();
exports.tokensRouter = tokensRouter;
const loginRateLimiter = RateLimit({
    windowMs: config_1.CONFIG.RATES_LIMIT.LOGIN.WINDOW_MS,
    max: config_1.CONFIG.RATES_LIMIT.LOGIN.MAX
});
tokensRouter.post('/token', loginRateLimiter, auth_1.handleLogin, tokenSuccess);
tokensRouter.post('/revoke-token', middlewares_1.authenticate, middlewares_1.asyncMiddleware(auth_1.handleTokenRevocation));
tokensRouter.get('/scoped-tokens', middlewares_1.authenticate, getScopedTokens);
tokensRouter.post('/scoped-tokens', middlewares_1.authenticate, middlewares_1.asyncMiddleware(renewScopedTokens));
function tokenSuccess(req) {
    const username = req.body.username;
    hooks_1.Hooks.runAction('action:api.user.oauth2-got-token', { username, ip: req.ip });
}
function getScopedTokens(req, res) {
    const user = res.locals.oauth.token.user;
    return res.json({
        feedToken: user.feedToken
    });
}
function renewScopedTokens(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.user;
        user.feedToken = uuid_1.v4();
        yield user.save();
        return res.json({
            feedToken: user.feedToken
        });
    });
}
