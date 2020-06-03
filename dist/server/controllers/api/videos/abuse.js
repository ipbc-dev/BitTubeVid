"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const shared_1 = require("../../../../shared");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const database_1 = require("../../../initializers/database");
const middlewares_1 = require("../../../middlewares");
const account_1 = require("../../../models/account/account");
const video_abuse_1 = require("../../../models/video/video-abuse");
const audit_logger_1 = require("../../../helpers/audit-logger");
const notifier_1 = require("../../../lib/notifier");
const send_flag_1 = require("../../../lib/activitypub/send/send-flag");
const application_1 = require("@server/models/application/application");
const auditLogger = audit_logger_1.auditLoggerFactory('abuse');
const abuseVideoRouter = express.Router();
exports.abuseVideoRouter = abuseVideoRouter;
abuseVideoRouter.get('/abuse', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_ABUSES), middlewares_1.paginationValidator, middlewares_1.videoAbusesSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.videoAbuseListValidator, middlewares_1.asyncMiddleware(listVideoAbuses));
abuseVideoRouter.put('/:videoId/abuse/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_ABUSES), middlewares_1.asyncMiddleware(middlewares_1.videoAbuseUpdateValidator), middlewares_1.asyncRetryTransactionMiddleware(updateVideoAbuse));
abuseVideoRouter.post('/:videoId/abuse', middlewares_1.authenticate, middlewares_1.asyncMiddleware(middlewares_1.videoAbuseReportValidator), middlewares_1.asyncRetryTransactionMiddleware(reportVideoAbuse));
abuseVideoRouter.delete('/:videoId/abuse/:id', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_VIDEO_ABUSES), middlewares_1.asyncMiddleware(middlewares_1.videoAbuseGetValidator), middlewares_1.asyncRetryTransactionMiddleware(deleteVideoAbuse));
function listVideoAbuses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.user;
        const serverActor = yield application_1.getServerActor();
        const resultList = yield video_abuse_1.VideoAbuseModel.listForApi({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            id: req.query.id,
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
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function updateVideoAbuse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoAbuse = res.locals.videoAbuse;
        if (req.body.moderationComment !== undefined)
            videoAbuse.moderationComment = req.body.moderationComment;
        if (req.body.state !== undefined)
            videoAbuse.state = req.body.state;
        yield database_1.sequelizeTypescript.transaction(t => {
            return videoAbuse.save({ transaction: t });
        });
        return res.type('json').status(204).end();
    });
}
function deleteVideoAbuse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoAbuse = res.locals.videoAbuse;
        yield database_1.sequelizeTypescript.transaction(t => {
            return videoAbuse.destroy({ transaction: t });
        });
        return res.type('json').status(204).end();
    });
}
function reportVideoAbuse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoInstance = res.locals.videoAll;
        const body = req.body;
        let reporterAccount;
        let videoAbuseJSON;
        const videoAbuseInstance = yield database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            reporterAccount = yield account_1.AccountModel.load(res.locals.oauth.token.User.Account.id, t);
            const abuseToCreate = {
                reporterAccountId: reporterAccount.id,
                reason: body.reason,
                videoId: videoInstance.id,
                state: shared_1.VideoAbuseState.PENDING
            };
            const videoAbuseInstance = yield video_abuse_1.VideoAbuseModel.create(abuseToCreate, { transaction: t });
            videoAbuseInstance.Video = videoInstance;
            videoAbuseInstance.Account = reporterAccount;
            if (videoInstance.isOwned() === false) {
                yield send_flag_1.sendVideoAbuse(reporterAccount.Actor, videoAbuseInstance, videoInstance, t);
            }
            videoAbuseJSON = videoAbuseInstance.toFormattedJSON();
            auditLogger.create(reporterAccount.Actor.getIdentifier(), new audit_logger_1.VideoAbuseAuditView(videoAbuseJSON));
            return videoAbuseInstance;
        }));
        notifier_1.Notifier.Instance.notifyOnNewVideoAbuse({
            videoAbuse: videoAbuseJSON,
            videoAbuseInstance,
            reporter: reporterAccount.Actor.getIdentifier()
        });
        logger_1.logger.info('Abuse report for video %s created.', videoInstance.name);
        return res.json({ videoAbuse: videoAbuseJSON }).end();
    });
}
