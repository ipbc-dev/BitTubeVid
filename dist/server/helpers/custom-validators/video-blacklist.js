"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
const misc_1 = require("./misc");
const constants_1 = require("../../initializers/constants");
const videos_1 = require("../../../shared/models/videos");
const VIDEO_BLACKLIST_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEO_BLACKLIST;
function isVideoBlacklistReasonValid(value) {
    return value === null || validator_1.default.isLength(value, VIDEO_BLACKLIST_CONSTRAINTS_FIELDS.REASON);
}
exports.isVideoBlacklistReasonValid = isVideoBlacklistReasonValid;
function isVideoBlacklistTypeValid(value) {
    return misc_1.exists(value) && validator_1.default.isInt('' + value) && videos_1.VideoBlacklistType[value] !== undefined;
}
exports.isVideoBlacklistTypeValid = isVideoBlacklistTypeValid;
