"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRemoteVideoBaseUrl = exports.buildSignedActivity = exports.activityPubCollectionPagination = exports.activityPubContextify = exports.getAPId = exports.checkUrlsSameHost = void 0;
const tslib_1 = require("tslib");
const url_1 = require("url");
const validator_1 = require("validator");
const constants_1 = require("../initializers/constants");
const core_utils_1 = require("./core-utils");
const peertube_crypto_1 = require("./peertube-crypto");
function getContextData(type) {
    const context = [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
        {
            RsaSignature2017: 'https://w3id.org/security#RsaSignature2017'
        }
    ];
    if (type !== 'View' && type !== 'Announce') {
        const additional = {
            pt: 'https://joinpeertube.org/ns#',
            sc: 'http://schema.org#'
        };
        if (type === 'CacheFile') {
            Object.assign(additional, {
                expires: 'sc:expires',
                CacheFile: 'pt:CacheFile'
            });
        }
        else {
            Object.assign(additional, {
                Hashtag: 'as:Hashtag',
                uuid: 'sc:identifier',
                category: 'sc:category',
                licence: 'sc:license',
                subtitleLanguage: 'sc:subtitleLanguage',
                sensitive: 'as:sensitive',
                language: 'sc:inLanguage',
                isLiveBroadcast: 'sc:isLiveBroadcast',
                liveSaveReplay: {
                    '@type': 'sc:Boolean',
                    '@id': 'pt:liveSaveReplay'
                },
                permanentLive: {
                    '@type': 'sc:Boolean',
                    '@id': 'pt:permanentLive'
                },
                Infohash: 'pt:Infohash',
                Playlist: 'pt:Playlist',
                PlaylistElement: 'pt:PlaylistElement',
                originallyPublishedAt: 'sc:datePublished',
                views: {
                    '@type': 'sc:Number',
                    '@id': 'pt:views'
                },
                state: {
                    '@type': 'sc:Number',
                    '@id': 'pt:state'
                },
                size: {
                    '@type': 'sc:Number',
                    '@id': 'pt:size'
                },
                fps: {
                    '@type': 'sc:Number',
                    '@id': 'pt:fps'
                },
                startTimestamp: {
                    '@type': 'sc:Number',
                    '@id': 'pt:startTimestamp'
                },
                stopTimestamp: {
                    '@type': 'sc:Number',
                    '@id': 'pt:stopTimestamp'
                },
                position: {
                    '@type': 'sc:Number',
                    '@id': 'pt:position'
                },
                commentsEnabled: {
                    '@type': 'sc:Boolean',
                    '@id': 'pt:commentsEnabled'
                },
                downloadEnabled: {
                    '@type': 'sc:Boolean',
                    '@id': 'pt:downloadEnabled'
                },
                waitTranscoding: {
                    '@type': 'sc:Boolean',
                    '@id': 'pt:waitTranscoding'
                },
                support: {
                    '@type': 'sc:Text',
                    '@id': 'pt:support'
                },
                likes: {
                    '@id': 'as:likes',
                    '@type': '@id'
                },
                dislikes: {
                    '@id': 'as:dislikes',
                    '@type': '@id'
                },
                playlists: {
                    '@id': 'pt:playlists',
                    '@type': '@id'
                },
                shares: {
                    '@id': 'as:shares',
                    '@type': '@id'
                },
                comments: {
                    '@id': 'as:comments',
                    '@type': '@id'
                }
            });
        }
        context.push(additional);
    }
    return {
        '@context': context
    };
}
function activityPubContextify(data, type = 'All') {
    return Object.assign({}, data, getContextData(type));
}
exports.activityPubContextify = activityPubContextify;
function activityPubCollectionPagination(baseUrl, handler, page, size = constants_1.ACTIVITY_PUB.COLLECTION_ITEMS_PER_PAGE) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!page || !validator_1.default.isInt(page)) {
            const result = yield handler(0, 1);
            return {
                id: baseUrl,
                type: 'OrderedCollectionPage',
                totalItems: result.total,
                first: baseUrl + '?page=1'
            };
        }
        const { start, count } = core_utils_1.pageToStartAndCount(page, size);
        const result = yield handler(start, count);
        let next;
        let prev;
        page = parseInt(page, 10);
        if (result.total > page * size) {
            next = baseUrl + '?page=' + (page + 1);
        }
        if (page > 1) {
            prev = baseUrl + '?page=' + (page - 1);
        }
        return {
            id: baseUrl + '?page=' + page,
            type: 'OrderedCollectionPage',
            prev,
            next,
            partOf: baseUrl,
            orderedItems: result.data,
            totalItems: result.total
        };
    });
}
exports.activityPubCollectionPagination = activityPubCollectionPagination;
function buildSignedActivity(byActor, data, contextType) {
    const activity = activityPubContextify(data, contextType);
    return peertube_crypto_1.signJsonLDObject(byActor, activity);
}
exports.buildSignedActivity = buildSignedActivity;
function getAPId(activity) {
    if (typeof activity === 'string')
        return activity;
    return activity.id;
}
exports.getAPId = getAPId;
function checkUrlsSameHost(url1, url2) {
    const idHost = new url_1.URL(url1).host;
    const actorHost = new url_1.URL(url2).host;
    return idHost && actorHost && idHost.toLowerCase() === actorHost.toLowerCase();
}
exports.checkUrlsSameHost = checkUrlsSameHost;
function buildRemoteVideoBaseUrl(video, path, scheme) {
    if (!scheme)
        scheme = constants_1.REMOTE_SCHEME.HTTP;
    const host = video.VideoChannel.Actor.Server.host;
    return scheme + '://' + host + path;
}
exports.buildRemoteVideoBaseUrl = buildRemoteVideoBaseUrl;
