"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const middlewares_1 = require("../../middlewares");
const bulk_1 = require("@server/middlewares/validators/bulk");
const video_comment_1 = require("@server/models/video/video-comment");
const video_comment_2 = require("@server/lib/video-comment");
const http_error_codes_1 = require("@shared/core-utils/miscs/http-error-codes");
const bulkRouter = express.Router();
exports.bulkRouter = bulkRouter;
bulkRouter.post('/remove-comments-of', middlewares_1.authenticate, middlewares_1.asyncMiddleware(bulk_1.bulkRemoveCommentsOfValidator), middlewares_1.asyncMiddleware(bulkRemoveCommentsOf));
function bulkRemoveCommentsOf(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const body = req.body;
        const user = res.locals.oauth.token.User;
        const filter = body.scope === 'my-videos'
            ? { onVideosOfAccount: user.Account }
            : {};
        const comments = yield video_comment_1.VideoCommentModel.listForBulkDelete(account, filter);
        res.sendStatus(http_error_codes_1.HttpStatusCode.NO_CONTENT_204);
        for (const comment of comments) {
            yield video_comment_2.removeComment(comment);
        }
    });
}
