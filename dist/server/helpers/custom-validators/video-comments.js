"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("multer");
const validator_1 = require("validator");
const constants_1 = require("../../initializers/constants");
const VIDEO_COMMENTS_CONSTRAINTS_FIELDS = constants_1.CONSTRAINTS_FIELDS.VIDEO_COMMENTS;
function isValidVideoCommentText(value) {
    return value === null || validator_1.default.isLength(value, VIDEO_COMMENTS_CONSTRAINTS_FIELDS.TEXT);
}
exports.isValidVideoCommentText = isValidVideoCommentText;
