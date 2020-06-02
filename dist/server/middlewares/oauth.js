"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../helpers/logger");
const oauth_model_1 = require("../lib/oauth-model");
const auth_1 = require("@server/lib/auth");
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
    })
        .catch(err => logger_1.logger.error('Cannot get access token.', { err }));
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
