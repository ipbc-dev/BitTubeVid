"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = require("./misc");
const video_abuses_1 = require("../video-abuses");
function isFlagActivityValid(activity) {
    return activity.type === 'Flag' &&
        video_abuses_1.isVideoAbuseReasonValid(activity.content) &&
        misc_1.isActivityPubUrlValid(activity.object);
}
exports.isFlagActivityValid = isFlagActivityValid;
