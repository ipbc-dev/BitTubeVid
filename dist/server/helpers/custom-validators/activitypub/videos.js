"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAPVideoFileMetadataObject = exports.isRemoteVideoUrlValid = exports.sanitizeAndCheckVideoTorrentObject = exports.isRemoteStringIdentifierValid = exports.sanitizeAndCheckVideoTorrentUpdateActivity = void 0;
const validator_1 = require("validator");
const constants_1 = require("../../../initializers/constants");
const core_utils_1 = require("../../core-utils");
const misc_1 = require("../misc");
const videos_1 = require("../videos");
const misc_2 = require("./misc");
const videos_2 = require("../../../../shared/models/videos");
const logger_1 = require("@server/helpers/logger");
function sanitizeAndCheckVideoTorrentUpdateActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Update') &&
        sanitizeAndCheckVideoTorrentObject(activity.object);
}
exports.sanitizeAndCheckVideoTorrentUpdateActivity = sanitizeAndCheckVideoTorrentUpdateActivity;
function isActivityPubVideoDurationValid(value) {
    return misc_1.exists(value) &&
        typeof value === 'string' &&
        value.startsWith('PT') &&
        value.endsWith('S') &&
        videos_1.isVideoDurationValid(value.replace(/[^0-9]+/g, ''));
}
function sanitizeAndCheckVideoTorrentObject(video) {
    if (!video || video.type !== 'Video')
        return false;
    if (!setValidRemoteTags(video)) {
        logger_1.logger.debug('Video has invalid tags', { video });
        return false;
    }
    if (!setValidRemoteVideoUrls(video)) {
        logger_1.logger.debug('Video has invalid urls', { video });
        return false;
    }
    if (!setRemoteVideoTruncatedContent(video)) {
        logger_1.logger.debug('Video has invalid content', { video });
        return false;
    }
    if (!misc_2.setValidAttributedTo(video)) {
        logger_1.logger.debug('Video has invalid attributedTo', { video });
        return false;
    }
    if (!setValidRemoteCaptions(video)) {
        logger_1.logger.debug('Video has invalid captions', { video });
        return false;
    }
    if (!setValidRemoteIcon(video)) {
        logger_1.logger.debug('Video has invalid icons', { video });
        return false;
    }
    if (!videos_1.isVideoStateValid(video.state))
        video.state = videos_2.VideoState.PUBLISHED;
    if (!misc_1.isBooleanValid(video.waitTranscoding))
        video.waitTranscoding = false;
    if (!misc_1.isBooleanValid(video.downloadEnabled))
        video.downloadEnabled = true;
    if (!misc_1.isBooleanValid(video.commentsEnabled))
        video.commentsEnabled = false;
    return misc_2.isActivityPubUrlValid(video.id) &&
        videos_1.isVideoNameValid(video.name) &&
        isActivityPubVideoDurationValid(video.duration) &&
        misc_1.isUUIDValid(video.uuid) &&
        (!video.category || isRemoteNumberIdentifierValid(video.category)) &&
        (!video.licence || isRemoteNumberIdentifierValid(video.licence)) &&
        (!video.language || isRemoteStringIdentifierValid(video.language)) &&
        videos_1.isVideoViewsValid(video.views) &&
        misc_1.isBooleanValid(video.sensitive) &&
        misc_1.isBooleanValid(video.commentsEnabled) &&
        misc_1.isBooleanValid(video.downloadEnabled) &&
        misc_1.isDateValid(video.published) &&
        misc_1.isDateValid(video.updated) &&
        (!video.originallyPublishedAt || misc_1.isDateValid(video.originallyPublishedAt)) &&
        (!video.content || isRemoteVideoContentValid(video.mediaType, video.content)) &&
        video.url.length !== 0 &&
        video.attributedTo.length !== 0;
}
exports.sanitizeAndCheckVideoTorrentObject = sanitizeAndCheckVideoTorrentObject;
function isRemoteVideoUrlValid(url) {
    return url.type === 'Link' &&
        (constants_1.ACTIVITY_PUB.URL_MIME_TYPES.VIDEO.includes(url.mediaType) &&
            misc_2.isActivityPubUrlValid(url.href) &&
            validator_1.default.isInt(url.height + '', { min: 0 }) &&
            validator_1.default.isInt(url.size + '', { min: 0 }) &&
            (!url.fps || validator_1.default.isInt(url.fps + '', { min: -1 }))) ||
        (constants_1.ACTIVITY_PUB.URL_MIME_TYPES.TORRENT.includes(url.mediaType) &&
            misc_2.isActivityPubUrlValid(url.href) &&
            validator_1.default.isInt(url.height + '', { min: 0 })) ||
        (constants_1.ACTIVITY_PUB.URL_MIME_TYPES.MAGNET.includes(url.mediaType) &&
            validator_1.default.isLength(url.href, { min: 5 }) &&
            validator_1.default.isInt(url.height + '', { min: 0 })) ||
        ((url.mediaType || url.mimeType) === 'application/x-mpegURL' &&
            misc_2.isActivityPubUrlValid(url.href) &&
            misc_1.isArray(url.tag)) ||
        isAPVideoFileMetadataObject(url);
}
exports.isRemoteVideoUrlValid = isRemoteVideoUrlValid;
function isAPVideoFileMetadataObject(url) {
    return url &&
        url.type === 'Link' &&
        url.mediaType === 'application/json' &&
        misc_1.isArray(url.rel) && url.rel.includes('metadata');
}
exports.isAPVideoFileMetadataObject = isAPVideoFileMetadataObject;
function setValidRemoteTags(video) {
    if (Array.isArray(video.tag) === false)
        return false;
    video.tag = video.tag.filter(t => {
        return t.type === 'Hashtag' &&
            videos_1.isVideoTagValid(t.name);
    });
    return true;
}
function setValidRemoteCaptions(video) {
    if (!video.subtitleLanguage)
        video.subtitleLanguage = [];
    if (Array.isArray(video.subtitleLanguage) === false)
        return false;
    video.subtitleLanguage = video.subtitleLanguage.filter(caption => {
        if (!misc_2.isActivityPubUrlValid(caption.url))
            caption.url = null;
        return isRemoteStringIdentifierValid(caption);
    });
    return true;
}
function isRemoteNumberIdentifierValid(data) {
    return validator_1.default.isInt(data.identifier, { min: 0 });
}
function isRemoteStringIdentifierValid(data) {
    return typeof data.identifier === 'string';
}
exports.isRemoteStringIdentifierValid = isRemoteStringIdentifierValid;
function isRemoteVideoContentValid(mediaType, content) {
    return mediaType === 'text/markdown' && videos_1.isVideoTruncatedDescriptionValid(content);
}
function setValidRemoteIcon(video) {
    if (video.icon && !misc_1.isArray(video.icon))
        video.icon = [video.icon];
    if (!video.icon)
        video.icon = [];
    video.icon = video.icon.filter(icon => {
        return icon.type === 'Image' &&
            misc_2.isActivityPubUrlValid(icon.url) &&
            icon.mediaType === 'image/jpeg' &&
            validator_1.default.isInt(icon.width + '', { min: 0 }) &&
            validator_1.default.isInt(icon.height + '', { min: 0 });
    });
    return video.icon.length !== 0;
}
function setValidRemoteVideoUrls(video) {
    if (Array.isArray(video.url) === false)
        return false;
    video.url = video.url.filter(u => isRemoteVideoUrlValid(u));
    return true;
}
function setRemoteVideoTruncatedContent(video) {
    if (video.content) {
        video.content = core_utils_1.peertubeTruncate(video.content, { length: constants_1.CONSTRAINTS_FIELDS.VIDEOS.TRUNCATED_DESCRIPTION.max });
    }
    return true;
}
