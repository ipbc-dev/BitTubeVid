"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = require("./misc");
function isFollowStateValid(value) {
    if (!misc_1.exists(value))
        return false;
    return value === 'pending' || value === 'accepted';
}
exports.isFollowStateValid = isFollowStateValid;
