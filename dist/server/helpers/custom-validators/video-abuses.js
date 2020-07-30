"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAbuseVideoIsValid = exports.isVideoAbuseStateValid = exports.isVideoAbuseModerationCommentValid = exports.isVideoAbuseTimestampCoherent = exports.isVideoAbuseTimestampValid = exports.isVideoAbusePredefinedReasonsValid = exports.isVideoAbusePredefinedReasonValid = exports.isVideoAbuseReasonValid = void 0;
const validator_1 = require("validator");
const constants_1 = require("../../initializers/constants");
const misc_1 = require("./misc");
const video_abuse_reason_model_1 = require("@shared/models/videos/abuse/video-abuse-reason.model");
const VIDEO_ABUSES_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEO_ABUSES;
function isVideoAbuseReasonValid(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, VIDEO_ABUSES_CONSTRAINTS_FIELDS.REASON);
}
exports.isVideoAbuseReasonValid = isVideoAbuseReasonValid;
function isVideoAbusePredefinedReasonValid(value) {
    return misc_1.exists(value) && value in video_abuse_reason_model_1.videoAbusePredefinedReasonsMap;
}
exports.isVideoAbusePredefinedReasonValid = isVideoAbusePredefinedReasonValid;
function isVideoAbusePredefinedReasonsValid(value) {
    return misc_1.exists(value) && misc_1.isArray(value) && value.every(v => v in video_abuse_reason_model_1.videoAbusePredefinedReasonsMap);
}
exports.isVideoAbusePredefinedReasonsValid = isVideoAbusePredefinedReasonsValid;
function isVideoAbuseTimestampValid(value) {
    return value === null || (misc_1.exists(value) && validator_1.default.isInt('' + value, { min: 0 }));
}
exports.isVideoAbuseTimestampValid = isVideoAbuseTimestampValid;
function isVideoAbuseTimestampCoherent(endAt, { req }) {
    return misc_1.exists(req.body.startAt) && endAt > req.body.startAt;
}
exports.isVideoAbuseTimestampCoherent = isVideoAbuseTimestampCoherent;
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
