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
const lodash_1 = require("lodash");
const logger_1 = require("../../../helpers/logger");
const utils_1 = require("../../../helpers/utils");
const initializers_1 = require("../../../initializers");
const video_comment_1 = require("../../../lib/video-comment");
const middlewares_1 = require("../../../middlewares");
const validators_1 = require("../../../middlewares/validators");
const video_comment_2 = require("../../../models/video/video-comment");
const audit_logger_1 = require("../../../helpers/audit-logger");
const account_1 = require("../../../models/account/account");
const notifier_1 = require("../../../lib/notifier");
const hooks_1 = require("../../../lib/plugins/hooks");
const send_1 = require("../../../lib/activitypub/send");
const auditLogger = audit_logger_1.auditLoggerFactory('comments');
const videoCommentRouter = express.Router();
exports.videoCommentRouter = videoCommentRouter;
videoCommentRouter.get('/:videoId/comment-threads', middlewares_1.paginationValidator, validators_1.videoCommentThreadsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(validators_1.listVideoCommentThreadsValidator), middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(listVideoThreads));
videoCommentRouter.get('/:videoId/comment-threads/:threadId', middlewares_1.asyncMiddleware(validators_1.listVideoThreadCommentsValidator), middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(listVideoThreadComments));
videoCommentRouter.post('/:videoId/comment-threads', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.addVideoCommentThreadValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoCommentThread));
videoCommentRouter.post('/:videoId/comments/:commentId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.addVideoCommentReplyValidator), middlewares_1.asyncRetryTransactionMiddleware(addVideoCommentReply));
videoCommentRouter.delete('/:videoId/comments/:commentId', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.removeVideoCommentValidator), middlewares_1.asyncRetryTransactionMiddleware(removeVideoComment));
function listVideoThreads(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const user = res.locals.oauth ? res.locals.oauth.token.User : undefined;
        let resultList;
        if (video.commentsEnabled === true) {
            const apiOptions = yield hooks_1.Hooks.wrapObject({
                videoId: video.id,
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
                data: []
            };
        }
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function listVideoThreadComments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = res.locals.onlyVideo;
        const user = res.locals.oauth ? res.locals.oauth.token.User : undefined;
        let resultList;
        if (video.commentsEnabled === true) {
            const apiOptions = yield hooks_1.Hooks.wrapObject({
                videoId: video.id,
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
        return res.json(video_comment_1.buildFormattedCommentTree(resultList));
    });
}
function addVideoCommentThread(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoCommentInfo = req.body;
        const comment = yield initializers_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
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
        return res.json({
            comment: comment.toFormattedJSON()
        }).end();
    });
}
function addVideoCommentReply(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoCommentInfo = req.body;
        const comment = yield initializers_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
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
        return res.json({ comment: comment.toFormattedJSON() }).end();
    });
}
function removeVideoComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoCommentInstance = res.locals.videoCommentFull;
        const videoCommentInstanceBefore = lodash_1.cloneDeep(videoCommentInstance);
        yield initializers_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
            if (videoCommentInstance.isOwned() || videoCommentInstance.Video.isOwned()) {
                yield send_1.sendDeleteVideoComment(videoCommentInstance, t);
            }
            video_comment_1.markCommentAsDeleted(videoCommentInstance);
            yield videoCommentInstance.save();
        }));
        auditLogger.delete(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.CommentAuditView(videoCommentInstance.toFormattedJSON()));
        logger_1.logger.info('Video comment %d deleted.', videoCommentInstance.id);
        hooks_1.Hooks.runAction('action:api.video-comment.deleted', { comment: videoCommentInstanceBefore });
        return res.type('json').status(204).end();
    });
}
