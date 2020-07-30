"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverRedundancyRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const users_1 = require("../../../../shared/models/users");
const middlewares_1 = require("../../../middlewares");
const redundancy_1 = require("../../../middlewares/validators/redundancy");
const redundancy_2 = require("../../../lib/redundancy");
const logger_1 = require("../../../helpers/logger");
const video_redundancy_1 = require("@server/models/redundancy/video-redundancy");
const job_queue_1 = require("@server/lib/job-queue");
const serverRedundancyRouter = express.Router();
exports.serverRedundancyRouter = serverRedundancyRouter;
serverRedundancyRouter.put('/redundancy/:host', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_SERVER_FOLLOW), middlewares_1.asyncMiddleware(redundancy_1.updateServerRedundancyValidator), middlewares_1.asyncMiddleware(updateRedundancy));
serverRedundancyRouter.get('/redundancy/videos', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_VIDEOS_REDUNDANCIES), redundancy_1.listVideoRedundanciesValidator, middlewares_1.paginationValidator, middlewares_1.videoRedundanciesSortValidator, middlewares_1.setDefaultVideoRedundanciesSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listVideoRedundancies));
serverRedundancyRouter.post('/redundancy/videos', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_VIDEOS_REDUNDANCIES), redundancy_1.addVideoRedundancyValidator, middlewares_1.asyncMiddleware(addVideoRedundancy));
serverRedundancyRouter.delete('/redundancy/videos/:redundancyId', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(users_1.UserRight.MANAGE_VIDEOS_REDUNDANCIES), redundancy_1.removeVideoRedundancyValidator, middlewares_1.asyncMiddleware(removeVideoRedundancyController));
function listVideoRedundancies(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const resultList = yield video_redundancy_1.VideoRedundancyModel.listForApi({
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            target: req.query.target,
            strategy: req.query.strategy
        });
        const result = {
            total: resultList.total,
            data: resultList.data.map(r => video_redundancy_1.VideoRedundancyModel.toFormattedJSONStatic(r))
        };
        return res.json(result);
    });
}
function addVideoRedundancy(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const payload = {
            videoId: res.locals.onlyVideo.id
        };
        yield job_queue_1.JobQueue.Instance.createJobWithPromise({
            type: 'video-redundancy',
            payload
        });
        return res.sendStatus(204);
    });
}
function removeVideoRedundancyController(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield redundancy_2.removeVideoRedundancy(res.locals.videoRedundancy);
        return res.sendStatus(204);
    });
}
function updateRedundancy(req, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const server = res.locals.server;
        server.redundancyAllowed = req.body.redundancyAllowed;
        yield server.save();
        redundancy_2.removeRedundanciesOfServer(server.id)
            .catch(err => logger_1.logger.error('Cannot remove redundancy of %s.', server.host, { err }));
        return res.sendStatus(204);
    });
}
