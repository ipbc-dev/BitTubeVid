"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVideoFilterValid = exports.isVideoSupportValid = exports.isVideoImage = exports.isVideoFileSizeValid = exports.isVideoFileResolutionValid = exports.isVideoPrivacyValid = exports.isVideoTagValid = exports.isVideoDurationValid = exports.isVideoFileExtnameValid = exports.isVideoRatingTypeValid = exports.isVideoViewsValid = exports.isVideoStateValid = exports.isVideoMagnetUriValid = exports.isVideoFile = exports.isVideoOriginallyPublishedAtValid = exports.isScheduleVideoUpdatePrivacyValid = exports.isVideoFPSResolutionValid = exports.isVideoTagsValid = exports.isVideoNameValid = exports.isVideoFileInfoHashValid = exports.isVideoDescriptionValid = exports.isVideoTruncatedDescriptionValid = exports.isVideoLanguageValid = exports.isVideoLicenceValid = exports.isVideoCategoryValid = void 0;
const lodash_1 = require("lodash");
const validator_1 = require("validator");
const constants_1 = require("../../initializers/constants");
const misc_1 = require("./misc");
const magnetUtil = require("magnet-uri");
const VIDEOS_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEOS;
function isVideoFilterValid(filter) {
    return filter === 'local' || filter === 'all-local';
}
exports.isVideoFilterValid = isVideoFilterValid;
function isVideoCategoryValid(value) {
    return value === null || constants_1.VIDEO_CATEGORIES[value] !== undefined;
}
exports.isVideoCategoryValid = isVideoCategoryValid;
function isVideoStateValid(value) {
    return misc_1.exists(value) && constants_1.VIDEO_STATES[value] !== undefined;
}
exports.isVideoStateValid = isVideoStateValid;
function isVideoLicenceValid(value) {
    return value === null || constants_1.VIDEO_LICENCES[value] !== undefined;
}
exports.isVideoLicenceValid = isVideoLicenceValid;
function isVideoLanguageValid(value) {
    return value === null ||
        (typeof value === 'string' && validator_1.default.isLength(value, VIDEOS_CONSTRAINTS_FIELDS.LANGUAGE));
}
exports.isVideoLanguageValid = isVideoLanguageValid;
function isVideoDurationValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt(value + '', VIDEOS_CONSTRAINTS_FIELDS.DURATION);
}
exports.isVideoDurationValid = isVideoDurationValid;
function isVideoTruncatedDescriptionValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, VIDEOS_CONSTRAINTS_FIELDS.TRUNCATED_DESCRIPTION);
}
exports.isVideoTruncatedDescriptionValid = isVideoTruncatedDescriptionValid;
function isVideoDescriptionValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isLength(value, VIDEOS_CONSTRAINTS_FIELDS.DESCRIPTION));
}
exports.isVideoDescriptionValid = isVideoDescriptionValid;
function isVideoSupportValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isLength(value, VIDEOS_CONSTRAINTS_FIELDS.SUPPORT));
}
exports.isVideoSupportValid = isVideoSupportValid;
function isVideoNameValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, VIDEOS_CONSTRAINTS_FIELDS.NAME);
}
exports.isVideoNameValid = isVideoNameValid;
function isVideoTagValid(tag) {
    return misc_1.exists(tag) && validator_1.default.isLength(tag, VIDEOS_CONSTRAINTS_FIELDS.TAG);
}
exports.isVideoTagValid = isVideoTagValid;
function isVideoTagsValid(tags) {
    return tags === null || (misc_1.isArray(tags) &&
        validator_1.default.isInt(tags.length.toString(), VIDEOS_CONSTRAINTS_FIELDS.TAGS) &&
        tags.every(tag => isVideoTagValid(tag)));
}
exports.isVideoTagsValid = isVideoTagsValid;
function isVideoViewsValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt(value + '', VIDEOS_CONSTRAINTS_FIELDS.VIEWS);
}
exports.isVideoViewsValid = isVideoViewsValid;
function isVideoRatingTypeValid(value) {
    return value === 'none' || lodash_1.values(constants_1.VIDEO_RATE_TYPES).includes(value);
}
exports.isVideoRatingTypeValid = isVideoRatingTypeValid;
function isVideoFileExtnameValid(value) {
    return misc_1.exists(value) && constants_1.MIMETYPES.VIDEO.EXT_MIMETYPE[value] !== undefined;
}
exports.isVideoFileExtnameValid = isVideoFileExtnameValid;
function isVideoFile(files) {
    return misc_1.isFileValid(files, constants_1.MIMETYPES.VIDEO.MIMETYPES_REGEX, 'videofile', null);
}
exports.isVideoFile = isVideoFile;
const videoImageTypes = constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.EXTNAME
    .map(v => v.replace('.', ''))
    .join('|');
const videoImageTypesRegex = `image/(${videoImageTypes})`;
function isVideoImage(files, field) {
    return misc_1.isFileValid(files, videoImageTypesRegex, field, constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.FILE_SIZE.max, true);
}
exports.isVideoImage = isVideoImage;
function isVideoPrivacyValid(value) {
    return constants_1.VIDEO_PRIVACIES[value] !== undefined;
}
exports.isVideoPrivacyValid = isVideoPrivacyValid;
function isScheduleVideoUpdatePrivacyValid(value) {
    return value === 2 || value === 1 || value === 4;
}
exports.isScheduleVideoUpdatePrivacyValid = isScheduleVideoUpdatePrivacyValid;
function isVideoOriginallyPublishedAtValid(value) {
    return value === null || misc_1.isDateValid(value);
}
exports.isVideoOriginallyPublishedAtValid = isVideoOriginallyPublishedAtValid;
function isVideoFileInfoHashValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, VIDEOS_CONSTRAINTS_FIELDS.INFO_HASH);
}
exports.isVideoFileInfoHashValid = isVideoFileInfoHashValid;
function isVideoFileResolutionValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt(value + '');
}
exports.isVideoFileResolutionValid = isVideoFileResolutionValid;
function isVideoFPSResolutionValid(value) {
    return value === null || validator_1.default.isInt(value + '');
}
exports.isVideoFPSResolutionValid = isVideoFPSResolutionValid;
function isVideoFileSizeValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt(value + '', VIDEOS_CONSTRAINTS_FIELDS.FILE_SIZE);
}
exports.isVideoFileSizeValid = isVideoFileSizeValid;
function isVideoMagnetUriValid(value) {
    if (!misc_1.exists(value))
        return false;
    const parsed = magnetUtil.decode(value);
    return parsed && isVideoFileInfoHashValid(parsed.infoHash);
}
exports.isVideoMagnetUriValid = isVideoMagnetUriValid;
