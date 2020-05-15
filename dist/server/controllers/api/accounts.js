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
const utils_1 = require("../../helpers/utils");
const middlewares_1 = require("../../middlewares");
const validators_1 = require("../../middlewares/validators");
const account_1 = require("../../models/account/account");
const account_video_rate_1 = require("../../models/account/account-video-rate");
const video_1 = require("../../models/video/video");
const express_utils_1 = require("../../helpers/express-utils");
const video_channel_1 = require("../../models/video/video-channel");
const job_queue_1 = require("../../lib/job-queue");
const logger_1 = require("../../helpers/logger");
const video_playlist_1 = require("../../models/video/video-playlist");
const video_playlists_1 = require("../../middlewares/validators/videos/video-playlists");
const accountsRouter = express.Router();
exports.accountsRouter = accountsRouter;
accountsRouter.get('/', middlewares_1.paginationValidator, validators_1.accountsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listAccounts));
accountsRouter.get('/:accountName', middlewares_1.asyncMiddleware(validators_1.accountNameWithHostGetValidator), getAccount);
accountsRouter.get('/:accountName/videos', middlewares_1.asyncMiddleware(validators_1.accountNameWithHostGetValidator), middlewares_1.paginationValidator, validators_1.videosSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.optionalAuthenticate, middlewares_1.commonVideosFiltersValidator, middlewares_1.asyncMiddleware(listAccountVideos));
accountsRouter.get('/:accountName/video-channels', middlewares_1.asyncMiddleware(validators_1.accountNameWithHostGetValidator), middlewares_1.paginationValidator, validators_1.videoChannelsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.asyncMiddleware(listAccountChannels));
accountsRouter.get('/:accountName/video-playlists', middlewares_1.optionalAuthenticate, middlewares_1.asyncMiddleware(validators_1.accountNameWithHostGetValidator), middlewares_1.paginationValidator, middlewares_1.videoPlaylistsSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, video_playlists_1.commonVideoPlaylistFiltersValidator, video_playlists_1.videoPlaylistsSearchValidator, middlewares_1.asyncMiddleware(listAccountPlaylists));
accountsRouter.get('/:accountName/ratings', middlewares_1.authenticate, middlewares_1.asyncMiddleware(validators_1.accountNameWithHostGetValidator), validators_1.ensureAuthUserOwnsAccountValidator, middlewares_1.paginationValidator, middlewares_1.videoRatesSortValidator, middlewares_1.setDefaultSort, middlewares_1.setDefaultPagination, middlewares_1.videoRatingValidator, middlewares_1.asyncMiddleware(listAccountRatings));
function getAccount(req, res) {
    const account = res.locals.account;
    if (account.isOutdated()) {
        job_queue_1.JobQueue.Instance.createJob({ type: 'activitypub-refresher', payload: { type: 'actor', url: account.Actor.url } })
            .catch(err => logger_1.logger.error('Cannot create AP refresher job for actor %s.', account.Actor.url, { err }));
    }
    return res.json(account.toFormattedJSON());
}
function listAccounts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const resultList = yield account_1.AccountModel.listForApi(req.query.start, req.query.count, req.query.sort);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function listAccountChannels(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            accountId: res.locals.account.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort
        };
        const resultList = yield video_channel_1.VideoChannelModel.listByAccount(options);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function listAccountPlaylists(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverActor = yield utils_1.getServerActor();
        let listMyPlaylists = false;
        if (res.locals.oauth && res.locals.oauth.token.User.Account.id === res.locals.account.id) {
            listMyPlaylists = true;
        }
        const resultList = yield video_playlist_1.VideoPlaylistModel.listForApi({
            search: req.query.search,
            followerActorId: serverActor.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            accountId: res.locals.account.id,
            listMyPlaylists,
            type: req.query.playlistType
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function listAccountVideos(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const followerActorId = express_utils_1.isUserAbleToSearchRemoteURI(res) ? null : undefined;
        const countVideos = express_utils_1.getCountVideos(req);
        const resultList = yield video_1.VideoModel.listForApi({
            followerActorId,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            includeLocalVideos: true,
            categoryOneOf: req.query.categoryOneOf,
            licenceOneOf: req.query.licenceOneOf,
            languageOneOf: req.query.languageOneOf,
            tagsOneOf: req.query.tagsOneOf,
            tagsAllOf: req.query.tagsAllOf,
            filter: req.query.filter,
            nsfw: express_utils_1.buildNSFWFilter(res, req.query.nsfw),
            withFiles: false,
            accountId: account.id,
            user: res.locals.oauth ? res.locals.oauth.token.User : undefined,
            countVideos
        });
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function listAccountRatings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = res.locals.account;
        const resultList = yield account_video_rate_1.AccountVideoRateModel.listByAccountForApi({
            accountId: account.id,
            start: req.query.start,
            count: req.query.count,
            sort: req.query.sort,
            type: req.query.rating
        });
        return res.json(utils_1.getFormattedObjects(resultList.rows, resultList.count));
    });
}
