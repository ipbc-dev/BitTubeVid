"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportAbuse = exports.deleteAbuse = exports.updateAbuse = exports.listAbusesForAdmins = exports.abuseRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const logger_1 = require("@server/helpers/logger");
const moderation_1 = require("@server/lib/moderation");
const notifier_1 = require("@server/lib/notifier");
const abuse_1 = require("@server/models/abuse/abuse");
const abuse_message_1 = require("@server/models/abuse/abuse-message");
const application_1 = require("@server/models/application/application");
const abuse_2 = require("@shared/core-utils/abuse");
const utils_1 = require("../../helpers/utils");
const database_1 = require("../../initializers/database");
const middlewares_1 = require("../../middlewares");
const account_1 = require("../../models/account/account");
const abuseRouter = express.Router();
exports.abuseRouter = abuseRouter;
abuseRouter.get('/', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(6), middlewares_1.paginationValidator, middlewares_1.abusesSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.abuseListForAdminsValidator, middlewares_1.asyncMiddleware(listAbusesForAdmins));
abuseRouter.put('/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(6), middlewares_1.asyncMiddleware(middlewares_1.abuseUpdateValidator), middlewares_1.asyncRetryTransactionMiddleware(updateAbuse));
abuseRouter.post('/', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.abuseReportValidator), middlewares_1.asyncRetryTransactionMiddleware(reportAbuse));
abuseRouter.delete('/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(6), middlewares_1.asyncMiddleware(middlewares_1.abuseGetValidator), middlewares_1.asyncRetryTransactionMiddleware(deleteAbuse));
abuseRouter.get('/:id/messages', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.getAbuseValidator), middlewares_1.checkAbuseValidForMessagesValidator, middlewares_1.asyncRetryTransactionMiddleware(listAbuseMessages));
abuseRouter.post('/:id/messages', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.getAbuseValidator), middlewares_1.checkAbuseValidForMessagesValidator, middlewares_1.addAbuseMessageValidator, middlewares_1.asyncRetryTransactionMiddleware(addAbuseMessage));
abuseRouter.delete('/:id/messages/:messageId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.getAbuseValidator), middlewares_1.checkAbuseValidForMessagesValidator, middlewares_1.asyncMiddleware(middlewares_1.deleteAbuseMessageValidator), middlewares_1.asyncRetryTransactionMiddleware(deleteAbuseMessage));
function listAbusesForAdmins(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.user;
        const serverActor = yield application_1.getServerActor();
        const resultList = yield abuse_1.AbuseModel.listForAdminApi({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            id: req.query.id,
            filter: req.query.filter,
            predefinedReason: req.query.predefinedReason,
            search: req.query.search,
            state: req.query.state,
            videoIs: req.query.videoIs,
            searchReporter: req.query.searchReporter,
            searchReportee: req.query.searchReportee,
            searchVideo: req.query.searchVideo,
            searchVideoChannel: req.query.searchVideoChannel,
            serverAccountId: serverActor.Account.id,
            user
        });
        return res.json({
            total: resultList.total,
            data: resultList.data.map(d => d.toFormattedAdminJSON())
        });
    });
}
exports.listAbusesForAdmins = listAbusesForAdmins;
function updateAbuse(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuse = res.locals.abuse;
        let stateUpdated = false;
        if (req.body.moderationComment !== undefined)
            abuse.moderationComment = req.body.moderationComment;
        if (req.body.state !== undefined) {
            abuse.state = req.body.state;
            stateUpdated = true;
        }
        yield database_1.sequelizeTypescript.transaction(t => {
            return abuse.save({ transaction: t });
        });
        if (stateUpdated === true) {
            abuse_1.AbuseModel.loadFull(abuse.id)
                .then(abuseFull => notifier_1.Notifier.Instance.notifyOnAbuseStateChange(abuseFull))
                .catch(err => logger_1.logger.error('Cannot notify on abuse state change', { err }));
        }
        return res.sendStatus(204);
    });
}
exports.updateAbuse = updateAbuse;
function deleteAbuse(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuse = res.locals.abuse;
        yield database_1.sequelizeTypescript.transaction(t => {
            return abuse.destroy({ transaction: t });
        });
        return res.sendStatus(204);
    });
}
exports.deleteAbuse = deleteAbuse;
function reportAbuse(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        const commentInstance = res.locals.videoCommentFull;
        const accountInstance = res.locals.account;
        const body = req.body;
        const { id } = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            const reporterAccount = yield account_1.AccountModel.load(res.locals.oauth.token.User.Account.id, t);
            const predefinedReasons = (_a = body.predefinedReasons) === null || _a === void 0 ? void 0 : _a.map(r => abuse_2.abusePredefinedReasonsMap[r]);
            const baseAbuse = {
                reporterAccountId: reporterAccount.id,
                reason: body.reason,
                state: 1,
                predefinedReasons
            };
            if (body.video) {
                return moderation_1.createVideoAbuse({
                    baseAbuse,
                    videoInstance,
                    reporterAccount,
                    transaction: t,
                    startAt: body.video.startAt,
                    endAt: body.video.endAt
                });
            }
            if (body.comment) {
                return moderation_1.createVideoCommentAbuse({
                    baseAbuse,
                    commentInstance,
                    reporterAccount,
                    transaction: t
                });
            }
            return moderation_1.createAccountAbuse({
                baseAbuse,
                accountInstance,
                reporterAccount,
                transaction: t
            });
        }));
        return res.json({ abuse: { id } });
    });
}
exports.reportAbuse = reportAbuse;
function listAbuseMessages(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuse = res.locals.abuse;
        const resultList = yield abuse_message_1.AbuseMessageModel.listForApi(abuse.id);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function addAbuseMessage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuse = res.locals.abuse;
        const user = res.locals.oauth.token.user;
        const abuseMessage = yield abuse_message_1.AbuseMessageModel.create({
            message: req.body.message,
            byModerator: abuse.reporterAccountId !== user.Account.id,
            accountId: user.Account.id,
            abuseId: abuse.id
        });
        abuse_1.AbuseModel.loadFull(abuse.id)
            .then(abuseFull => notifier_1.Notifier.Instance.notifyOnAbuseMessage(abuseFull, abuseMessage))
            .catch(err => logger_1.logger.error('Cannot notify on new abuse message', { err }));
        return res.json({
            abuseMessage: {
                id: abuseMessage.id
            }
        });
    });
}
function deleteAbuseMessage(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const abuseMessage = res.locals.abuseMessage;
        yield database_1.sequelizeTypescript.transaction(t => {
            return abuseMessage.destroy({ transaction: t });
        });
        return res.sendStatus(204);
    });
}
