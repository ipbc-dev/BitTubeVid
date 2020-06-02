"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const models_1 = require("../../shared/models");
const videos_1 = require("../../shared/models/videos");
const core_utils_1 = require("../helpers/core-utils");
const lodash_1 = require("lodash");
const video_playlist_privacy_model_1 = require("../../shared/models/videos/playlist/video-playlist-privacy.model");
const video_playlist_type_model_1 = require("../../shared/models/videos/playlist/video-playlist-type.model");
const config_1 = require("./config");
const LAST_MIGRATION_VERSION = 510;
exports.LAST_MIGRATION_VERSION = LAST_MIGRATION_VERSION;
const API_VERSION = 'v1';
exports.API_VERSION = API_VERSION;
const PEERTUBE_VERSION = require(path_1.join(core_utils_1.root(), 'package.json')).version;
exports.PEERTUBE_VERSION = PEERTUBE_VERSION;
const PAGINATION = {
    GLOBAL: {
        COUNT: {
            DEFAULT: 15,
            MAX: 100
        }
    },
    OUTBOX: {
        COUNT: {
            MAX: 50
        }
    }
};
exports.PAGINATION = PAGINATION;
const WEBSERVER = {
    URL: '',
    HOST: '',
    SCHEME: '',
    WS: '',
    HOSTNAME: '',
    PORT: 0
};
exports.WEBSERVER = WEBSERVER;
const SORTABLE_COLUMNS = {
    USERS: ['id', 'username', 'videoQuotaUsed', 'createdAt'],
    USER_SUBSCRIPTIONS: ['id', 'createdAt'],
    ACCOUNTS: ['createdAt'],
    JOBS: ['createdAt'],
    VIDEO_ABUSES: ['id', 'createdAt', 'state'],
    VIDEO_CHANNELS: ['id', 'name', 'updatedAt', 'createdAt'],
    VIDEO_IMPORTS: ['createdAt'],
    VIDEO_COMMENT_THREADS: ['createdAt', 'totalReplies'],
    VIDEO_RATES: ['createdAt'],
    BLACKLISTS: ['id', 'name', 'duration', 'views', 'likes', 'dislikes', 'uuid', 'createdAt'],
    FOLLOWERS: ['createdAt', 'state', 'score'],
    FOLLOWING: ['createdAt', 'redundancyAllowed', 'state'],
    VIDEOS: ['name', 'duration', 'createdAt', 'publishedAt', 'originallyPublishedAt', 'views', 'likes', 'trending'],
    VIDEOS_SEARCH: ['name', 'duration', 'createdAt', 'publishedAt', 'originallyPublishedAt', 'views', 'likes', 'match'],
    VIDEO_CHANNELS_SEARCH: ['match', 'displayName', 'createdAt'],
    ACCOUNTS_BLOCKLIST: ['createdAt'],
    SERVERS_BLOCKLIST: ['createdAt'],
    USER_NOTIFICATIONS: ['createdAt'],
    VIDEO_PLAYLISTS: ['displayName', 'createdAt', 'updatedAt'],
    PLUGINS: ['name', 'createdAt', 'updatedAt'],
    AVAILABLE_PLUGINS: ['npmName', 'popularity'],
    VIDEO_REDUNDANCIES: ['name']
};
exports.SORTABLE_COLUMNS = SORTABLE_COLUMNS;
const OAUTH_LIFETIME = {
    ACCESS_TOKEN: 3600 * 24,
    REFRESH_TOKEN: 1209600
};
exports.OAUTH_LIFETIME = OAUTH_LIFETIME;
const ROUTE_CACHE_LIFETIME = {
    FEEDS: '15 minutes',
    ROBOTS: '2 hours',
    SITEMAP: '1 day',
    SECURITYTXT: '2 hours',
    NODEINFO: '10 minutes',
    DNT_POLICY: '1 week',
    ACTIVITY_PUB: {
        VIDEOS: '1 second'
    },
    STATS: '4 hours'
};
exports.ROUTE_CACHE_LIFETIME = ROUTE_CACHE_LIFETIME;
const ACTOR_FOLLOW_SCORE = {
    PENALTY: -10,
    BONUS: 10,
    BASE: 1000,
    MAX: 10000
};
exports.ACTOR_FOLLOW_SCORE = ACTOR_FOLLOW_SCORE;
const FOLLOW_STATES = {
    PENDING: 'pending',
    ACCEPTED: 'accepted'
};
exports.FOLLOW_STATES = FOLLOW_STATES;
const REMOTE_SCHEME = {
    HTTP: 'https',
    WS: 'wss'
};
exports.REMOTE_SCHEME = REMOTE_SCHEME;
const JOB_ATTEMPTS = {
    'activitypub-http-broadcast': 5,
    'activitypub-http-unicast': 5,
    'activitypub-http-fetcher': 5,
    'activitypub-follow': 5,
    'video-file-import': 1,
    'video-transcoding': 1,
    'video-import': 1,
    'email': 5,
    'videos-views': 1,
    'activitypub-refresher': 1,
    'video-redundancy': 1
};
exports.JOB_ATTEMPTS = JOB_ATTEMPTS;
const JOB_CONCURRENCY = {
    'activitypub-http-broadcast': 1,
    'activitypub-http-unicast': 5,
    'activitypub-http-fetcher': 1,
    'activitypub-follow': 1,
    'video-file-import': 1,
    'video-transcoding': 14,
    'video-import': 1,
    'email': 5,
    'videos-views': 1,
    'activitypub-refresher': 1,
    'video-redundancy': 1
};
exports.JOB_CONCURRENCY = JOB_CONCURRENCY;
const JOB_TTL = {
    'activitypub-http-broadcast': 60000 * 10,
    'activitypub-http-unicast': 60000 * 10,
    'activitypub-http-fetcher': 1000 * 3600 * 10,
    'activitypub-follow': 60000 * 10,
    'video-file-import': 1000 * 3600,
    'video-transcoding': 1000 * 3600 * 48,
    'video-import': 1000 * 3600 * 2,
    'email': 60000 * 10,
    'videos-views': undefined,
    'activitypub-refresher': 60000 * 10,
    'video-redundancy': 1000 * 3600 * 3
};
exports.JOB_TTL = JOB_TTL;
const REPEAT_JOBS = {
    'videos-views': {
        cron: '1 * * * *'
    }
};
exports.REPEAT_JOBS = REPEAT_JOBS;
const BROADCAST_CONCURRENCY = 10;
exports.BROADCAST_CONCURRENCY = BROADCAST_CONCURRENCY;
const CRAWL_REQUEST_CONCURRENCY = 1;
exports.CRAWL_REQUEST_CONCURRENCY = CRAWL_REQUEST_CONCURRENCY;
const JOB_REQUEST_TIMEOUT = 3000;
exports.JOB_REQUEST_TIMEOUT = JOB_REQUEST_TIMEOUT;
const JOB_COMPLETED_LIFETIME = 60000 * 60 * 24 * 2;
exports.JOB_COMPLETED_LIFETIME = JOB_COMPLETED_LIFETIME;
const VIDEO_IMPORT_TIMEOUT = 1000 * 3600;
exports.VIDEO_IMPORT_TIMEOUT = VIDEO_IMPORT_TIMEOUT;
const SCHEDULER_INTERVALS_MS = {
    actorFollowScores: 60000 * 60,
    removeOldJobs: 60000 * 60,
    updateVideos: 60000,
    youtubeDLUpdate: 60000 * 60 * 24,
    checkPlugins: config_1.CONFIG.PLUGINS.INDEX.CHECK_LATEST_VERSIONS_INTERVAL,
    autoFollowIndexInstances: 60000 * 60 * 24,
    removeOldViews: 60000 * 60 * 24,
    removeOldHistory: 60000 * 60 * 24
};
exports.SCHEDULER_INTERVALS_MS = SCHEDULER_INTERVALS_MS;
const CONSTRAINTS_FIELDS = {
    USERS: {
        NAME: { min: 1, max: 120 },
        DESCRIPTION: { min: 3, max: 1000 },
        USERNAME: { min: 1, max: 50 },
        PASSWORD: { min: 6, max: 3000 },
        VIDEO_QUOTA: { min: -1 },
        VIDEO_QUOTA_DAILY: { min: -1 },
        VIDEO_LANGUAGES: { max: 500 },
        BLOCKED_REASON: { min: 3, max: 250 }
    },
    VIDEO_ABUSES: {
        REASON: { min: 2, max: 3000 },
        MODERATION_COMMENT: { min: 2, max: 3000 }
    },
    VIDEO_BLACKLIST: {
        REASON: { min: 2, max: 300 }
    },
    VIDEO_CHANNELS: {
        NAME: { min: 1, max: 120 },
        DESCRIPTION: { min: 3, max: 1000 },
        SUPPORT: { min: 3, max: 1000 },
        URL: { min: 3, max: 2000 }
    },
    VIDEO_CAPTIONS: {
        CAPTION_FILE: {
            EXTNAME: ['.vtt', '.srt'],
            FILE_SIZE: {
                max: 2 * 1024 * 1024
            }
        }
    },
    VIDEO_IMPORTS: {
        URL: { min: 3, max: 2000 },
        TORRENT_NAME: { min: 3, max: 255 },
        TORRENT_FILE: {
            EXTNAME: ['.torrent'],
            FILE_SIZE: {
                max: 1024 * 200
            }
        }
    },
    VIDEOS_REDUNDANCY: {
        URL: { min: 3, max: 2000 }
    },
    VIDEO_RATES: {
        URL: { min: 3, max: 2000 }
    },
    VIDEOS: {
        NAME: { min: 3, max: 120 },
        LANGUAGE: { min: 1, max: 10 },
        TRUNCATED_DESCRIPTION: { min: 3, max: 250 },
        DESCRIPTION: { min: 3, max: 10000 },
        SUPPORT: { min: 3, max: 1000 },
        IMAGE: {
            EXTNAME: ['.jpg', '.jpeg'],
            FILE_SIZE: {
                max: 2 * 1024 * 1024
            }
        },
        EXTNAME: [],
        INFO_HASH: { min: 40, max: 40 },
        DURATION: { min: 0 },
        TAGS: { min: 0, max: 5 },
        TAG: { min: 2, max: 30 },
        THUMBNAIL: { min: 2, max: 30 },
        THUMBNAIL_DATA: { min: 0, max: 20000 },
        VIEWS: { min: 0 },
        LIKES: { min: 0 },
        DISLIKES: { min: 0 },
        FILE_SIZE: { min: 10 },
        URL: { min: 3, max: 2000 }
    },
    VIDEO_PLAYLISTS: {
        NAME: { min: 1, max: 120 },
        DESCRIPTION: { min: 3, max: 1000 },
        URL: { min: 3, max: 2000 },
        IMAGE: {
            EXTNAME: ['.jpg', '.jpeg'],
            FILE_SIZE: {
                max: 2 * 1024 * 1024
            }
        }
    },
    ACTORS: {
        PUBLIC_KEY: { min: 10, max: 5000 },
        PRIVATE_KEY: { min: 10, max: 5000 },
        URL: { min: 3, max: 2000 },
        AVATAR: {
            EXTNAME: ['.png', '.jpeg', '.jpg'],
            FILE_SIZE: {
                max: 2 * 1024 * 1024
            }
        }
    },
    VIDEO_EVENTS: {
        COUNT: { min: 0 }
    },
    VIDEO_COMMENTS: {
        TEXT: { min: 1, max: 10000 },
        URL: { min: 3, max: 2000 }
    },
    VIDEO_SHARE: {
        URL: { min: 3, max: 2000 }
    },
    CONTACT_FORM: {
        FROM_NAME: { min: 1, max: 120 },
        BODY: { min: 3, max: 5000 }
    },
    PLUGINS: {
        NAME: { min: 1, max: 214 },
        DESCRIPTION: { min: 1, max: 20000 }
    },
    COMMONS: {
        URL: { min: 5, max: 2000 }
    }
};
exports.CONSTRAINTS_FIELDS = CONSTRAINTS_FIELDS;
let VIDEO_VIEW_LIFETIME = 60000 * 60;
exports.VIDEO_VIEW_LIFETIME = VIDEO_VIEW_LIFETIME;
let CONTACT_FORM_LIFETIME = 60000 * 60;
exports.CONTACT_FORM_LIFETIME = CONTACT_FORM_LIFETIME;
const VIDEO_TRANSCODING_FPS = {
    MIN: 10,
    STANDARD: [24, 25, 30],
    HD_STANDARD: [50, 60],
    AVERAGE: 30,
    MAX: 60,
    KEEP_ORIGIN_FPS_RESOLUTION_MIN: 720
};
exports.VIDEO_TRANSCODING_FPS = VIDEO_TRANSCODING_FPS;
const DEFAULT_AUDIO_RESOLUTION = models_1.VideoResolution.H_480P;
exports.DEFAULT_AUDIO_RESOLUTION = DEFAULT_AUDIO_RESOLUTION;
const VIDEO_RATE_TYPES = {
    LIKE: 'like',
    DISLIKE: 'dislike'
};
exports.VIDEO_RATE_TYPES = VIDEO_RATE_TYPES;
const FFMPEG_NICE = {
    THUMBNAIL: 2,
    TRANSCODING: 15
};
exports.FFMPEG_NICE = FFMPEG_NICE;
const VIDEO_CATEGORIES = {
    1: 'Music',
    2: 'Films',
    3: 'Vehicles',
    4: 'Art',
    5: 'Sports',
    6: 'Travels',
    7: 'Gaming',
    8: 'People',
    9: 'Comedy',
    10: 'Entertainment',
    11: 'News & Politics',
    12: 'How To',
    13: 'Education',
    14: 'Activism',
    15: 'Science & Technology',
    16: 'Animals',
    17: 'Kids',
    18: 'Food'
};
exports.VIDEO_CATEGORIES = VIDEO_CATEGORIES;
const VIDEO_LICENCES = {
    1: 'Attribution',
    2: 'Attribution - Share Alike',
    3: 'Attribution - No Derivatives',
    4: 'Attribution - Non Commercial',
    5: 'Attribution - Non Commercial - Share Alike',
    6: 'Attribution - Non Commercial - No Derivatives',
    7: 'Public Domain Dedication'
};
exports.VIDEO_LICENCES = VIDEO_LICENCES;
const VIDEO_LANGUAGES = {};
exports.VIDEO_LANGUAGES = VIDEO_LANGUAGES;
const VIDEO_PRIVACIES = {
    [videos_1.VideoPrivacy.PUBLIC]: 'Public',
    [videos_1.VideoPrivacy.UNLISTED]: 'Unlisted',
    [videos_1.VideoPrivacy.PRIVATE]: 'Private',
    [videos_1.VideoPrivacy.INTERNAL]: 'Internal'
};
exports.VIDEO_PRIVACIES = VIDEO_PRIVACIES;
const VIDEO_STATES = {
    [models_1.VideoState.PUBLISHED]: 'Published',
    [models_1.VideoState.TO_TRANSCODE]: 'To transcode',
    [models_1.VideoState.TO_IMPORT]: 'To import'
};
exports.VIDEO_STATES = VIDEO_STATES;
const VIDEO_IMPORT_STATES = {
    [videos_1.VideoImportState.FAILED]: 'Failed',
    [videos_1.VideoImportState.PENDING]: 'Pending',
    [videos_1.VideoImportState.SUCCESS]: 'Success',
    [videos_1.VideoImportState.REJECTED]: 'Rejected'
};
exports.VIDEO_IMPORT_STATES = VIDEO_IMPORT_STATES;
const VIDEO_ABUSE_STATES = {
    [videos_1.VideoAbuseState.PENDING]: 'Pending',
    [videos_1.VideoAbuseState.REJECTED]: 'Rejected',
    [videos_1.VideoAbuseState.ACCEPTED]: 'Accepted'
};
exports.VIDEO_ABUSE_STATES = VIDEO_ABUSE_STATES;
const VIDEO_PLAYLIST_PRIVACIES = {
    [video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC]: 'Public',
    [video_playlist_privacy_model_1.VideoPlaylistPrivacy.UNLISTED]: 'Unlisted',
    [video_playlist_privacy_model_1.VideoPlaylistPrivacy.PRIVATE]: 'Private'
};
exports.VIDEO_PLAYLIST_PRIVACIES = VIDEO_PLAYLIST_PRIVACIES;
const VIDEO_PLAYLIST_TYPES = {
    [video_playlist_type_model_1.VideoPlaylistType.REGULAR]: 'Regular',
    [video_playlist_type_model_1.VideoPlaylistType.WATCH_LATER]: 'Watch later'
};
exports.VIDEO_PLAYLIST_TYPES = VIDEO_PLAYLIST_TYPES;
const MIMETYPES = {
    AUDIO: {
        MIMETYPE_EXT: {
            'audio/mpeg': '.mp3',
            'audio/mp3': '.mp3',
            'application/ogg': '.ogg',
            'audio/ogg': '.ogg',
            'audio/x-ms-wma': '.wma',
            'audio/wav': '.wav',
            'audio/x-flac': '.flac',
            'audio/flac': '.flac'
        },
        EXT_MIMETYPE: null
    },
    VIDEO: {
        MIMETYPE_EXT: null,
        EXT_MIMETYPE: null
    },
    IMAGE: {
        MIMETYPE_EXT: {
            'image/png': '.png',
            'image/jpg': '.jpg',
            'image/jpeg': '.jpg'
        },
        EXT_MIMETYPE: null
    },
    VIDEO_CAPTIONS: {
        MIMETYPE_EXT: {
            'text/vtt': '.vtt',
            'application/x-subrip': '.srt',
            'text/plain': '.srt'
        }
    },
    TORRENT: {
        MIMETYPE_EXT: {
            'application/x-bittorrent': '.torrent'
        }
    }
};
exports.MIMETYPES = MIMETYPES;
MIMETYPES.AUDIO.EXT_MIMETYPE = lodash_1.invert(MIMETYPES.AUDIO.MIMETYPE_EXT);
MIMETYPES.IMAGE.EXT_MIMETYPE = lodash_1.invert(MIMETYPES.IMAGE.MIMETYPE_EXT);
const OVERVIEWS = {
    VIDEOS: {
        SAMPLE_THRESHOLD: 6,
        SAMPLES_COUNT: 20
    }
};
exports.OVERVIEWS = OVERVIEWS;
const VIDEO_CHANNELS = {
    MAX_PER_USER: 20
};
exports.VIDEO_CHANNELS = VIDEO_CHANNELS;
const SERVER_ACTOR_NAME = 'peertube';
exports.SERVER_ACTOR_NAME = SERVER_ACTOR_NAME;
const ACTIVITY_PUB = {
    POTENTIAL_ACCEPT_HEADERS: [
        'application/activity+json',
        'application/ld+json',
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    ],
    ACCEPT_HEADER: 'application/activity+json, application/ld+json',
    PUBLIC: 'https://www.w3.org/ns/activitystreams#Public',
    COLLECTION_ITEMS_PER_PAGE: 10,
    FETCH_PAGE_LIMIT: 2000,
    URL_MIME_TYPES: {
        VIDEO: [],
        TORRENT: ['application/x-bittorrent'],
        MAGNET: ['application/x-bittorrent;x-scheme-handler/magnet']
    },
    MAX_RECURSION_COMMENTS: 100,
    ACTOR_REFRESH_INTERVAL: 3600 * 24 * 1000 * 2,
    VIDEO_REFRESH_INTERVAL: 3600 * 24 * 1000 * 2,
    VIDEO_PLAYLIST_REFRESH_INTERVAL: 3600 * 24 * 1000 * 2
};
exports.ACTIVITY_PUB = ACTIVITY_PUB;
const ACTIVITY_PUB_ACTOR_TYPES = {
    GROUP: 'Group',
    PERSON: 'Person',
    APPLICATION: 'Application',
    ORGANIZATION: 'Organization',
    SERVICE: 'Service'
};
exports.ACTIVITY_PUB_ACTOR_TYPES = ACTIVITY_PUB_ACTOR_TYPES;
const HTTP_SIGNATURE = {
    HEADER_NAME: 'signature',
    ALGORITHM: 'rsa-sha256',
    HEADERS_TO_SIGN: ['(request-target)', 'host', 'date', 'digest'],
    CLOCK_SKEW_SECONDS: 1800
};
exports.HTTP_SIGNATURE = HTTP_SIGNATURE;
let PRIVATE_RSA_KEY_SIZE = 2048;
exports.PRIVATE_RSA_KEY_SIZE = PRIVATE_RSA_KEY_SIZE;
const BCRYPT_SALT_SIZE = 10;
exports.BCRYPT_SALT_SIZE = BCRYPT_SALT_SIZE;
const USER_PASSWORD_RESET_LIFETIME = 60000 * 60;
exports.USER_PASSWORD_RESET_LIFETIME = USER_PASSWORD_RESET_LIFETIME;
const USER_PASSWORD_CREATE_LIFETIME = 60000 * 60 * 24 * 7;
exports.USER_PASSWORD_CREATE_LIFETIME = USER_PASSWORD_CREATE_LIFETIME;
const USER_EMAIL_VERIFY_LIFETIME = 60000 * 60;
exports.USER_EMAIL_VERIFY_LIFETIME = USER_EMAIL_VERIFY_LIFETIME;
const NSFW_POLICY_TYPES = {
    DO_NOT_LIST: 'do_not_list',
    BLUR: 'blur',
    DISPLAY: 'display'
};
exports.NSFW_POLICY_TYPES = NSFW_POLICY_TYPES;
const STATIC_PATHS = {
    PREVIEWS: '/static/previews/',
    THUMBNAILS: '/static/thumbnails/',
    TORRENTS: '/static/torrents/',
    WEBSEED: '/static/webseed/',
    REDUNDANCY: '/static/redundancy/',
    STREAMING_PLAYLISTS: {
        HLS: '/static/streaming-playlists/hls'
    },
    AVATARS: '/static/avatars/',
    VIDEO_CAPTIONS: '/static/video-captions/'
};
exports.STATIC_PATHS = STATIC_PATHS;
const STATIC_DOWNLOAD_PATHS = {
    TORRENTS: '/download/torrents/',
    VIDEOS: '/download/videos/',
    HLS_VIDEOS: '/download/streaming-playlists/hls/videos/'
};
exports.STATIC_DOWNLOAD_PATHS = STATIC_DOWNLOAD_PATHS;
const LAZY_STATIC_PATHS = {
    AVATARS: '/lazy-static/avatars/',
    PREVIEWS: '/static/previews/',
    VIDEO_CAPTIONS: '/static/video-captions/'
};
exports.LAZY_STATIC_PATHS = LAZY_STATIC_PATHS;
const STATIC_MAX_AGE = {
    SERVER: '2h',
    CLIENT: '30d'
};
exports.STATIC_MAX_AGE = STATIC_MAX_AGE;
const THUMBNAILS_SIZE = {
    width: 223,
    height: 122,
    minWidth: 150
};
exports.THUMBNAILS_SIZE = THUMBNAILS_SIZE;
const PREVIEWS_SIZE = {
    width: 850,
    height: 480,
    minWidth: 400
};
exports.PREVIEWS_SIZE = PREVIEWS_SIZE;
const AVATARS_SIZE = {
    width: 120,
    height: 120
};
exports.AVATARS_SIZE = AVATARS_SIZE;
const EMBED_SIZE = {
    width: 560,
    height: 315
};
exports.EMBED_SIZE = EMBED_SIZE;
const FILES_CACHE = {
    PREVIEWS: {
        DIRECTORY: path_1.join(config_1.CONFIG.STORAGE.CACHE_DIR, 'previews'),
        MAX_AGE: 1000 * 3600 * 3
    },
    VIDEO_CAPTIONS: {
        DIRECTORY: path_1.join(config_1.CONFIG.STORAGE.CACHE_DIR, 'video-captions'),
        MAX_AGE: 1000 * 3600 * 3
    }
};
exports.FILES_CACHE = FILES_CACHE;
const LRU_CACHE = {
    USER_TOKENS: {
        MAX_SIZE: 1000
    },
    AVATAR_STATIC: {
        MAX_SIZE: 500
    }
};
exports.LRU_CACHE = LRU_CACHE;
const HLS_STREAMING_PLAYLIST_DIRECTORY = path_1.join(config_1.CONFIG.STORAGE.STREAMING_PLAYLISTS_DIR, 'hls');
exports.HLS_STREAMING_PLAYLIST_DIRECTORY = HLS_STREAMING_PLAYLIST_DIRECTORY;
const HLS_REDUNDANCY_DIRECTORY = path_1.join(config_1.CONFIG.STORAGE.REDUNDANCY_DIR, 'hls');
exports.HLS_REDUNDANCY_DIRECTORY = HLS_REDUNDANCY_DIRECTORY;
const MEMOIZE_TTL = {
    OVERVIEWS_SAMPLE: 1000 * 3600 * 4,
    INFO_HASH_EXISTS: 1000 * 3600 * 12
};
exports.MEMOIZE_TTL = MEMOIZE_TTL;
const MEMOIZE_LENGTH = {
    INFO_HASH_EXISTS: 200
};
exports.MEMOIZE_LENGTH = MEMOIZE_LENGTH;
const QUEUE_CONCURRENCY = {
    AVATAR_PROCESS_IMAGE: 3
};
exports.QUEUE_CONCURRENCY = QUEUE_CONCURRENCY;
const REDUNDANCY = {
    VIDEOS: {
        RANDOMIZED_FACTOR: 5
    }
};
exports.REDUNDANCY = REDUNDANCY;
const ACCEPT_HEADERS = ['html', 'application/json'].concat(ACTIVITY_PUB.POTENTIAL_ACCEPT_HEADERS);
exports.ACCEPT_HEADERS = ACCEPT_HEADERS;
const ASSETS_PATH = {
    DEFAULT_AUDIO_BACKGROUND: path_1.join(core_utils_1.root(), 'dist', 'server', 'assets', 'default-audio-background.jpg')
};
exports.ASSETS_PATH = ASSETS_PATH;
const CUSTOM_HTML_TAG_COMMENTS = {
    TITLE: '<!-- title tag -->',
    DESCRIPTION: '<!-- description tag -->',
    CUSTOM_CSS: '<!-- custom css tag -->',
    META_TAGS: '<!-- meta tags -->'
};
exports.CUSTOM_HTML_TAG_COMMENTS = CUSTOM_HTML_TAG_COMMENTS;
const FEEDS = {
    COUNT: 20
};
exports.FEEDS = FEEDS;
const MAX_LOGS_OUTPUT_CHARACTERS = 10 * 1000 * 1000;
exports.MAX_LOGS_OUTPUT_CHARACTERS = MAX_LOGS_OUTPUT_CHARACTERS;
const LOG_FILENAME = 'peertube.log';
exports.LOG_FILENAME = LOG_FILENAME;
const AUDIT_LOG_FILENAME = 'peertube-audit.log';
exports.AUDIT_LOG_FILENAME = AUDIT_LOG_FILENAME;
const TRACKER_RATE_LIMITS = {
    INTERVAL: 60000 * 5,
    ANNOUNCES_PER_IP_PER_INFOHASH: 15,
    ANNOUNCES_PER_IP: 30
};
exports.TRACKER_RATE_LIMITS = TRACKER_RATE_LIMITS;
const P2P_MEDIA_LOADER_PEER_VERSION = 2;
exports.P2P_MEDIA_LOADER_PEER_VERSION = P2P_MEDIA_LOADER_PEER_VERSION;
const PLUGIN_GLOBAL_CSS_FILE_NAME = 'plugins-global.css';
exports.PLUGIN_GLOBAL_CSS_FILE_NAME = PLUGIN_GLOBAL_CSS_FILE_NAME;
const PLUGIN_GLOBAL_CSS_PATH = path_1.join(config_1.CONFIG.STORAGE.TMP_DIR, PLUGIN_GLOBAL_CSS_FILE_NAME);
exports.PLUGIN_GLOBAL_CSS_PATH = PLUGIN_GLOBAL_CSS_PATH;
let PLUGIN_EXTERNAL_AUTH_TOKEN_LIFETIME = 1000 * 60 * 5;
exports.PLUGIN_EXTERNAL_AUTH_TOKEN_LIFETIME = PLUGIN_EXTERNAL_AUTH_TOKEN_LIFETIME;
const DEFAULT_THEME_NAME = 'default';
exports.DEFAULT_THEME_NAME = DEFAULT_THEME_NAME;
const DEFAULT_USER_THEME_NAME = 'instance-default';
exports.DEFAULT_USER_THEME_NAME = DEFAULT_USER_THEME_NAME;
if (core_utils_1.isTestInstance() === true) {
    exports.PRIVATE_RSA_KEY_SIZE = PRIVATE_RSA_KEY_SIZE = 1024;
    ACTOR_FOLLOW_SCORE.BASE = 20;
    REMOTE_SCHEME.HTTP = 'http';
    REMOTE_SCHEME.WS = 'ws';
    STATIC_MAX_AGE.SERVER = '0';
    ACTIVITY_PUB.COLLECTION_ITEMS_PER_PAGE = 2;
    ACTIVITY_PUB.ACTOR_REFRESH_INTERVAL = 10 * 1000;
    ACTIVITY_PUB.VIDEO_REFRESH_INTERVAL = 10 * 1000;
    ACTIVITY_PUB.VIDEO_PLAYLIST_REFRESH_INTERVAL = 10 * 1000;
    CONSTRAINTS_FIELDS.ACTORS.AVATAR.FILE_SIZE.max = 100 * 1024;
    SCHEDULER_INTERVALS_MS.actorFollowScores = 1000;
    SCHEDULER_INTERVALS_MS.removeOldJobs = 10000;
    SCHEDULER_INTERVALS_MS.removeOldHistory = 5000;
    SCHEDULER_INTERVALS_MS.removeOldViews = 5000;
    SCHEDULER_INTERVALS_MS.updateVideos = 5000;
    SCHEDULER_INTERVALS_MS.autoFollowIndexInstances = 5000;
    REPEAT_JOBS['videos-views'] = { every: 5000 };
    REDUNDANCY.VIDEOS.RANDOMIZED_FACTOR = 1;
    exports.VIDEO_VIEW_LIFETIME = VIDEO_VIEW_LIFETIME = 1000;
    exports.CONTACT_FORM_LIFETIME = CONTACT_FORM_LIFETIME = 1000;
    JOB_ATTEMPTS['email'] = 1;
    FILES_CACHE.VIDEO_CAPTIONS.MAX_AGE = 3000;
    MEMOIZE_TTL.OVERVIEWS_SAMPLE = 3000;
    OVERVIEWS.VIDEOS.SAMPLE_THRESHOLD = 2;
    exports.PLUGIN_EXTERNAL_AUTH_TOKEN_LIFETIME = PLUGIN_EXTERNAL_AUTH_TOKEN_LIFETIME = 5000;
}
updateWebserverUrls();
updateWebserverConfig();
config_1.registerConfigChangedHandler(() => {
    updateWebserverUrls();
    updateWebserverConfig();
});
function buildVideoMimetypeExt() {
    const data = {
        'video/webm': '.webm',
        'video/ogg': '.ogv',
        'video/mp4': '.mp4'
    };
    if (config_1.CONFIG.TRANSCODING.ENABLED) {
        if (config_1.CONFIG.TRANSCODING.ALLOW_ADDITIONAL_EXTENSIONS) {
            Object.assign(data, {
                'video/quicktime': '.mov',
                'video/x-msvideo': '.avi',
                'video/x-flv': '.flv',
                'video/x-matroska': '.mkv',
                'video/avi': '.avi',
                'video/x-m4v': '.m4v',
                'application/octet-stream': null,
                'video/m4v': '.m4v'
            });
        }
        if (config_1.CONFIG.TRANSCODING.ALLOW_AUDIO_FILES) {
            Object.assign(data, MIMETYPES.AUDIO.MIMETYPE_EXT);
        }
    }
    return data;
}
function updateWebserverUrls() {
    WEBSERVER.URL = core_utils_1.sanitizeUrl(config_1.CONFIG.WEBSERVER.SCHEME + '://' + config_1.CONFIG.WEBSERVER.HOSTNAME + ':' + config_1.CONFIG.WEBSERVER.PORT);
    WEBSERVER.HOST = core_utils_1.sanitizeHost(config_1.CONFIG.WEBSERVER.HOSTNAME + ':' + config_1.CONFIG.WEBSERVER.PORT, REMOTE_SCHEME.HTTP);
    WEBSERVER.SCHEME = config_1.CONFIG.WEBSERVER.SCHEME;
    WEBSERVER.WS = config_1.CONFIG.WEBSERVER.WS;
    WEBSERVER.HOSTNAME = config_1.CONFIG.WEBSERVER.HOSTNAME;
    WEBSERVER.PORT = config_1.CONFIG.WEBSERVER.PORT;
}
function updateWebserverConfig() {
    MIMETYPES.VIDEO.MIMETYPE_EXT = buildVideoMimetypeExt();
    MIMETYPES.VIDEO.EXT_MIMETYPE = lodash_1.invert(MIMETYPES.VIDEO.MIMETYPE_EXT);
    ACTIVITY_PUB.URL_MIME_TYPES.VIDEO = Object.keys(MIMETYPES.VIDEO.MIMETYPE_EXT);
    CONSTRAINTS_FIELDS.VIDEOS.EXTNAME = buildVideosExtname();
}
function buildVideosExtname() {
    return Object.keys(MIMETYPES.VIDEO.EXT_MIMETYPE);
}
function loadLanguages() {
    Object.assign(VIDEO_LANGUAGES, buildLanguages());
}
exports.loadLanguages = loadLanguages;
function buildLanguages() {
    const iso639 = require('iso-639-3');
    const languages = {};
    const additionalLanguages = {
        sgn: true,
        ase: true,
        sdl: true,
        bfi: true,
        bzs: true,
        csl: true,
        cse: true,
        dsl: true,
        fsl: true,
        gsg: true,
        pks: true,
        jsl: true,
        sfs: true,
        swl: true,
        rsl: true,
        epo: true,
        tlh: true,
        jbo: true,
        avk: true
    };
    iso639
        .filter(l => {
        return (l.iso6391 !== undefined && l.type === 'living') ||
            additionalLanguages[l.iso6393] === true;
    })
        .forEach(l => { languages[l.iso6391 || l.iso6393] = l.name; });
    languages['oc'] = 'Occitan';
    languages['el'] = 'Greek';
    return languages;
}
exports.buildLanguages = buildLanguages;
