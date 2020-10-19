"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const register_ts_paths_1 = require("./server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const core_utils_1 = require("./server/helpers/core-utils");
if (core_utils_1.isTestInstance()) {
    require('source-map-support').install();
}
const bodyParser = require("body-parser");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const useragent = require("useragent");
const anonymize = require("ip-anonymize");
const cli = require("commander");
process.title = 'peertube';
const app = express();
const checker_before_init_1 = require("./server/initializers/checker-before-init");
const config_1 = require("./server/initializers/config");
const constants_1 = require("./server/initializers/constants");
const logger_1 = require("./server/helpers/logger");
const missed = checker_before_init_1.checkMissedConfig();
if (missed.length !== 0) {
    logger_1.logger.error('Your configuration files miss keys: ' + missed);
    process.exit(-1);
}
checker_before_init_1.checkFFmpeg(config_1.CONFIG)
    .catch(err => {
    logger_1.logger.error('Error in ffmpeg check.', { err });
    process.exit(-1);
});
checker_before_init_1.checkNodeVersion();
const checker_after_init_1 = require("./server/initializers/checker-after-init");
const errorMessage = checker_after_init_1.checkConfig();
if (errorMessage !== null) {
    throw new Error(errorMessage);
}
app.set('trust proxy', config_1.CONFIG.TRUST_PROXY);
const csp_1 = require("./server/middlewares/csp");
if (config_1.CONFIG.CSP.ENABLED) {
    app.use(csp_1.baseCSP);
    app.use(helmet({
        frameguard: {
            action: 'deny'
        },
        hsts: false
    }));
}
const database_1 = require("./server/initializers/database");
const migrator_1 = require("./server/initializers/migrator");
migrator_1.migrate()
    .then(() => database_1.initDatabaseModels(false))
    .then(() => startApplication())
    .catch(err => {
    logger_1.logger.error('Cannot start application.', { err });
    process.exit(-1);
});
constants_1.loadLanguages();
const installer_1 = require("./server/initializers/installer");
const emailer_1 = require("./server/lib/emailer");
const job_queue_1 = require("./server/lib/job-queue");
const files_cache_1 = require("./server/lib/files-cache");
const controllers_1 = require("./server/controllers");
const dnt_1 = require("./server/middlewares/dnt");
const redis_1 = require("./server/lib/redis");
const actor_follow_scheduler_1 = require("./server/lib/schedulers/actor-follow-scheduler");
const remove_old_views_scheduler_1 = require("./server/lib/schedulers/remove-old-views-scheduler");
const remove_old_jobs_scheduler_1 = require("./server/lib/schedulers/remove-old-jobs-scheduler");
const update_videos_scheduler_1 = require("./server/lib/schedulers/update-videos-scheduler");
const youtube_dl_update_scheduler_1 = require("./server/lib/schedulers/youtube-dl-update-scheduler");
const videos_redundancy_scheduler_1 = require("./server/lib/schedulers/videos-redundancy-scheduler");
const remove_old_history_scheduler_1 = require("./server/lib/schedulers/remove-old-history-scheduler");
const auto_follow_index_instances_1 = require("./server/lib/schedulers/auto-follow-index-instances");
const peertube_crypto_1 = require("./server/helpers/peertube-crypto");
const peertube_socket_1 = require("./server/lib/peertube-socket");
const hls_1 = require("./server/lib/hls");
const plugins_check_scheduler_1 = require("./server/lib/schedulers/plugins-check-scheduler");
const hooks_1 = require("./server/lib/plugins/hooks");
const plugin_manager_1 = require("./server/lib/plugins/plugin-manager");
cli
    .option('--no-client', 'Start PeerTube without client interface')
    .option('--no-plugins', 'Start PeerTube without plugins/themes enabled')
    .parse(process.argv);
