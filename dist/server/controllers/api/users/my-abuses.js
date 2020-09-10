"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myAbusesRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const abuse_1 = require("@server/models/abuse/abuse");
const middlewares_1 = require("../../../middlewares");
const myAbusesRouter = express.Router();
exports.myAbusesRouter = myAbusesRouter;
myAbusesRouter.get('/me/abuses', middlewares_1.authenticate, middlewares_1.paginationValidator, middlewares_1.abusesSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.abuseListForUserValidator, middlewares_1.asyncMiddleware(listMyAbuses));
function listMyAbuses(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const resultList = yield abuse_1.AbuseModel.listForUserApi({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            id: req.query.id,
            search: req.query.search,
            state: req.query.state,
            user: res.locals.oauth.token.User
        });
        return res.json({
            total: resultList.total,
            data: resultList.data.map(d => d.toFormattedUserJSON())
        });
    });
}
