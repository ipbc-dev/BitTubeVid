"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesCommentIdExist = exports.doesVideoCommentExist = exports.doesVideoCommentThreadExist = exports.isValidVideoCommentText = void 0;
const tslib_1 = require("tslib");
const validator_1 = require("validator");
const video_comment_1 = require("@server/models/video/video-comment");
const constants_1 = require("../../initializers/constants");
const VIDEO_COMMENTS_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEO_COMMENTS;
function isValidVideoCommentText(value) {
    return value === null || validator_1.default.isLength(value, VIDEO_COMMENTS_CONSTRAINTS_FIELDS.TEXT);
}
exports.isValidVideoCommentText = isValidVideoCommentText;
function doesVideoCommentThreadExist(idArg, video, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const id = parseInt(idArg + '', 10);
        const videoComment = yield video_comment_1.VideoCommentModel.loadById(id);
        if (!videoComment) {
            res.status(404)
                .json({ error: 'Video comment thread not found' })
                .end();
            return false;
        }
        if (videoComment.videoId !== video.id) {
            res.status(400)
                .json({ error: 'Video comment is not associated to this video.' })
                .end();
            return false;
        }
        if (videoComment.inReplyToCommentId !== null) {
            res.status(400)
                .json({ error: 'Video comment is not a thread.' })
                .end();
            return false;
        }
        res.locals.videoCommentThread = videoComment;
        return true;
    });
}
exports.doesVideoCommentThreadExist = doesVideoCommentThreadExist;
function doesVideoCommentExist(idArg, video, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const id = parseInt(idArg + '', 10);
        const videoComment = yield video_comment_1.VideoCommentModel.loadByIdAndPopulateVideoAndAccountAndReply(id);
        if (!videoComment) {
            res.status(404)
                .json({ error: 'Video comment thread not found' })
                .end();
            return false;
        }
        if (videoComment.videoId !== video.id) {
            res.status(400)
                .json({ error: 'Video comment is not associated to this video.' })
                .end();
            return false;
        }
        res.locals.videoCommentFull = videoComment;
        return true;
    });
}
exports.doesVideoCommentExist = doesVideoCommentExist;
function doesCommentIdExist(idArg, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const id = parseInt(idArg + '', 10);
        const videoComment = yield video_comment_1.VideoCommentModel.loadByIdAndPopulateVideoAndAccountAndReply(id);
        if (!videoComment) {
            res.status(404)
                .json({ error: 'Video comment thread not found' });
            return false;
        }
        res.locals.videoCommentFull = videoComment;
        return true;
    });
}
exports.doesCommentIdExist = doesCommentIdExist;
