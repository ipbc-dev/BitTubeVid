"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAbuseVideoIsValid = exports.isAbuseStateValid = exports.isAbuseModerationCommentValid = exports.isAbuseTimestampCoherent = exports.isAbuseTimestampValid = exports.areAbusePredefinedReasonsValid = exports.isAbuseMessageValid = exports.isAbusePredefinedReasonValid = exports.isAbuseFilterValid = exports.isAbuseReasonValid = void 0;
const validator_1 = require("validator");
const abuse_1 = require("@shared/core-utils/abuse");
const constants_1 = require("../../initializers/constants");
const misc_1 = require("./misc");
const ABUSES_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.ABUSES;
const ABUSE_MESSAGES_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.ABUSE_MESSAGES;
function isAbuseReasonValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, ABUSES_CONSTRAINTS_FIELDS.REASON);
}
exports.isAbuseReasonValid = isAbuseReasonValid;
function isAbusePredefinedReasonValid(value) {
    return misc_1.exists(value) && value in abuse_1.abusePredefinedReasonsMap;
}
exports.isAbusePredefinedReasonValid = isAbusePredefinedReasonValid;
function isAbuseFilterValid(value) {
    return value === 'video' || value === 'comment' || value === 'account';
}
exports.isAbuseFilterValid = isAbuseFilterValid;
function areAbusePredefinedReasonsValid(value) {
    return misc_1.exists(value) && misc_1.isArray(value) && value.every(v => v in abuse_1.abusePredefinedReasonsMap);
}
exports.areAbusePredefinedReasonsValid = areAbusePredefinedReasonsValid;
function isAbuseTimestampValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isInt('' + value, { min: 0 }));
}
exports.isAbuseTimestampValid = isAbuseTimestampValid;
function isAbuseTimestampCoherent(endAt, { req }) {
    const startAt = req.body.video.startAt;
    return misc_1.exists(startAt) && endAt > startAt;
}
exports.isAbuseTimestampCoherent = isAbuseTimestampCoherent;
function isAbuseModerationCommentValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, ABUSES_CONSTRAINTS_FIELDS.MODERATION_COMMENT);
}
exports.isAbuseModerationCommentValid = isAbuseModerationCommentValid;
function isAbuseStateValid(value) {
    return misc_1.exists(value) && constants_1.ABUSE_STATES[value] !== undefined;
}
exports.isAbuseStateValid = isAbuseStateValid;
function isAbuseVideoIsValid(value) {
    return misc_1.exists(value) && (value === 'deleted' ||
        value === 'blacklisted');
}
exports.isAbuseVideoIsValid = isAbuseVideoIsValid;
function isAbuseMessageValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, ABUSE_MESSAGES_CONSTRAINTS_FIELDS.MESSAGE);
}
exports.isAbuseMessageValid = isAbuseMessageValid;
