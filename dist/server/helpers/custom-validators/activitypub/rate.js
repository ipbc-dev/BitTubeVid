"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLikeActivityValid = exports.isDislikeActivityValid = void 0;
const misc_1 = require("./misc");
function isLikeActivityValid(activity) {
    return misc_1.isBaseActivityValid(activity, 'Like') &&
        misc_1.isObjectValid(activity.object);
}
exports.isLikeActivityValid = isLikeActivityValid;
function isDislikeActivityValid(activity) {
    return misc_1.isBaseActivityValid(activity, 'Dislike') &&
        misc_1.isObjectValid(activity.object);
}
exports.isDislikeActivityValid = isDislikeActivityValid;
