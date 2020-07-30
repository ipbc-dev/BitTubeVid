"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDislikeActivityValid = void 0;
const misc_1 = require("./misc");
function isDislikeActivityValid(activity) {
    return activity.type === 'Dislike' &&
        misc_1.isActivityPubUrlValid(activity.actor) &&
        misc_1.isObjectValid(activity.object);
}
exports.isDislikeActivityValid = isDislikeActivityValid;
