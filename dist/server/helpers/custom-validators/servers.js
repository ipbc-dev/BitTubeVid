"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("validator");
const misc_1 = require("./misc");
const core_utils_1 = require("../core-utils");
const constants_1 = require("../../initializers/constants");
function isHostValid(host) {
    const isURLOptions = {
        require_host: true,
        require_tld: true
    };
    if (core_utils_1.isTestInstance()) {
        isURLOptions.require_tld = false;
    }
    return misc_1.exists(host) && validator_1.default.isURL(host, isURLOptions) && host.split('://').length === 1;
}
exports.isHostValid = isHostValid;
function isEachUniqueHostValid(hosts) {
    return misc_1.isArray(hosts) &&
        hosts.length !== 0 &&
        hosts.every(host => {
            return isHostValid(host) && hosts.indexOf(host) === hosts.lastIndexOf(host);
        });
}
exports.isEachUniqueHostValid = isEachUniqueHostValid;
function isValidContactBody(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, constants_1.CONSTRAINTS_FIELDS.CONTACT_FORM.BODY);
}
exports.isValidContactBody = isValidContactBody;
function isValidContactFromName(value) {
    return misc_1.exists(value) && validator_1.default.isLength(value, constants_1.CONSTRAINTS_FIELDS.CONTACT_FORM.FROM_NAME);
}
exports.isValidContactFromName = isValidContactFromName;