if (core_utils_1.isTestInstance()) {
    app.use(cors({
        origin: '*',
        exposedHeaders: 'Retry-After',
        credentials: true
    }));
}
morgan.token('remote-addr', req => {
    if (config_1.CONFIG.LOG.ANONYMIZE_IP === true || req.get('DNT') === '1') {
        return anonymize(req.ip, 16, 16);
    }
    return req.ip;
});
morgan.token('user-agent', req => {
    if (req.get('DNT') === '1') {
        return useragent.parse(req.get('user-agent')).family;
    }
    return req.get('user-agent');
});
app.use(morgan('combined', {
    stream: { write: logger_1.logger.info.bind(logger_1.logger) }
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({
    type: ['application/json', 'application/*+json'],
    limit: '500kb',
    verify: (req, _, buf) => {
        const valid = peertube_crypto_1.isHTTPSignatureDigestValid(buf, req);
        if (valid !== true)
            throw new Error('Invalid digest');
    }
}));
app.use(cookieParser());
app.use(dnt_1.advertiseDoNotTrack);
const apiRoute = '/api/' + constants_1.API_VERSION;
app.use(apiRoute, controllers_1.apiRouter);
app.use('/services', controllers_1.servicesRouter);
app.use('/', controllers_1.pluginsRouter);
app.use('/', controllers_1.activityPubRouter);
app.use('/', controllers_1.feedsRouter);
app.use('/', controllers_1.webfingerRouter);
app.use('/', controllers_1.trackerRouter);
app.use('/', controllers_1.botsRouter);
app.use('/', controllers_1.staticRouter);
app.use('/', controllers_1.lazyStaticRouter);
if (cli.client)
    app.use('/', controllers_1.clientsRouter);
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
app.use(function (err, req, res, next) {
    let error = 'Unknown error.';
    if (err) {
        error = err.stack || err.message || err;
    }
    const sql = err.parent ? err.parent.sql : undefined;
    logger_1.logger.error('Error in controller.', { err: error, sql });
    return res.status(err.status || 500).end();
});
const server = controllers_1.createWebsocketTrackerServer(app);
function startApplication() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const port = config_1.CONFIG.LISTEN.PORT;
        const hostname = config_1.CONFIG.LISTEN.HOSTNAME;
        yield installer_1.installApplication();
        checker_after_init_1.checkActivityPubUrls()
            .catch(err => {
            logger_1.logger.error('Error in ActivityPub URLs checker.', { err });
            process.exit(-1);
        });
        emailer_1.Emailer.Instance.init();
        yield Promise.all([
            emailer_1.Emailer.Instance.checkConnectionOrDie(),
            job_queue_1.JobQueue.Instance.init()
        ]);
        files_cache_1.VideosPreviewCache.Instance.init(config_1.CONFIG.CACHE.PREVIEWS.SIZE, constants_1.FILES_CACHE.PREVIEWS.MAX_AGE);
        files_cache_1.VideosCaptionCache.Instance.init(config_1.CONFIG.CACHE.VIDEO_CAPTIONS.SIZE, constants_1.FILES_CACHE.VIDEO_CAPTIONS.MAX_AGE);
        actor_follow_scheduler_1.ActorFollowScheduler.Instance.enable();
        remove_old_jobs_scheduler_1.RemoveOldJobsScheduler.Instance.enable();
        update_videos_scheduler_1.UpdateVideosScheduler.Instance.enable();
        youtube_dl_update_scheduler_1.YoutubeDlUpdateScheduler.Instance.enable();
        videos_redundancy_scheduler_1.VideosRedundancyScheduler.Instance.enable();
        remove_old_history_scheduler_1.RemoveOldHistoryScheduler.Instance.enable();
        remove_old_views_scheduler_1.RemoveOldViewsScheduler.Instance.enable();
        plugins_check_scheduler_1.PluginsCheckScheduler.Instance.enable();
        auto_follow_index_instances_1.AutoFollowIndexInstances.Instance.enable();
        redis_1.Redis.Instance.init();
        peertube_socket_1.PeerTubeSocket.Instance.init(server);
        hls_1.updateStreamingPlaylistsInfohashesIfNeeded()
            .catch(err => logger_1.logger.error('Cannot update streaming playlist infohashes.', { err }));
        if (cli.plugins)
            yield plugin_manager_1.PluginManager.Instance.registerPluginsAndThemes();
        server.listen(port, hostname, () => {
            logger_1.logger.info('Server listening on %s:%d', hostname, port);
            logger_1.logger.info('Web server: %s', constants_1.WEBSERVER.URL);
            hooks_1.Hooks.runAction('action:application.listening');
        });
        server.keepAliveTimeout = server.headersTimeout = server.timeout = 0;
        process.on('exit', () => {
            job_queue_1.JobQueue.Instance.terminate();
        });
        process.on('SIGINT', () => process.exit(0));
    });
}
