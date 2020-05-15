"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OAuthServer = require("express-oauth-server");
const constants_1 = require("../initializers/constants");
const logger_1 = require("../helpers/logger");
const oauth_model_1 = require("../lib/oauth-model");
const oAuthServer = new OAuthServer({
    useErrorHandler: true,
    accessTokenLifetime: constants_1.OAUTH_LIFETIME.ACCESS_TOKEN,
    refreshTokenLifetime: constants_1.OAUTH_LIFETIME.REFRESH_TOKEN,
    continueMiddleware: true,
    model: require('../lib/oauth-model')
});
function authenticate(req, res, next, authenticateInQuery = false) {
    const options = authenticateInQuery ? { allowBearerTokensInQueryString: true } : {};
    oAuthServer.authenticate(options)(req, res, err => {
        if (err) {
            logger_1.logger.warn('Cannot authenticate.', { err });
            return res.status(err.status)
                .json({
                error: 'Token is invalid.',
                code: err.name
            })
                .end();
        }
        return next();
    });
}
exports.authenticate = authenticate;
function authenticateSocket(socket, next) {
    const accessToken = socket.handshake.query.accessToken;
    logger_1.logger.debug('Checking socket access token %s.', accessToken);
    if (!accessToken)
        return next(new Error('No access token provided'));
    oauth_model_1.getAccessToken(accessToken)
        .then(tokenDB => {
        const now = new Date();
        if (!tokenDB || tokenDB.accessTokenExpiresAt < now || tokenDB.refreshTokenExpiresAt < now) {
            return next(new Error('Invalid access token.'));
        }
        socket.handshake.query.user = tokenDB.User;
        return next();
    });
}
exports.authenticateSocket = authenticateSocket;
function authenticatePromiseIfNeeded(req, res, authenticateInQuery = false) {
    return new Promise(resolve => {
        if (res.locals.oauth && res.locals.oauth.token.User)
            return resolve();
        if (res.locals.authenticated === false)
            return res.sendStatus(401);
        authenticate(req, res, () => resolve(), authenticateInQuery);
    });
}
exports.authenticatePromiseIfNeeded = authenticatePromiseIfNeeded;
function optionalAuthenticate(req, res, next) {
    if (req.header('authorization'))
        return authenticate(req, res, next);
    res.locals.authenticated = false;
    return next();
}
exports.optionalAuthenticate = optionalAuthenticate;
function token(req, res, next) {
    return oAuthServer.token()(req, res, err => {
        if (err) {
            return res.status(err.status)
                .json({
                error: err.message,
                code: err.name
            })
                .end();
        }
        return next();
    });
}
exports.token = token;
