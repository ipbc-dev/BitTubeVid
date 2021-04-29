"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoCommentRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const audit_logger_1 = require("../../../helpers/audit-logger");
const utils_1 = require("../../../helpers/utils");
const database_1 = require("../../../initializers/database");
const notifier_1 = require("../../../lib/notifier");
const hooks_1 = require("../../../lib/plugins/hooks");
const video_comment_1 = require("../../../lib/video-comment");
const middlewares_1 = require("../../../middlewares");
const validators_1 = require("../../../middlewares/validators");
const account_1 = require("../../../models/account/account");
const video_comment_2 = require("../../../models/video/video-comment");
const auditLogger = audit_logger_1.auditLoggerFactory('comments');
const videoCommentRouter = express.Router();
exports.videoCommentRouter = videoCommentRouter;
videoCommentRouter.get('/:videoId/comment-threads', middlewares_1.paginationValidator, validators_1.videoCommentThreadsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(validators_1.listVideoCommentThreadsValidator), middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(listVideoThreads));
videoCommentRouter.get('/:videoId/comment-threads/:threadId', middlewares_1.asyncMiddleware(validators_1.listVideoThreadCommentsValidator), middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(listVideoThreadComments));
videoCommentRouter.post('/:videoId/comment-threads', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.addVideoCommentThreadValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoCommentThread));
videoCommentRouter.post('/:videoId/comments/:commentId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.addVideoCommentReplyValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoCommentReply));
videoCommentRouter.delete('/:videoId/comments/:commentId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.removeVideoCommentValidator), middlewares_1.asyncRetryTransactionMiddleware(removeVideoComment));
videoCommentRouter.get('/comments', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(20), middlewares_1.paginationValidator, validators_1.videoCommentsValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, validators_1.listVideoCommentsValidator, middlewares_1.asyncMiddleware(listComments));
function listComments(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = {
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            isLocal: req.query.isLocal,
            search: req.query.search,
            searchAccount: req.query.searchAccount,
            searchVideo: req.query.searchVideo
        };
        const resultList = yield video_comment_2.VideoCommentModel.listCommentsForApi(options);
        return res.json({
            total: resultList.total,
            data: resultList.data.map(c => c.toFormattedAdminJSON())
        });
    });
}
function listVideoThreads(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const user = res.locals.oauth ? res.locals.oauth.token.User : undefined;
        let resultList;
        if (video.commentsEnabled === true) {
            const apiOptions = yield hooks_1.Hooks.wrapObject({
                videoId: video.id,
                isVideoOwned: video.isOwned(),
                start: req.query.start,
                count: req.query.count,
                sort: req.query.sort,
                user
            }, 'filter:api.video-threads.list.params');
            resultList = yield hooks_1.Hooks.wrapPromiseFun(video_comment_2.VideoCommentModel.listThreadsForApi, apiOptions, 'filter:api.video-threads.list.result');
        }
        else {
            resultList = {
                total: 0,
                totalNotDeletedComments: 0,
                data: []
            };
        }
        return res.json(Object.assign(Object.assign({}, utils_1.getFormattedObjects(resultList.data, resultList.total)), { totalNotDeletedComments: resultList.totalNotDeletedComments }));
    });
}
function listVideoThreadComments(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const user = res.locals.oauth ? res.locals.oauth.token.User : undefined;
        let resultList;
        if (video.commentsEnabled === true) {
            const apiOptions = yield hooks_1.Hooks.wrapObject({
                videoId: video.id,
                isVideoOwned: video.isOwned(),
                threadId: res.locals.videoCommentThread.id,
                user
            }, 'filter:api.video-thread-comments.list.params');
            resultList = yield hooks_1.Hooks.wrapPromiseFun(video_comment_2.VideoCommentModel.listThreadCommentsForApi, apiOptions, 'filter:api.video-thread-comments.list.result');
        }
        else {
            resultList = {
                total: 0,
                data: []
            };
        }
        if (resultList.data.length === 0) {
            return res.sendStatus(http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
        }
        return res.json(video_comment_1.buildFormattedCommentTree(resultList));
    });
}
function addVideoCommentThread(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoCommentInfo = req.body;
        const comment = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const account = yield account_1.AccountModel.load(res.locals.oauth.token.User.Account.id, t);
            return video_comment_1.createVideoComment({
                text: videoCommentInfo.text,
                inReplyToComment: null,
                video: res.locals.videoAll,
                account
            }, t);
        }));
        notifier_1.Notifier.Instance.notifyOnNewComment(comment);
        auditLogger.create(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.CommentAuditView(comment.toFormattedJSON()));
        hooks_1.Hooks.runAction('action:api.video-thread.created', { comment });
        return res.json({ comment: comment.toFormattedJSON() });
    });
}
function addVideoCommentReply(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoCommentInfo = req.body;
        const comment = yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const account = yield account_1.AccountModel.load(res.locals.oauth.token.User.Account.id, t);
            return video_comment_1.createVideoComment({
                text: videoCommentInfo.text,
                inReplyToComment: res.locals.videoCommentFull,
                video: res.locals.videoAll,
                account
            }, t);
        }));
        notifier_1.Notifier.Instance.notifyOnNewComment(comment);
        auditLogger.create(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.CommentAuditView(comment.toFormattedJSON()));
        hooks_1.Hooks.runAction('action:api.video-comment-reply.created', { comment });
        return res.json({ comment: comment.toFormattedJSON() });
    });
}
function removeVideoComment(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoCommentInstance = res.locals.videoCommentFull;
        yield video_comment_1.removeComment(videoCommentInstance);
        auditLogger.delete(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.CommentAuditView(videoCommentInstance.toFormattedJSON()));
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
