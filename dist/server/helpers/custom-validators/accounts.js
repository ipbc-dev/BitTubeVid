"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const users_1 = require("./users");
const misc_1 = require("./misc");
function isAccountNameValid(value) {
    return users_1.isUserUsernameValid(value);
}
exports.isAccountNameValid = isAccountNameValid;
function isAccountIdValid(value) {
    return misc_1.exists(value);
}
exports.isAccountIdValid = isAccountIdValid;
function isAccountDescriptionValid(value) {
    return users_1.isUserDescriptionValid(value);
}
exports.isAccountDescriptionValid = isAccountDescriptionValid;
