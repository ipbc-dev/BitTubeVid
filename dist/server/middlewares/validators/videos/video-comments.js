"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeVideoCommentValidator = exports.videoCommentGetValidator = exports.addVideoCommentReplyValidator = exports.addVideoCommentThreadValidator = exports.listVideoThreadCommentsValidator = exports.listVideoCommentThreadsValidator = void 0;
const tslib_1 = require("tslib");
const express_validator_1 = require("express-validator");
const misc_1 = require("../../../helpers/custom-validators/misc");
const video_comments_1 = require("../../../helpers/custom-validators/video-comments");
const logger_1 = require("../../../helpers/logger");
const middlewares_1 = require("../../../helpers/middlewares");
const moderation_1 = require("../../../lib/moderation");
const hooks_1 = require("../../../lib/plugins/hooks");
const utils_1 = require("../utils");
const listVideoCommentThreadsValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking listVideoCommentThreads parameters.', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res, 'only-video')))
            return;
        return next();
    })
];
exports.listVideoCommentThreadsValidator = listVideoCommentThreadsValidator;
const listVideoThreadCommentsValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.param('threadId').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid threadId'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking listVideoThreadComments parameters.', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res, 'only-video')))
            return;
        if (!(yield video_comments_1.doesVideoCommentThreadExist(req.params.threadId, res.locals.onlyVideo, res)))
            return;
        return next();
    })
];
exports.listVideoThreadCommentsValidator = listVideoThreadCommentsValidator;
const addVideoCommentThreadValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.body('text').custom(video_comments_1.isValidVideoCommentText).not().isEmpty().withMessage('Should have a valid comment text'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking addVideoCommentThread parameters.', { parameters: req.params, body: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!isVideoCommentsEnabled(res.locals.videoAll, res))
            return;
        if (!(yield isVideoCommentAccepted(req, res, res.locals.videoAll, false)))
            return;
        return next();
    })
];
exports.addVideoCommentThreadValidator = addVideoCommentThreadValidator;
const addVideoCommentReplyValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.param('commentId').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid commentId'),
    express_validator_1.body('text').custom(video_comments_1.isValidVideoCommentText).not().isEmpty().withMessage('Should have a valid comment text'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking addVideoCommentReply parameters.', { parameters: req.params, body: req.body });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!isVideoCommentsEnabled(res.locals.videoAll, res))
            return;
        if (!(yield video_comments_1.doesVideoCommentExist(req.params.commentId, res.locals.videoAll, res)))
            return;
        if (!(yield isVideoCommentAccepted(req, res, res.locals.videoAll, true)))
            return;
        return next();
    })
];
exports.addVideoCommentReplyValidator = addVideoCommentReplyValidator;
const videoCommentGetValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.param('commentId').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid commentId'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking videoCommentGetValidator parameters.', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res, 'id')))
            return;
        if (!(yield video_comments_1.doesVideoCommentExist(req.params.commentId, res.locals.videoId, res)))
            return;
        return next();
    })
];
exports.videoCommentGetValidator = videoCommentGetValidator;
const removeVideoCommentValidator = [
    express_validator_1.param('videoId').custom(misc_1.isIdOrUUIDValid).not().isEmpty().withMessage('Should have a valid videoId'),
    express_validator_1.param('commentId').custom(misc_1.isIdValid).not().isEmpty().withMessage('Should have a valid commentId'),
    (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug('Checking removeVideoCommentValidator parameters.', { parameters: req.params });
        if (utils_1.areValidationErrors(req, res))
            return;
        if (!(yield middlewares_1.doesVideoExist(req.params.videoId, res)))
            return;
        if (!(yield video_comments_1.doesVideoCommentExist(req.params.commentId, res.locals.videoAll, res)))
            return;
        if (!checkUserCanDeleteVideoComment(res.locals.oauth.token.User, res.locals.videoCommentFull, res))
            return;
        return next();
    })
];
exports.removeVideoCommentValidator = removeVideoCommentValidator;
function isVideoCommentsEnabled(video, res) {
    if (video.commentsEnabled !== true) {
        res.status(409)
            .json({ error: 'Video comments are disabled for this video.' });
        return false;
    }
    return true;
}
function checkUserCanDeleteVideoComment(user, videoComment, res) {
    if (videoComment.isDeleted()) {
        res.status(409)
            .json({ error: 'This comment is already deleted' });
        return false;
    }
    const userAccount = user.Account;
    if (user.hasRight(15) === false &&
        videoComment.accountId !== userAccount.id &&
        videoComment.Video.VideoChannel.accountId !== userAccount.id) {
        res.status(403)
            .json({ error: 'Cannot remove video comment of another user' });
        return false;
    }
    return true;
}
function isVideoCommentAccepted(req, res, video, isReply) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const acceptParameters = {
            video,
            commentBody: req.body,
            user: res.locals.oauth.token.User
        };
        let acceptedResult;
        if (isReply) {
            const acceptReplyParameters = Object.assign(acceptParameters, { parentComment: res.locals.videoCommentFull });
            acceptedResult = yield hooks_1.Hooks.wrapFun(moderation_1.isLocalVideoCommentReplyAccepted, acceptReplyParameters, 'filter:api.video-comment-reply.create.accept.result');
        }
        else {
            acceptedResult = yield hooks_1.Hooks.wrapFun(moderation_1.isLocalVideoThreadAccepted, acceptParameters, 'filter:api.video-thread.create.accept.result');
        }
        if (!acceptedResult || acceptedResult.accepted !== true) {
            logger_1.logger.info('Refused local comment.', { acceptedResult, acceptParameters });
            res.status(403)
                .json({ error: acceptedResult.errorMessage || 'Refused local comment' });
            return false;
        }
        return true;
    });
}
