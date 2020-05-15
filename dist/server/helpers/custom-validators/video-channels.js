"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
const constants_1 = require("../../initializers/constants");
const misc_1 = require("./misc");
const VIDEO_CHANNELS_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEO_CHANNELS;
function isVideoChannelDescriptionValid(value) {
    return value === null || validator_1.default.isLength(value, VIDEO_CHANNELS_CONSTRAINTS_FIELDS.DESCRIPTION);
}
exports.isVideoChannelDescriptionValid = isVideoChannelDescriptionValid;
function isVideoChannelNameValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, VIDEO_CHANNELS_CONSTRAINTS_FIELDS.NAME);
}
exports.isVideoChannelNameValid = isVideoChannelNameValid;
function isVideoChannelSupportValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isLength(value, VIDEO_CHANNELS_CONSTRAINTS_FIELDS.SUPPORT));
}
exports.isVideoChannelSupportValid = isVideoChannelSupportValid;
