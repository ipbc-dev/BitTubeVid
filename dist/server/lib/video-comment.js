"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markCommentAsDeleted = exports.buildFormattedCommentTree = exports.createVideoComment = exports.removeComment = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const logger_1 = require("@server/helpers/logger");
const database_1 = require("@server/initializers/database");
const video_comment_1 = require("../models/video/video-comment");
const send_1 = require("./activitypub/send");
const url_1 = require("./activitypub/url");
const hooks_1 = require("./plugins/hooks");
function removeComment(videoCommentInstance) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoCommentInstanceBefore = lodash_1.cloneDeep(videoCommentInstance);
        yield database_1.sequelizeTypescript.transaction((t) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (videoCommentInstance.isOwned() || videoCommentInstance.Video.isOwned()) {
                yield send_1.sendDeleteVideoComment(videoCommentInstance, t);
            }
            markCommentAsDeleted(videoCommentInstance);
            yield videoCommentInstance.save();
        }));
        logger_1.logger.info('Video comment %d deleted.', videoCommentInstance.id);
        hooks_1.Hooks.runAction('action:api.video-comment.deleted', { comment: videoCommentInstanceBefore });
    });
}
exports.removeComment = removeComment;
function createVideoComment(obj, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let originCommentId = null;
        let inReplyToCommentId = null;
        if (obj.inReplyToComment && obj.inReplyToComment !== null) {
            originCommentId = obj.inReplyToComment.originCommentId || obj.inReplyToComment.id;
            inReplyToCommentId = obj.inReplyToComment.id;
        }
        const comment = yield video_comment_1.VideoCommentModel.create({
            text: obj.text,
            originCommentId,
            inReplyToCommentId,
            videoId: obj.video.id,
            accountId: obj.account.id,
            url: new Date().toISOString()
        }, { transaction: t, validate: false });
        comment.url = url_1.getVideoCommentActivityPubUrl(obj.video, comment);
        const savedComment = yield comment.save({ transaction: t });
        savedComment.InReplyToVideoComment = obj.inReplyToComment;
        savedComment.Video = obj.video;
        savedComment.Account = obj.account;
        yield send_1.sendCreateVideoComment(savedComment, t);
        return savedComment;
    });
}
exports.createVideoComment = createVideoComment;
function buildFormattedCommentTree(resultList) {
    const comments = resultList.data;
    const comment = comments.shift();
    const thread = {
        comment: comment.toFormattedJSON(),
        children: []
    };
    const idx = {
        [comment.id]: thread
    };
    while (comments.length !== 0) {
        const childComment = comments.shift();
        const childCommentThread = {
            comment: childComment.toFormattedJSON(),
            children: []
        };
        const parentCommentThread = idx[childComment.inReplyToCommentId];
        if (!parentCommentThread)
            continue;
        parentCommentThread.children.push(childCommentThread);
        idx[childComment.id] = childCommentThread;
    }
    return thread;
}
exports.buildFormattedCommentTree = buildFormattedCommentTree;
function markCommentAsDeleted(comment) {
    comment.text = '';
    comment.deletedAt = new Date();
    comment.accountId = null;
}
exports.markCommentAsDeleted = markCommentAsDeleted;
