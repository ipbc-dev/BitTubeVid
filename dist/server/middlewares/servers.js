"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBodyHostsPort = void 0;
const express_utils_1 = require("../helpers/express-utils");
const http_error_codes_1 = require("../../shared/core-utils/miscs/http-error-codes");
function setBodyHostsPort(req, res, next) {
    if (!req.body.hosts)
        return next();
    for (let i = 0; i < req.body.hosts.length; i++) {
        const hostWithPort = express_utils_1.getHostWithPort(req.body.hosts[i]);
        if (hostWithPort === null) {
            return res.sendStatus(http_error_codes_1.HttpStatusCode.INTERNAL_SERVER_ERROR_500);
        }
        req.body.hosts[i] = hostWithPort;
    }
    return next();
}
exports.setBodyHostsPort = setBodyHostsPort;
