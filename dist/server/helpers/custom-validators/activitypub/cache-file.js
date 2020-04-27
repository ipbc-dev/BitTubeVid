"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = require("./misc");
const videos_1 = require("./videos");
const misc_2 = require("../misc");
function isCacheFileObjectValid(object) {
    return misc_2.exists(object) &&
        object.type === 'CacheFile' &&
        (object.expires === null || misc_2.isDateValid(object.expires)) &&
        misc_1.isActivityPubUrlValid(object.object) &&
        (videos_1.isRemoteVideoUrlValid(object.url) || isPlaylistRedundancyUrlValid(object.url));
}
exports.isCacheFileObjectValid = isCacheFileObjectValid;
function isPlaylistRedundancyUrlValid(url) {
    return url.type === 'Link' &&
        (url.mediaType || url.mimeType) === 'application/x-mpegURL' &&
        misc_1.isActivityPubUrlValid(url.href);
}
