"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const tslib_1 = require("tslib");
const express = require("express");
const core_utils_1 = require("@server/helpers/core-utils");
const requests_1 = require("@server/helpers/requests");
const config_1 = require("@server/initializers/config");
const videos_1 = require("@server/lib/activitypub/videos");
const account_blocklist_1 = require("@server/models/account/account-blocklist");
const application_1 = require("@server/models/application/application");
const server_blocklist_1 = require("@server/models/server/server-blocklist");
const express_utils_1 = require("../../helpers/express-utils");
const logger_1 = require("../../helpers/logger");
const utils_1 = require("../../helpers/utils");
const webfinger_1 = require("../../helpers/webfinger");
const actor_1 = require("../../lib/activitypub/actor");
const middlewares_1 = require("../../middlewares");
const video_1 = require("../../models/video/video");
const video_channel_1 = require("../../models/video/video-channel");
const searchRouter = express.Router();
exports.searchRouter = searchRouter;
searchRouter.get('/videos', middlewares_1.paginationValidator, middlewares_1.setDefaultPagination, middlewares_1.videosSearchSortValidator, middlewares_1.setDefaultSearchSort, middlewares_1.optionalAuthenticate, middlewares_1.commonVideosFiltersValidator, middlewares_1.videosSearchValidator, middlewares_1.asyncMiddleware(searchVideos));
searchRouter.get('/video-channels', middlewares_1.paginationValidator, middlewares_1.setDefaultPagination, middlewares_1.videoChannelsSearchSortValidator, middlewares_1.setDefaultSearchSort, middlewares_1.optionalAuthenticate, middlewares_1.videoChannelsSearchValidator, middlewares_1.asyncMiddleware(searchVideoChannels));
function searchVideoChannels(req, res) {
    const query = req.query;
    const search = query.search;
    const isURISearch = search.startsWith('http://') || search.startsWith('https://');
    const parts = search.split('@');
    if (parts.length === 3 && parts[0].length === 0)
        parts.shift();
    const isWebfingerSearch = parts.length === 2 && parts.every(p => p && !p.includes(' '));
    if (isURISearch || isWebfingerSearch)
        return searchVideoChannelURI(search, isWebfingerSearch, res);
    if (query.search.startsWith('@'))
        query.search = query.search.replace(/^@/, '');
    if (isSearchIndexSearch(query)) {
        return searchVideoChannelsIndex(query, res);
    }
    return searchVideoChannelsDB(query, res);
}
function searchVideoChannelsIndex(query, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.debug('Doing channels search on search index.');
        const result = yield buildMutedForSearchIndex(res);
        const body = Object.assign(query, result);
        const url = core_utils_1.sanitizeUrl(config_1.CONFIG.SEARCH.SEARCH_INDEX.URL) + '/api/v1/search/video-channels';
        try {
            const searchIndexResult = yield requests_1.doRequest({ uri: url, body, json: true });
            return res.json(searchIndexResult.body);
        }
        catch (err) {
            logger_1.logger.warn('Cannot use search index to make video channels search.', { err });
            return res.sendStatus(500);
        }
    });
}
function searchVideoChannelsDB(query, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        const options = {
            actorId: serverActor.id,
            search: query.search,
            start: query.start,
            count: query.count,
            sort: query.sort
        };
        const resultList = yield video_channel_1.VideoChannelModel.searchForApi(options);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function searchVideoChannelURI(search, isWebfingerSearch, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let videoChannel;
        let uri = search;
        if (isWebfingerSearch) {
            try {
                uri = yield webfinger_1.loadActorUrlOrGetFromWebfinger(search);
            }
            catch (err) {
                logger_1.logger.warn('Cannot load actor URL or get from webfinger.', { search, err });
                return res.json({ total: 0, data: [] });
            }
        }
        if (express_utils_1.isUserAbleToSearchRemoteURI(res)) {
            try {
                const actor = yield actor_1.getOrCreateActorAndServerAndModel(uri, 'all', true, true);
                videoChannel = actor.VideoChannel;
            }
            catch (err) {
                logger_1.logger.info('Cannot search remote video channel %s.', uri, { err });
            }
        }
        else {
            videoChannel = yield video_channel_1.VideoChannelModel.loadByUrlAndPopulateAccount(uri);
        }
        return res.json({
            total: videoChannel ? 1 : 0,
            data: videoChannel ? [videoChannel.toFormattedJSON()] : []
        });
    });
}
function searchVideos(req, res) {
    const query = req.query;
    const search = query.search;
    if (search && (search.startsWith('http://') || search.startsWith('https://'))) {
        return searchVideoURI(search, res);
    }
    if (isSearchIndexSearch(query)) {
        return searchVideosIndex(query, res);
    }
    return searchVideosDB(query, res);
}
function searchVideosIndex(query, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.debug('Doing videos search on search index.');
        const result = yield buildMutedForSearchIndex(res);
        const body = Object.assign(query, result);
        if (!body.nsfw) {
            const nsfwPolicy = res.locals.oauth
                ? res.locals.oauth.token.User.nsfwPolicy
                : config_1.CONFIG.INSTANCE.DEFAULT_NSFW_POLICY;
            body.nsfw = nsfwPolicy === 'do_not_list'
                ? 'false'
                : 'both';
        }
        const url = core_utils_1.sanitizeUrl(config_1.CONFIG.SEARCH.SEARCH_INDEX.URL) + '/api/v1/search/videos';
        try {
            const searchIndexResult = yield requests_1.doRequest({ uri: url, body, json: true });
            return res.json(searchIndexResult.body);
        }
        catch (err) {
            logger_1.logger.warn('Cannot use search index to make video search.', { err });
            return res.sendStatus(500);
        }
    });
}
function searchVideosDB(query, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = Object.assign(query, {
            includeLocalVideos: true,
            nsfw: express_utils_1.buildNSFWFilter(res, query.nsfw),
            filter: query.filter,
            user: res.locals.oauth ? res.locals.oauth.token.User : undefined
        });
        const resultList = yield video_1.VideoModel.searchAndPopulateAccountAndServer(options);
        return res.json(utils_1.getFormattedObjects(resultList.data, resultList.total));
    });
}
function searchVideoURI(url, res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let video;
        if (express_utils_1.isUserAbleToSearchRemoteURI(res)) {
            try {
                const syncParam = {
                    likes: false,
                    dislikes: false,
                    shares: false,
                    comments: false,
                    thumbnail: true,
                    refreshVideo: false
                };
                const result = yield videos_1.getOrCreateVideoAndAccountAndChannel({ videoObject: url, syncParam });
                video = result ? result.video : undefined;
            }
            catch (err) {
                logger_1.logger.info('Cannot search remote video %s.', url, { err });
            }
        }
        else {
            video = yield video_1.VideoModel.loadByUrlAndPopulateAccount(url);
        }
        return res.json({
            total: video ? 1 : 0,
            data: video ? [video.toFormattedJSON()] : []
        });
    });
}
function isSearchIndexSearch(query) {
    if (query.searchTarget === 'search-index')
        return true;
    const searchIndexConfig = config_1.CONFIG.SEARCH.SEARCH_INDEX;
    if (searchIndexConfig.ENABLED !== true)
        return false;
    if (searchIndexConfig.DISABLE_LOCAL_SEARCH)
        return true;
    if (searchIndexConfig.IS_DEFAULT_SEARCH && !query.searchTarget)
        return true;
    return false;
}
function buildMutedForSearchIndex(res) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const serverActor = yield application_1.getServerActor();
        const accountIds = [serverActor.Account.id];
        if (res.locals.oauth) {
            accountIds.push(res.locals.oauth.token.User.Account.id);
        }
        const [blockedHosts, blockedAccounts] = yield Promise.all([
            server_blocklist_1.ServerBlocklistModel.listHostsBlockedBy(accountIds),
            account_blocklist_1.AccountBlocklistModel.listHandlesBlockedBy(accountIds)
        ]);
        return {
            blockedHosts,
            blockedAccounts
        };
    });
}
