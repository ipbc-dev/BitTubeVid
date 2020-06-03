"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const config_1 = require("./config");
const jobs_1 = require("./jobs");
const oauth_clients_1 = require("./oauth-clients");
const server_1 = require("./server");
const users_1 = require("./users");
const accounts_1 = require("./accounts");
const videos_1 = require("./videos");
const express_utils_1 = require("../../helpers/express-utils");
const video_channel_1 = require("./video-channel");
const cors = require("cors");
const search_1 = require("./search");
const overviews_1 = require("./overviews");
const video_playlist_1 = require("./video-playlist");
const config_2 = require("../../initializers/config");
const plugins_1 = require("./plugins");
const RateLimit = require("express-rate-limit");
const apiRouter = express.Router();
exports.apiRouter = apiRouter;
apiRouter.use(cors({
    origin: '*',
    exposedHeaders: 'Retry-After',
    credentials: true
}));
const apiRateLimiter = RateLimit({
    windowMs: config_2.CONFIG.RATES_LIMIT.API.WINDOW_MS,
    max: config_2.CONFIG.RATES_LIMIT.API.MAX
});
apiRouter.use(apiRateLimiter);
apiRouter.use('/server', server_1.serverRouter);
apiRouter.use('/oauth-clients', oauth_clients_1.oauthClientsRouter);
apiRouter.use('/config', config_1.configRouter);
apiRouter.use('/users', users_1.usersRouter);
apiRouter.use('/accounts', accounts_1.accountsRouter);
apiRouter.use('/video-channels', video_channel_1.videoChannelRouter);
apiRouter.use('/video-playlists', video_playlist_1.videoPlaylistRouter);
apiRouter.use('/videos', videos_1.videosRouter);
apiRouter.use('/jobs', jobs_1.jobsRouter);
apiRouter.use('/search', search_1.searchRouter);
apiRouter.use('/overviews', overviews_1.overviewsRouter);
apiRouter.use('/plugins', plugins_1.pluginRouter);
apiRouter.use('/ping', pong);
apiRouter.use('/*', express_utils_1.badRequest);
function pong(req, res) {
    return res.send('pong').status(200).end();
}
