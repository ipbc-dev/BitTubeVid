"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
const constants_1 = require("../../initializers/constants");
const misc_1 = require("./misc");
const VIDEO_ABUSES_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEO_ABUSES;
function isVideoAbuseReasonValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, VIDEO_ABUSES_CONSTRAINTS_FIELDS.REASON);
}
exports.isVideoAbuseReasonValid = isVideoAbuseReasonValid;
function isVideoAbuseModerationCommentValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, VIDEO_ABUSES_CONSTRAINTS_FIELDS.MODERATION_COMMENT);
}
exports.isVideoAbuseModerationCommentValid = isVideoAbuseModerationCommentValid;
function isVideoAbuseStateValid(value) {
    return misc_1.exists(value) && constants_1.VIDEO_ABUSE_STATES[value] !== undefined;
}
exports.isVideoAbuseStateValid = isVideoAbuseStateValid;
function isAbuseVideoIsValid(value) {
    return misc_1.exists(value) && (value === 'deleted' ||
        value === 'blacklisted');
}
exports.isAbuseVideoIsValid = isAbuseVideoIsValid;
