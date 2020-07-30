"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObjectValid = exports.setValidAttributedTo = exports.isBaseActivityValid = exports.isActivityPubUrlValid = exports.isUrlValid = void 0;
const validator_1 = require("validator");
const constants_1 = require("../../../initializers/constants");
const core_utils_1 = require("../../core-utils");
const misc_1 = require("../misc");
function isUrlValid(url) {
    const isURLOptions = {
        require_host: true,
        require_tld: true,
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http', 'https']
    };
    if (core_utils_1.isTestInstance()) {
        isURLOptions.require_tld = false;
    }
    return misc_1.exists(url) && validator_1.default.isURL('' + url, isURLOptions);
}
exports.isUrlValid = isUrlValid;
function isActivityPubUrlValid(url) {
    return isUrlValid(url) && validator_1.default.isLength('' + url, constants_1.CONSTRAINTS_FIELDS.ACTORS.URL);
}
exports.isActivityPubUrlValid = isActivityPubUrlValid;
function isBaseActivityValid(activity, type) {
    return activity.type === type &&
        isActivityPubUrlValid(activity.id) &&
        isObjectValid(activity.actor) &&
        isUrlCollectionValid(activity.to) &&
        isUrlCollectionValid(activity.cc);
}
exports.isBaseActivityValid = isBaseActivityValid;
function isUrlCollectionValid(collection) {
    return collection === undefined ||
        (Array.isArray(collection) && collection.every(t => isActivityPubUrlValid(t)));
}
function isObjectValid(object) {
    return misc_1.exists(object) &&
        (isActivityPubUrlValid(object) || isActivityPubUrlValid(object.id));
}
exports.isObjectValid = isObjectValid;
function setValidAttributedTo(obj) {
    if (Array.isArray(obj.attributedTo) === false) {
        obj.attributedTo = [];
        return true;
    }
    obj.attributedTo = obj.attributedTo.filter(a => {
        return (a.type === 'Group' || a.type === 'Person') && isActivityPubUrlValid(a.id);
    });
    return true;
}
exports.setValidAttributedTo = setValidAttributedTo;
