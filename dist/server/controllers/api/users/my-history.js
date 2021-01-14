"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myVideosHistoryRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const middlewares_1 = require("../../../middlewares");
const utils_1 = require("../../../helpers/utils");
const user_video_history_1 = require("../../../models/account/user-video-history");
const database_1 = require("../../../initializers/database");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
const myVideosHistoryRouter = express.Router();
exports.myVideosHistoryRouter = myVideosHistoryRouter;
myVideosHistoryRouter.get('/me/history/videos', middlewares_1.authenticate, middlewares_1.paginationValidator, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listMyVideosHistory));
myVideosHistoryRouter.post('/me/history/videos/remove', middlewares_1.authenticate, middlewares_1.userHistoryRemoveValidator, middlewares_1.asyncRetryTransactionMiddleware(removeUserHistory));
function listMyVideosHistory(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const resultList = yield user_video_history_1.UserVideoHistoryModel.listForApi(user, req.query.start, req.query.count);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function removeUserHistory(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const beforeDate = req.body.beforeDate || null;
        yield database_1.sequelizeTypescript.transaction(t => {
            return user_video_history_1.UserVideoHistoryModel.removeUserHistoryBefore(user, beforeDate, t);
        });
        return res.type('json')
            .status(http_error_codes_1.HttpStatusCode.NO_CONTENT_204)
            .end();
    });
}
