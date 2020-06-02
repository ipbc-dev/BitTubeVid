"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
const constants_1 = require("../../../initializers/constants");
const misc_1 = require("../misc");
const misc_2 = require("./misc");
function sanitizeAndCheckVideoCommentObject(comment) {
    if (!comment)
        return false;
    if (!isCommentTypeValid(comment))
        return false;
    normalizeComment(comment);
    if (comment.type === 'Tombstone') {
        return misc_2.isActivityPubUrlValid(comment.id) &&
            misc_1.isDateValid(comment.published) &&
            misc_1.isDateValid(comment.deleted) &&
            misc_2.isActivityPubUrlValid(comment.url);
    }
    return misc_2.isActivityPubUrlValid(comment.id) &&
        isCommentContentValid(comment.content) &&
        misc_2.isActivityPubUrlValid(comment.inReplyTo) &&
        misc_1.isDateValid(comment.published) &&
        misc_2.isActivityPubUrlValid(comment.url) &&
        misc_1.isArray(comment.to) &&
        (comment.to.indexOf(constants_1.ACTIVITY_PUB.PUBLIC) !== -1 ||
            comment.cc.indexOf(constants_1.ACTIVITY_PUB.PUBLIC) !== -1);
}
exports.sanitizeAndCheckVideoCommentObject = sanitizeAndCheckVideoCommentObject;
function isCommentContentValid(content) {
    return misc_1.exists(content) && validator_1.default.isLength('' + content, { min: 1 });
}
function normalizeComment(comment) {
    if (!comment)
        return;
    if (typeof comment.url !== 'string') {
        if (typeof comment.url === 'object')
            comment.url = comment.url.href || comment.url.url;
        else
            comment.url = comment.id;
    }
}
function isCommentTypeValid(comment) {
    if (comment.type === 'Note')
        return true;
    if (comment.type === 'Tombstone' && comment.formerType === 'Note')
        return true;
    return false;
}
