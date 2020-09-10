"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abuseVideoRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const abuse_1 = require("@server/models/abuse/abuse");
const application_1 = require("@server/models/application/application");
const middlewares_1 = require("../../../middlewares");
const abuse_2 = require("../abuse");
const abuseVideoRouter = express.Router();
exports.abuseVideoRouter = abuseVideoRouter;
abuseVideoRouter.get('/abuse', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(6), middlewares_1.paginationValidator, middlewares_1.abusesSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.videoAbuseListValidator, middlewares_1.asyncMiddleware(listVideoAbuses));
abuseVideoRouter.put('/:videoId/abuse/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(6), middlewares_1.asyncMiddleware(middlewares_1.videoAbuseUpdateValidator), middlewares_1.asyncRetryTransactionMiddleware(updateVideoAbuse));
abuseVideoRouter.post('/:videoId/abuse', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoAbuseReportValidator), middlewares_1.asyncRetryTransactionMiddleware(reportVideoAbuse));
abuseVideoRouter.delete('/:videoId/abuse/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(6), middlewares_1.asyncMiddleware(middlewares_1.videoAbuseGetValidator), middlewares_1.asyncRetryTransactionMiddleware(deleteVideoAbuse));
function listVideoAbuses(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.user;
        const serverActor = yield application_1.getServerActor();
        const resultList = yield abuse_1.AbuseModel.listForAdminApi({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            id: req.query.id,
            filter: 'video',
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
function updateVideoAbuse(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return abuse_2.updateAbuse(req, res);
    });
}
function deleteVideoAbuse(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return abuse_2.deleteAbuse(req, res);
    });
}
function reportVideoAbuse(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const oldBody = req.body;
        req.body = {
            accountId: res.locals.videoAll.VideoChannel.accountId,
            reason: oldBody.reason,
            predefinedReasons: oldBody.predefinedReasons,
            video: {
                id: res.locals.videoAll.id,
                startAt: oldBody.startAt,
                endAt: oldBody.endAt
            }
        };
        return abuse_2.reportAbuse(req, res);
    });
}
