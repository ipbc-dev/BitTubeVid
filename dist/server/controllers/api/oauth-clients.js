"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthClientsRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const logger_1 = require("../../helpers/logger");
const config_1 = require("../../initializers/config");
const middlewares_1 = require("../../middlewares");
const oauth_client_1 = require("../../models/oauth/oauth-client");
const oauthClientsRouter = express.Router();
exports.oauthClientsRouter = oauthClientsRouter;
oauthClientsRouter.get('/local', middlewares_1.asyncMiddleware(getLocalClient));
function getLocalClient(req, res, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverHostname = config_1.CONFIG.WEBSERVER.HOSTNAME;
        const serverPort = config_1.CONFIG.WEBSERVER.PORT;
        let headerHostShouldBe = serverHostname;
        if (serverPort !== 80 && serverPort !== 443) {
            headerHostShouldBe += ':' + serverPort;
        }
        if (process.env.NODE_ENV !== 'test' && req.get('host') !== headerHostShouldBe) {
            logger_1.logger.info('Getting client tokens for host %s is forbidden (expected %s).', req.get('host'), headerHostShouldBe);
            return res.type('json').status(403).end();
        }
        const client = yield oauth_client_1.OAuthClientModel.loadFirstClient();
        if (!client)
            throw new Error('No client available.');
        const json = {
            client_id: client.clientId,
            client_secret: client.clientSecret
        };
        return res.json(json);
    });
}
