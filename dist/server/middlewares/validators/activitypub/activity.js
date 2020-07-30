"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityPubValidator = void 0;
const tslib_1 = require("tslib");
const activity_1 = require("../../../helpers/custom-validators/activitypub/activity");
const logger_1 = require("../../../helpers/logger");
const application_1 = require("@server/models/application/application");
function activityPubValidator(req, res, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.debug('Checking activity pub parameters');
        if (!activity_1.isRootActivityValid(req.body)) {
            logger_1.logger.warn('Incorrect activity parameters.', { activity: req.body });
            return res.status(400).json({ error: 'Incorrect activity.' });
        }
        const serverActor = yield application_1.getServerActor();
        const remoteActor = res.locals.signature.actor;
        if (serverActor.id === remoteActor.id) {
            logger_1.logger.error('Receiving request in INBOX by ourselves!', req.body);
            return res.status(409).end();
        }
        return next();
    });
}
exports.activityPubValidator = activityPubValidator;
