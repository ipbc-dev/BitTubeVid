"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUserHasRight = void 0;
const logger_1 = require("../helpers/logger");
function ensureUserHasRight(userRight) {
    return function (req, res, next) {
        const user = res.locals.oauth.token.user;
        if (user.hasRight(userRight) === false) {
            const message = `User ${user.username} does not have right ${userRight} to access to ${req.path}.`;
            logger_1.logger.info(message);
            return res.status(403).json({ error: message });
        }
        return next();
    };
}
exports.ensureUserHasRight = ensureUserHasRight;
