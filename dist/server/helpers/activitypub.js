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
const validator_1 = require("validator");
const constants_1 = require("../initializers/constants");
const peertube_crypto_1 = require("./peertube-crypto");
const core_utils_1 = require("./core-utils");
const url_1 = require("url");
function activityPubContextify(data) {
    return Object.assign(data, {
        '@context': [
            'https://www.w3.org/ns/activitystreams',
            'https://w3id.org/security/v1',
            {
                RsaSignature2017: 'https://w3id.org/security#RsaSignature2017',
                pt: 'https://joinpeertube.org/ns#',
                sc: 'http://schema.org#',
                Hashtag: 'as:Hashtag',
                uuid: 'sc:identifier',
                category: 'sc:category',
                licence: 'sc:license',
                subtitleLanguage: 'sc:subtitleLanguage',
                sensitive: 'as:sensitive',
                language: 'sc:inLanguage',
                expires: 'sc:expires',
                CacheFile: 'pt:CacheFile',
                Infohash: 'pt:Infohash',
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
                }
            },
            {
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
            }
        ]
    });
}
exports.activityPubContextify = activityPubContextify;
function activityPubCollectionPagination(baseUrl, handler, page, size = constants_1.ACTIVITY_PUB.COLLECTION_ITEMS_PER_PAGE) {
    return __awaiter(this, void 0, void 0, function* () {
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
function buildSignedActivity(byActor, data) {
    const activity = activityPubContextify(data);
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
    const idHost = url_1.parse(url1).host;
    const actorHost = url_1.parse(url2).host;
    return idHost && actorHost && idHost.toLowerCase() === actorHost.toLowerCase();
}
exports.checkUrlsSameHost = checkUrlsSameHost;
