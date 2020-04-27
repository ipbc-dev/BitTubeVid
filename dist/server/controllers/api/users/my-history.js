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
const middlewares_1 = require("../../../middlewares");
const utils_1 = require("../../../helpers/utils");
const user_video_history_1 = require("../../../models/account/user-video-history");
const initializers_1 = require("../../../initializers");
const myVideosHistoryRouter = express.Router();
exports.myVideosHistoryRouter = myVideosHistoryRouter;
myVideosHistoryRouter.get('/me/history/videos', middlewares_1.authenticate, middlewares_1.paginationValidator, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listMyVideosHistory));
myVideosHistoryRouter.post('/me/history/videos/remove', middlewares_1.authenticate, middlewares_1.userHistoryRemoveValidator, middlewares_1.asyncRetryTransactionMiddleware(removeUserHistory));
function listMyVideosHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const resultList = yield user_video_history_1.UserVideoHistoryModel.listForApi(user, req.query.start, req.query.count);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function removeUserHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = res.locals.oauth.token.User;
        const beforeDate = req.body.beforeDate || null;
        yield initializers_1.sequelizeTypescript.transaction(t => {
            return user_video_history_1.UserVideoHistoryModel.removeUserHistoryBefore(user, beforeDate, t);
        });
        return res.type('json').status(204).end();
    });
}
