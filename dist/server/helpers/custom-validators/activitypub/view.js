"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = require("./misc");
function isViewActivityValid(activity) {
    return activity.type === 'View' &&
        misc_1.isActivityPubUrlValid(activity.actor) &&
        misc_1.isActivityPubUrlValid(activity.object);
}
exports.isViewActivityValid = isViewActivityValid;
