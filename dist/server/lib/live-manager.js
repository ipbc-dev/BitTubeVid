"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveManager = void 0;
const tslib_1 = require("tslib");
const Bluebird = require("bluebird");
const chokidar = require("chokidar");
const fs_extra_1 = require("fs-extra");
const net_1 = require("net");
const path_1 = require("path");
const core_utils_1 = require("@server/helpers/core-utils");
const ffmpeg_utils_1 = require("@server/helpers/ffmpeg-utils");
const ffprobe_utils_1 = require("@server/helpers/ffprobe-utils");
const logger_1 = require("@server/helpers/logger");
const config_1 = require("@server/initializers/config");
const constants_1 = require("@server/initializers/constants");
const user_1 = require("@server/models/account/user");
const video_1 = require("@server/models/video/video");
const video_file_1 = require("@server/models/video/video-file");
const video_live_1 = require("@server/models/video/video-live");
const video_streaming_playlist_1 = require("@server/models/video/video-streaming-playlist");
const videos_1 = require("./activitypub/videos");
const hls_1 = require("./hls");
const job_queue_1 = require("./job-queue");
const video_live_ending_1 = require("./job-queue/handlers/video-live-ending");
const peertube_socket_1 = require("./peertube-socket");
const user_2 = require("./user");
const video_paths_1 = require("./video-paths");
const video_transcoding_profiles_1 = require("./video-transcoding-profiles");
const memoizee = require("memoizee");
const NodeRtmpSession = require('node-media-server/node_rtmp_session');
const context = require('node-media-server/node_core_ctx');
const nodeMediaServerLogger = require('node-media-server/node_core_logger');
nodeMediaServerLogger.setLogType(0);
const config = {
    rtmp: {
        port: config_1.CONFIG.LIVE.RTMP.PORT,
        chunk_size: constants_1.VIDEO_LIVE.RTMP.CHUNK_SIZE,
        gop_cache: constants_1.VIDEO_LIVE.RTMP.GOP_CACHE,
        ping: constants_1.VIDEO_LIVE.RTMP.PING,
        ping_timeout: constants_1.VIDEO_LIVE.RTMP.PING_TIMEOUT
    },
    transcoding: {
        ffmpeg: 'ffmpeg'
    }
};
class LiveManager {
    constructor() {
        this.transSessions = new Map();
        this.videoSessions = new Map();
        this.watchersPerVideo = new Map();
        this.segmentsSha256 = new Map();
        this.livesPerUser = new Map();
        this.isAbleToUploadVideoWithCache = memoizee((userId) => {
            return user_2.isAbleToUploadVideo(userId, 1000);
        }, { maxAge: constants_1.MEMOIZE_TTL.LIVE_ABLE_TO_UPLOAD });
        this.hasClientSocketsInBadHealthWithCache = memoizee((sessionId) => {
            return this.hasClientSocketsInBadHealth(sessionId);
        }, { maxAge: constants_1.MEMOIZE_TTL.LIVE_CHECK_SOCKET_HEALTH });
    }
    init() {
        const events = this.getContext().nodeEvent;
        events.on('postPublish', (sessionId, streamPath) => {
            logger_1.logger.debug('RTMP received stream', { id: sessionId, streamPath });
            const splittedPath = streamPath.split('/');
            if (splittedPath.length !== 3 || splittedPath[1] !== constants_1.VIDEO_LIVE.RTMP.BASE_PATH) {
                logger_1.logger.warn('Live path is incorrect.', { streamPath });
                return this.abortSession(sessionId);
            }
            this.handleSession(sessionId, streamPath, splittedPath[2])
                .catch(err => logger_1.logger.error('Cannot handle sessions.', { err }));
        });
        events.on('donePublish', sessionId => {
            logger_1.logger.info('Live session ended.', { sessionId });
        });
        config_1.registerConfigChangedHandler(() => {
            if (!this.rtmpServer && config_1.CONFIG.LIVE.ENABLED === true) {
                this.run();
                return;
            }
            if (this.rtmpServer && config_1.CONFIG.LIVE.ENABLED === false) {
                this.stop();
            }
        });
        this.handleBrokenLives()
            .catch(err => logger_1.logger.error('Cannot handle broken lives.', { err }));
        setInterval(() => this.updateLiveViews(), constants_1.VIEW_LIFETIME.LIVE);
    }
    run() {
        logger_1.logger.info('Running RTMP server on port %d', config.rtmp.port);
        this.rtmpServer = net_1.createServer(socket => {
            const session = new NodeRtmpSession(config, socket);
            session.run();
        });
        this.rtmpServer.on('error', err => {
            logger_1.logger.error('Cannot run RTMP server.', { err });
        });
        this.rtmpServer.listen(config_1.CONFIG.LIVE.RTMP.PORT);
    }
    stop() {
        logger_1.logger.info('Stopping RTMP server.');
        this.rtmpServer.close();
        this.rtmpServer = undefined;
        this.getContext().sessions.forEach((session) => {
            if (session instanceof NodeRtmpSession) {
                session.stop();
            }
        });
    }
    isRunning() {
        return !!this.rtmpServer;
    }
    getSegmentsSha256(videoUUID) {
        return this.segmentsSha256.get(videoUUID);
    }
    stopSessionOf(videoId) {
        const sessionId = this.videoSessions.get(videoId);
        if (!sessionId)
            return;
        this.videoSessions.delete(videoId);
        this.abortSession(sessionId);
    }
    getLiveQuotaUsedByUser(userId) {
        const currentLives = this.livesPerUser.get(userId);
        if (!currentLives)
            return 0;
        return currentLives.reduce((sum, obj) => sum + obj.size, 0);
    }
    addViewTo(videoId) {
        if (this.videoSessions.has(videoId) === false)
            return;
        let watchers = this.watchersPerVideo.get(videoId);
        if (!watchers) {
            watchers = [];
            this.watchersPerVideo.set(videoId, watchers);
        }
        watchers.push(new Date().getTime());
    }
    cleanupShaSegments(videoUUID) {
        this.segmentsSha256.delete(videoUUID);
    }
    addSegmentToReplay(hlsVideoPath, segmentPath) {
        const segmentName = path_1.basename(segmentPath);
        const dest = path_1.join(hlsVideoPath, constants_1.VIDEO_LIVE.REPLAY_DIRECTORY, this.buildConcatenatedName(segmentName));
        return fs_extra_1.readFile(segmentPath)
            .then(data => fs_extra_1.appendFile(dest, data))
            .catch(err => logger_1.logger.error('Cannot copy segment %s to repay directory.', segmentPath, { err }));
    }
    buildConcatenatedName(segmentOrPlaylistPath) {
        const num = path_1.basename(segmentOrPlaylistPath).match(/^(\d+)(-|\.)/);
        return 'concat-' + num[1] + '.ts';
    }
    processSegments(hlsVideoPath, videoUUID, videoLive, segmentPaths) {
        Bluebird.mapSeries(segmentPaths, (previousSegment) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.addSegmentSha(videoUUID, previousSegment);
            if (videoLive.saveReplay) {
                yield this.addSegmentToReplay(hlsVideoPath, previousSegment);
            }
        })).catch(err => logger_1.logger.error('Cannot process segments in %s', hlsVideoPath, { err }));
    }
    getContext() {
        return context;
    }
    abortSession(id) {
        const session = this.getContext().sessions.get(id);
        if (session) {
            session.stop();
            this.getContext().sessions.delete(id);
        }
        const transSession = this.transSessions.get(id);
        if (transSession) {
            transSession.kill('SIGINT');
            this.transSessions.delete(id);
        }
    }
    handleSession(sessionId, streamPath, streamKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoLive = yield video_live_1.VideoLiveModel.loadByStreamKey(streamKey);
            if (!videoLive) {
                logger_1.logger.warn('Unknown live video with stream key %s.', streamKey);
                return this.abortSession(sessionId);
            }
            const video = videoLive.Video;
            if (video.isBlacklisted()) {
                logger_1.logger.warn('Video is blacklisted. Refusing stream %s.', streamKey);
                return this.abortSession(sessionId);
            }
            this.cleanupShaSegments(video.uuid);
            const oldStreamingPlaylist = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.loadHLSPlaylistByVideo(video.id);
            if (oldStreamingPlaylist) {
                yield video_live_ending_1.cleanupLive(video, oldStreamingPlaylist);
            }
            this.videoSessions.set(video.id, sessionId);
            const playlistUrl = constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsMasterPlaylistStaticPath(video.uuid);
            const session = this.getContext().sessions.get(sessionId);
            const rtmpUrl = 'rtmp://127.0.0.1:' + config.rtmp.port + streamPath;
            const [resolutionResult, fps] = yield Promise.all([
                ffprobe_utils_1.getVideoFileResolution(rtmpUrl),
                ffprobe_utils_1.getVideoFileFPS(rtmpUrl)
            ]);
            const resolutionsEnabled = config_1.CONFIG.LIVE.TRANSCODING.ENABLED
                ? ffprobe_utils_1.computeResolutionsToTranscode(resolutionResult.videoFileResolution, 'live')
                : [];
            const allResolutions = resolutionsEnabled.concat([session.videoHeight]);
            logger_1.logger.info('Will mux/transcode live video of original resolution %d.', session.videoHeight, { allResolutions });
            const [videoStreamingPlaylist] = yield video_streaming_playlist_1.VideoStreamingPlaylistModel.upsert({
                videoId: video.id,
                playlistUrl,
                segmentsSha256Url: constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsSha256SegmentsStaticPath(video.uuid, video.isLive),
                p2pMediaLoaderInfohashes: video_streaming_playlist_1.VideoStreamingPlaylistModel.buildP2PMediaLoaderInfoHashes(playlistUrl, allResolutions),
                p2pMediaLoaderPeerVersion: constants_1.P2P_MEDIA_LOADER_PEER_VERSION,
                type: 1
            }, { returning: true });
            return this.runMuxing({
                sessionId,
                videoLive,
                playlist: Object.assign(videoStreamingPlaylist, { Video: video }),
                rtmpUrl,
                fps,
                allResolutions
            });
        });
    }
    runMuxing(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { sessionId, videoLive, playlist, allResolutions, fps, rtmpUrl } = options;
            const startStreamDateTime = new Date().getTime();
            const user = yield user_1.UserModel.loadByLiveId(videoLive.id);
            if (!this.livesPerUser.has(user.id)) {
                this.livesPerUser.set(user.id, []);
            }
            const currentUserLive = { liveId: videoLive.id, videoId: videoLive.videoId, size: 0 };
            const livesOfUser = this.livesPerUser.get(user.id);
            livesOfUser.push(currentUserLive);
            for (let i = 0; i < allResolutions.length; i++) {
                const resolution = allResolutions[i];
                const file = new video_file_1.VideoFileModel({
                    resolution,
                    size: -1,
                    extname: '.ts',
                    infoHash: null,
                    fps,
                    videoStreamingPlaylistId: playlist.id
                });
                video_file_1.VideoFileModel.customUpsert(file, 'streaming-playlist', null)
                    .catch(err => logger_1.logger.error('Cannot create file for live streaming.', { err }));
            }
            const outPath = video_paths_1.getHLSDirectory(videoLive.Video);
            yield fs_extra_1.ensureDir(outPath);
            const replayDirectory = path_1.join(outPath, constants_1.VIDEO_LIVE.REPLAY_DIRECTORY);
            if (videoLive.saveReplay === true) {
                yield fs_extra_1.ensureDir(replayDirectory);
            }
            const videoUUID = videoLive.Video.uuid;
            const ffmpegExec = config_1.CONFIG.LIVE.TRANSCODING.ENABLED
                ? yield ffmpeg_utils_1.getLiveTranscodingCommand({
                    rtmpUrl,
                    outPath,
                    resolutions: allResolutions,
                    fps,
                    availableEncoders: video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.getAvailableEncoders(),
                    profile: config_1.CONFIG.LIVE.TRANSCODING.PROFILE
                })
                : ffmpeg_utils_1.getLiveMuxingCommand(rtmpUrl, outPath);
            logger_1.logger.info('Running live muxing/transcoding for %s.', videoUUID);
            this.transSessions.set(sessionId, ffmpegExec);
            const tsWatcher = chokidar.watch(outPath + '/*.ts');
            const segmentsToProcessPerPlaylist = {};
            const playlistIdMatcher = /^([\d+])-/;
            const addHandler = segmentPath => {
                logger_1.logger.debug('Live add handler of %s.', segmentPath);
                const playlistId = path_1.basename(segmentPath).match(playlistIdMatcher)[0];
                const segmentsToProcess = segmentsToProcessPerPlaylist[playlistId] || [];
                this.processSegments(outPath, videoUUID, videoLive, segmentsToProcess);
                segmentsToProcessPerPlaylist[playlistId] = [segmentPath];
                if (this.hasClientSocketsInBadHealthWithCache(sessionId)) {
                    logger_1.logger.error('Too much data in client socket stream (ffmpeg is too slow to transcode the video).' +
                        ' Stopping session of video %s.', videoUUID);
                    this.stopSessionOf(videoLive.videoId);
                    return;
                }
                if (this.isDurationConstraintValid(startStreamDateTime) !== true) {
                    logger_1.logger.info('Stopping session of %s: max duration exceeded.', videoUUID);
                    this.stopSessionOf(videoLive.videoId);
                    return;
                }
                if (videoLive.saveReplay === true) {
                    fs_extra_1.stat(segmentPath)
                        .then(segmentStat => {
                        currentUserLive.size += segmentStat.size;
                    })
                        .then(() => this.isQuotaConstraintValid(user, videoLive))
                        .then(quotaValid => {
                        if (quotaValid !== true) {
                            logger_1.logger.info('Stopping session of %s: user quota exceeded.', videoUUID);
                            this.stopSessionOf(videoLive.videoId);
                        }
                    })
                        .catch(err => logger_1.logger.error('Cannot stat %s or check quota of %d.', segmentPath, user.id, { err }));
                }
            };
            const deleteHandler = segmentPath => this.removeSegmentSha(videoUUID, segmentPath);
            tsWatcher.on('add', p => addHandler(p));
            tsWatcher.on('unlink', p => deleteHandler(p));
            const masterWatcher = chokidar.watch(outPath + '/master.m3u8');
            masterWatcher.on('add', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoLive.videoId);
                    video.state = 1;
                    yield video.save();
                    videoLive.Video = video;
                    setTimeout(() => {
                        videos_1.federateVideoIfNeeded(video, false)
                            .catch(err => logger_1.logger.error('Cannot federate live video %s.', video.url, { err }));
                        peertube_socket_1.PeerTubeSocket.Instance.sendVideoLiveNewState(video);
                    }, constants_1.VIDEO_LIVE.SEGMENT_TIME_SECONDS * 1000 * constants_1.VIDEO_LIVE.EDGE_LIVE_DELAY_SEGMENTS_NOTIFICATION);
                }
                catch (err) {
                    logger_1.logger.error('Cannot save/federate live video %d.', videoLive.videoId, { err });
                }
                finally {
                    masterWatcher.close()
                        .catch(err => logger_1.logger.error('Cannot close master watcher of %s.', outPath, { err }));
                }
            }));
            const onFFmpegEnded = () => {
                logger_1.logger.info('RTMP transmuxing for video %s ended. Scheduling cleanup', rtmpUrl);
                this.transSessions.delete(sessionId);
                this.watchersPerVideo.delete(videoLive.videoId);
                this.videoSessions.delete(videoLive.videoId);
                const newLivesPerUser = this.livesPerUser.get(user.id)
                    .filter(o => o.liveId !== videoLive.id);
                this.livesPerUser.set(user.id, newLivesPerUser);
                setTimeout(() => {
                    Promise.all([tsWatcher.close(), masterWatcher.close()])
                        .then(() => {
                        for (const key of Object.keys(segmentsToProcessPerPlaylist)) {
                            this.processSegments(outPath, videoUUID, videoLive, segmentsToProcessPerPlaylist[key]);
                        }
                    })
                        .catch(err => logger_1.logger.error('Cannot close watchers of %s or process remaining hash segments.', outPath, { err }));
                    this.onEndTransmuxing(videoLive.Video.id)
                        .catch(err => logger_1.logger.error('Error in closed transmuxing.', { err }));
                }, 1000);
            };
            ffmpegExec.on('error', (err, stdout, stderr) => {
                var _a;
                onFFmpegEnded();
                if ((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes('Exiting normally'))
                    return;
                logger_1.logger.error('Live transcoding error.', { err, stdout, stderr });
                this.abortSession(sessionId);
            });
            ffmpegExec.on('end', () => onFFmpegEnded());
            ffmpegExec.run();
        });
    }
    onEndTransmuxing(videoId, cleanupNow = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const fullVideo = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoId);
                if (!fullVideo)
                    return;
                const live = yield video_live_1.VideoLiveModel.loadByVideoId(videoId);
                if (!live.permanentLive) {
                    job_queue_1.JobQueue.Instance.createJob({
                        type: 'video-live-ending',
                        payload: {
                            videoId: fullVideo.id
                        }
                    }, { delay: cleanupNow ? 0 : constants_1.VIDEO_LIVE.CLEANUP_DELAY });
                    fullVideo.state = 5;
                }
                else {
                    fullVideo.state = 4;
                }
                yield fullVideo.save();
                peertube_socket_1.PeerTubeSocket.Instance.sendVideoLiveNewState(fullVideo);
                yield videos_1.federateVideoIfNeeded(fullVideo, false);
            }
            catch (err) {
                logger_1.logger.error('Cannot save/federate new video state of live streaming of video id %d.', videoId, { err });
            }
        });
    }
    addSegmentSha(videoUUID, segmentPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const segmentName = path_1.basename(segmentPath);
            logger_1.logger.debug('Adding live sha segment %s.', segmentPath);
            const shaResult = yield hls_1.buildSha256Segment(segmentPath);
            if (!this.segmentsSha256.has(videoUUID)) {
                this.segmentsSha256.set(videoUUID, new Map());
            }
            const filesMap = this.segmentsSha256.get(videoUUID);
            filesMap.set(segmentName, shaResult);
        });
    }
    removeSegmentSha(videoUUID, segmentPath) {
        const segmentName = path_1.basename(segmentPath);
        logger_1.logger.debug('Removing live sha segment %s.', segmentPath);
        const filesMap = this.segmentsSha256.get(videoUUID);
        if (!filesMap) {
            logger_1.logger.warn('Unknown files map to remove sha for %s.', videoUUID);
            return;
        }
        if (!filesMap.has(segmentName)) {
            logger_1.logger.warn('Unknown segment in files map for video %s and segment %s.', videoUUID, segmentPath);
            return;
        }
        filesMap.delete(segmentName);
    }
    isDurationConstraintValid(streamingStartTime) {
        const maxDuration = config_1.CONFIG.LIVE.MAX_DURATION;
        if (maxDuration < 0)
            return true;
        const now = new Date().getTime();
        const max = streamingStartTime + maxDuration;
        return now <= max;
    }
    hasClientSocketsInBadHealth(sessionId) {
        const rtmpSession = this.getContext().sessions.get(sessionId);
        if (!rtmpSession) {
            logger_1.logger.warn('Cannot get session %s to check players socket health.', sessionId);
            return;
        }
        for (const playerSessionId of rtmpSession.players) {
            const playerSession = this.getContext().sessions.get(playerSessionId);
            if (!playerSession) {
                logger_1.logger.error('Cannot get player session %s to check socket health.', playerSession);
                continue;
            }
            if (playerSession.socket.writableLength > constants_1.VIDEO_LIVE.MAX_SOCKET_WAITING_DATA) {
                return true;
            }
        }
        return false;
    }
    isQuotaConstraintValid(user, live) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (live.saveReplay !== true)
                return true;
            return this.isAbleToUploadVideoWithCache(user.id);
        });
    }
    updateLiveViews() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.isRunning())
                return;
            if (!core_utils_1.isTestInstance())
                logger_1.logger.info('Updating live video views.');
            for (const videoId of this.watchersPerVideo.keys()) {
                const notBefore = new Date().getTime() - constants_1.VIEW_LIFETIME.LIVE;
                const watchers = this.watchersPerVideo.get(videoId);
                const numWatchers = watchers.length;
                const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoId);
                video.views = numWatchers;
                yield video.save();
                yield videos_1.federateVideoIfNeeded(video, false);
                peertube_socket_1.PeerTubeSocket.Instance.sendVideoViewsUpdate(video);
                const newWatchers = watchers.filter(w => w > notBefore);
                this.watchersPerVideo.set(videoId, newWatchers);
                logger_1.logger.debug('New live video views for %s is %d.', video.url, numWatchers);
            }
        });
    }
    handleBrokenLives() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const videoIds = yield video_1.VideoModel.listPublishedLiveIds();
            for (const id of videoIds) {
                yield this.onEndTransmuxing(id, true);
            }
        });
    }
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
}
exports.LiveManager = LiveManager;
