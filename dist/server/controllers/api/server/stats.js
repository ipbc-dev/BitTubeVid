"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const stat_manager_1 = require("@server/lib/stat-manager");
const constants_1 = require("../../../initializers/constants");
const middlewares_1 = require("../../../middlewares");
const cache_1 = require("../../../middlewares/cache");
const statsRouter = express.Router();
exports.statsRouter = statsRouter;
statsRouter.get('/stats', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.STATS)), middlewares_1.asyncMiddleware(getStats));
function getStats(_req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const data = yield stat_manager_1.StatsManager.Instance.getStats();
        return res.json(data);
    });
}
