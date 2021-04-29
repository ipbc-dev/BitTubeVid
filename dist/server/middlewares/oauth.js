"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticatePromiseIfNeeded = exports.authenticateSocket = exports.authenticate = void 0;
const auth_1 = require("@server/lib/auth");
const logger_1 = require("../helpers/logger");
const oauth_model_1 = require("../lib/oauth-model");
const http_error_codes_1 = require("../../shared/core-utils/miscs/http-error-codes");
function authenticate(req, res, next, authenticateInQuery = false) {
    const options = authenticateInQuery ? { allowBearerTokensInQueryString: true } : {};
    auth_1.oAuthServer.authenticate(options)(req, res, err => {
        if (err) {
            logger_1.logger.warn('Cannot authenticate.', { err });
            return res.status(err.status)
                .json({
                error: 'Token is invalid.',
                code: err.name
            })
                .end();
        }
        res.locals.authenticated = true;
        return next();
    });
}
exports.authenticate = authenticate;
function authenticateSocket(socket, next) {
    const accessToken = socket.handshake.query['accessToken'];
    logger_1.logger.debug('Checking socket access token %s.', accessToken);
    if (!accessToken)
        return next(new Error('No access token provided'));
    if (typeof accessToken !== 'string')
        return next(new Error('Access token is invalid'));
    oauth_model_1.getAccessToken(accessToken)
        .then(tokenDB => {
        const now = new Date();
        if (!tokenDB || tokenDB.accessTokenExpiresAt < now || tokenDB.refreshTokenExpiresAt < now) {
            return next(new Error('Invalid access token.'));
        }
        socket.handshake.auth.user = tokenDB.User;
        return next();
    })
        .catch(err => logger_1.logger.error('Cannot get access token.', { err }));
}
exports.authenticateSocket = authenticateSocket;
function authenticatePromiseIfNeeded(req, res, authenticateInQuery = false) {
    return new Promise(resolve => {
        var _a;
        if ((_a = res.locals.oauth) === null || _a === void 0 ? void 0 : _a.token.User)
            return resolve();
        if (res.locals.authenticated === false)
            return res.sendStatus(http_error_codes_1.HttpStatusCode.UNAUTHORIZED_401);
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
