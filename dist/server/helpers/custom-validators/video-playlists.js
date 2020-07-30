"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVideoPlaylistTypeValid = exports.isVideoPlaylistTimestampValid = exports.isVideoPlaylistPrivacyValid = exports.isVideoPlaylistDescriptionValid = exports.isVideoPlaylistNameValid = void 0;
const misc_1 = require("./misc");
const validator_1 = require("validator");
const constants_1 = require("../../initializers/constants");
const PLAYLISTS_CONSTRAINT_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEO_PLAYLISTS;
function isVideoPlaylistNameValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, PLAYLISTS_CONSTRAINT_FIELDS.NAME);
}
exports.isVideoPlaylistNameValid = isVideoPlaylistNameValid;
function isVideoPlaylistDescriptionValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isLength(value, PLAYLISTS_CONSTRAINT_FIELDS.DESCRIPTION));
}
exports.isVideoPlaylistDescriptionValid = isVideoPlaylistDescriptionValid;
function isVideoPlaylistPrivacyValid(value) {
    return validator_1.default.isInt(value + '') && constants_1.VIDEO_PLAYLIST_PRIVACIES[value] !== undefined;
}
exports.isVideoPlaylistPrivacyValid = isVideoPlaylistPrivacyValid;
function isVideoPlaylistTimestampValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isInt('' + value, { min: 0 }));
}
exports.isVideoPlaylistTimestampValid = isVideoPlaylistTimestampValid;
function isVideoPlaylistTypeValid(value) {
    return misc_1.exists(value) && constants_1.VIDEO_PLAYLIST_TYPES[value] !== undefined;
}
exports.isVideoPlaylistTypeValid = isVideoPlaylistTypeValid;
