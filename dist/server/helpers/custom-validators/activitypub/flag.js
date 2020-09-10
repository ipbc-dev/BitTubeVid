"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFlagActivityValid = void 0;
const misc_1 = require("./misc");
const abuses_1 = require("../abuses");
function isFlagActivityValid(activity) {
    return activity.type === 'Flag' &&
        abuses_1.isAbuseReasonValid(activity.content) &&
        misc_1.isActivityPubUrlValid(activity.object);
}
exports.isFlagActivityValid = isFlagActivityValid;
