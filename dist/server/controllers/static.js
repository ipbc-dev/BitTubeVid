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
const cors = require("cors");
const express = require("express");
const constants_1 = require("../initializers/constants");
const cache_1 = require("../middlewares/cache");
const middlewares_1 = require("../middlewares");
const video_1 = require("../models/video/video");
const user_1 = require("../models/account/user");
const video_comment_1 = require("../models/video/video-comment");
const path_1 = require("path");
const core_utils_1 = require("../helpers/core-utils");
const config_1 = require("../initializers/config");
const lazy_static_1 = require("./lazy-static");
const video_streaming_playlist_type_1 = require("@shared/models/videos/video-streaming-playlist.type");
const video_paths_1 = require("@server/lib/video-paths");
const theme_utils_1 = require("../lib/plugins/theme-utils");
const config_2 = require("@server/controllers/api/config");
const staticRouter = express.Router();
exports.staticRouter = staticRouter;
staticRouter.use(cors());
const torrentsPhysicalPath = config_1.CONFIG.STORAGE.TORRENTS_DIR;
staticRouter.use(constants_1.STATIC_PATHS.TORRENTS, cors(), express.static(torrentsPhysicalPath, { maxAge: 0 }));
staticRouter.use(constants_1.STATIC_DOWNLOAD_PATHS.TORRENTS + ':id-:resolution([0-9]+).torrent', middlewares_1.asyncMiddleware(middlewares_1.videosDownloadValidator), downloadTorrent);
staticRouter.use(constants_1.STATIC_DOWNLOAD_PATHS.TORRENTS + ':id-:resolution([0-9]+)-hls.torrent', middlewares_1.asyncMiddleware(middlewares_1.videosDownloadValidator), downloadHLSVideoFileTorrent);
staticRouter.use(constants_1.STATIC_PATHS.WEBSEED, cors(), express.static(config_1.CONFIG.STORAGE.VIDEOS_DIR, { fallthrough: false }));
staticRouter.use(constants_1.STATIC_PATHS.REDUNDANCY, cors(), express.static(config_1.CONFIG.STORAGE.REDUNDANCY_DIR, { fallthrough: false }));
staticRouter.use(constants_1.STATIC_DOWNLOAD_PATHS.VIDEOS + ':id-:resolution([0-9]+).:extension', middlewares_1.asyncMiddleware(middlewares_1.videosDownloadValidator), downloadVideoFile);
staticRouter.use(constants_1.STATIC_DOWNLOAD_PATHS.HLS_VIDEOS + ':id-:resolution([0-9]+)-fragmented.:extension', middlewares_1.asyncMiddleware(middlewares_1.videosDownloadValidator), downloadHLSVideoFile);
staticRouter.use(constants_1.STATIC_PATHS.STREAMING_PLAYLISTS.HLS, cors(), express.static(constants_1.HLS_STREAMING_PLAYLIST_DIRECTORY, { fallthrough: false }));
const thumbnailsPhysicalPath = config_1.CONFIG.STORAGE.THUMBNAILS_DIR;
staticRouter.use(constants_1.STATIC_PATHS.THUMBNAILS, express.static(thumbnailsPhysicalPath, { maxAge: constants_1.STATIC_MAX_AGE.SERVER, fallthrough: false }));
const avatarsPhysicalPath = config_1.CONFIG.STORAGE.AVATARS_DIR;
staticRouter.use(constants_1.STATIC_PATHS.AVATARS, express.static(avatarsPhysicalPath, { maxAge: constants_1.STATIC_MAX_AGE.SERVER, fallthrough: false }));
staticRouter.use(constants_1.STATIC_PATHS.PREVIEWS + ':uuid.jpg', middlewares_1.asyncMiddleware(lazy_static_1.getPreview));
staticRouter.use(constants_1.STATIC_PATHS.VIDEO_CAPTIONS + ':videoId-:captionLanguage([a-z]+).vtt', middlewares_1.asyncMiddleware(lazy_static_1.getVideoCaption));
staticRouter.get('/robots.txt', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.ROBOTS)), (_, res) => {
    res.type('text/plain');
    return res.send(config_1.CONFIG.INSTANCE.ROBOTS);
});
staticRouter.get('/security.txt', (_, res) => {
    return res.redirect(301, '/.well-known/security.txt');
});
staticRouter.get('/.well-known/security.txt', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.SECURITYTXT)), (_, res) => {
    res.type('text/plain');
    return res.send(config_1.CONFIG.INSTANCE.SECURITYTXT + config_1.CONFIG.INSTANCE.SECURITYTXT_CONTACT);
});
staticRouter.use('/.well-known/nodeinfo', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.NODEINFO)), (_, res) => {
    return res.json({
        links: [
            {
                rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
                href: constants_1.WEBSERVER.URL + '/nodeinfo/2.0.json'
            }
        ]
    });
});
staticRouter.use('/nodeinfo/:version.json', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.NODEINFO)), middlewares_1.asyncMiddleware(generateNodeinfo));
staticRouter.use('/.well-known/dnt-policy.txt', middlewares_1.asyncMiddleware(cache_1.cacheRoute()(constants_1.ROUTE_CACHE_LIFETIME.DNT_POLICY)), (_, res) => {
    res.type('text/plain');
    return res.sendFile(path_1.join(core_utils_1.root(), 'dist/server/static/dnt-policy/dnt-policy-1.0.txt'));
});
staticRouter.use('/.well-known/dnt/', (_, res) => {
    res.json({ tracking: 'N' });
});
staticRouter.use('/.well-known/change-password', (_, res) => {
    res.redirect('/my-account/settings');
});
staticRouter.use('/.well-known/host-meta', (_, res) => {
    res.type('application/xml');
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">\n' +
        `  <Link rel="lrdd" type="application/xrd+xml" template="${constants_1.WEBSERVER.URL}/.well-known/webfinger?resource={uri}"/>\n` +
        '</XRD>';
    res.send(xml).end();
});
function generateNodeinfo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { totalVideos } = yield video_1.VideoModel.getStats();
        const { totalLocalVideoComments } = yield video_comment_1.VideoCommentModel.getStats();
        const { totalUsers } = yield user_1.UserModel.getStats();
        let json = {};
        if (req.params.version && (req.params.version === '2.0')) {
            json = {
                version: '2.0',
                software: {
                    name: 'peertube',
                    version: constants_1.PEERTUBE_VERSION
                },
                protocols: [
                    'activitypub'
                ],
                services: {
                    inbound: [],
                    outbound: [
                        'atom1.0',
                        'rss2.0'
                    ]
                },
                openRegistrations: config_1.CONFIG.SIGNUP.ENABLED,
                usage: {
                    users: {
                        total: totalUsers
                    },
                    localPosts: totalVideos,
                    localComments: totalLocalVideoComments
                },
                metadata: {
                    taxonomy: {
                        postsName: 'Videos'
                    },
                    nodeName: config_1.CONFIG.INSTANCE.NAME,
                    nodeDescription: config_1.CONFIG.INSTANCE.SHORT_DESCRIPTION,
                    nodeConfig: {
                        search: {
                            remoteUri: {
                                users: config_1.CONFIG.SEARCH.REMOTE_URI.USERS,
                                anonymous: config_1.CONFIG.SEARCH.REMOTE_URI.ANONYMOUS
                            }
                        },
                        plugin: {
                            registered: config_2.getRegisteredPlugins()
                        },
                        theme: {
                            registered: config_2.getRegisteredThemes(),
                            default: theme_utils_1.getThemeOrDefault(config_1.CONFIG.THEME.DEFAULT, constants_1.DEFAULT_THEME_NAME)
                        },
                        email: {
                            enabled: config_1.isEmailEnabled()
                        },
                        contactForm: {
                            enabled: config_1.CONFIG.CONTACT_FORM.ENABLED
                        },
                        transcoding: {
                            hls: {
                                enabled: config_1.CONFIG.TRANSCODING.HLS.ENABLED
                            },
                            webtorrent: {
                                enabled: config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED
                            },
                            enabledResolutions: config_2.getEnabledResolutions()
                        },
                        import: {
                            videos: {
                                http: {
                                    enabled: config_1.CONFIG.IMPORT.VIDEOS.HTTP.ENABLED
                                },
                                torrent: {
                                    enabled: config_1.CONFIG.IMPORT.VIDEOS.TORRENT.ENABLED
                                }
                            }
                        },
                        autoBlacklist: {
                            videos: {
                                ofUsers: {
                                    enabled: config_1.CONFIG.AUTO_BLACKLIST.VIDEOS.OF_USERS.ENABLED
                                }
                            }
                        },
                        avatar: {
                            file: {
                                size: {
                                    max: constants_1.CONSTRAINTS_FIELDS.ACTORS.AVATAR.FILE_SIZE.max
                                },
                                extensions: constants_1.CONSTRAINTS_FIELDS.ACTORS.AVATAR.EXTNAME
                            }
                        },
                        video: {
                            image: {
                                extensions: constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.EXTNAME,
                                size: {
                                    max: constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.FILE_SIZE.max
                                }
                            },
                            file: {
                                extensions: constants_1.CONSTRAINTS_FIELDS.VIDEOS.EXTNAME
                            }
                        },
                        videoCaption: {
                            file: {
                                size: {
                                    max: constants_1.CONSTRAINTS_FIELDS.VIDEO_CAPTIONS.CAPTION_FILE.FILE_SIZE.max
                                },
                                extensions: constants_1.CONSTRAINTS_FIELDS.VIDEO_CAPTIONS.CAPTION_FILE.EXTNAME
                            }
                        },
                        user: {
                            videoQuota: config_1.CONFIG.USER.VIDEO_QUOTA,
                            videoQuotaDaily: config_1.CONFIG.USER.VIDEO_QUOTA_DAILY
                        },
                        trending: {
                            videos: {
                                intervalDays: config_1.CONFIG.TRENDING.VIDEOS.INTERVAL_DAYS
                            }
                        },
                        tracker: {
                            enabled: config_1.CONFIG.TRACKER.ENABLED
                        }
                    }
                }
            };
            res.contentType('application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.0#"');
        }
        else {
            json = { error: 'Nodeinfo schema version not handled' };
            res.status(404);
        }
        return res.send(json).end();
    });
}
function downloadTorrent(req, res) {
    const video = res.locals.videoAll;
    const videoFile = getVideoFile(req, video.VideoFiles);
    if (!videoFile)
        return res.status(404).end();
    return res.download(video_paths_1.getTorrentFilePath(video, videoFile), `${video.name}-${videoFile.resolution}p.torrent`);
}
function downloadHLSVideoFileTorrent(req, res) {
    const video = res.locals.videoAll;
    const playlist = getHLSPlaylist(video);
    if (!playlist)
        return res.status(404).end;
    const videoFile = getVideoFile(req, playlist.VideoFiles);
    if (!videoFile)
        return res.status(404).end();
    return res.download(video_paths_1.getTorrentFilePath(playlist, videoFile), `${video.name}-${videoFile.resolution}p-hls.torrent`);
}
function downloadVideoFile(req, res) {
    const video = res.locals.videoAll;
    const videoFile = getVideoFile(req, video.VideoFiles);
    if (!videoFile)
        return res.status(404).end();
    return res.download(video_paths_1.getVideoFilePath(video, videoFile), `${video.name}-${videoFile.resolution}p${videoFile.extname}`);
}
function downloadHLSVideoFile(req, res) {
    const video = res.locals.videoAll;
    const playlist = getHLSPlaylist(video);
    if (!playlist)
        return res.status(404).end;
    const videoFile = getVideoFile(req, playlist.VideoFiles);
    if (!videoFile)
        return res.status(404).end();
    const filename = `${video.name}-${videoFile.resolution}p-${playlist.getStringType()}${videoFile.extname}`;
    return res.download(video_paths_1.getVideoFilePath(playlist, videoFile), filename);
}
function getVideoFile(req, files) {
    const resolution = parseInt(req.params.resolution, 10);
    return files.find(f => f.resolution === resolution);
}
function getHLSPlaylist(video) {
    const playlist = video.VideoStreamingPlaylists.find(p => p.type === video_streaming_playlist_type_1.VideoStreamingPlaylistType.HLS);
    if (!playlist)
        return undefined;
    return Object.assign(playlist, { Video: video });
}
