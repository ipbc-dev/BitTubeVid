"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isActivityValid = exports.isRootActivityValid = void 0;
const validator_1 = require("validator");
const misc_1 = require("../misc");
const actor_1 = require("./actor");
const cache_file_1 = require("./cache-file");
const flag_1 = require("./flag");
const misc_2 = require("./misc");
const playlist_1 = require("./playlist");
const rate_1 = require("./rate");
const share_1 = require("./share");
const video_comments_1 = require("./video-comments");
const videos_1 = require("./videos");
const view_1 = require("./view");
function isRootActivityValid(activity) {
    return isCollection(activity) || isActivity(activity);
}
exports.isRootActivityValid = isRootActivityValid;
function isCollection(activity) {
    return (activity.type === 'Collection' || activity.type === 'OrderedCollection') &&
        validator_1.default.isInt(activity.totalItems, { min: 0 }) &&
        Array.isArray(activity.items);
}
function isActivity(activity) {
    return misc_2.isActivityPubUrlValid(activity.id) &&
        misc_1.exists(activity.actor) &&
        (misc_2.isActivityPubUrlValid(activity.actor) || misc_2.isActivityPubUrlValid(activity.actor.id));
}
const activityCheckers = {
    Create: checkCreateActivity,
    Update: checkUpdateActivity,
    Delete: checkDeleteActivity,
    Follow: checkFollowActivity,
    Accept: checkAcceptActivity,
    Reject: checkRejectActivity,
    Announce: checkAnnounceActivity,
    Undo: checkUndoActivity,
    Like: checkLikeActivity,
    View: checkViewActivity,
    Flag: checkFlagActivity,
    Dislike: checkDislikeActivity
};
function isActivityValid(activity) {
    const checker = activityCheckers[activity.type];
    if (!checker)
        return false;
    return checker(activity);
}
exports.isActivityValid = isActivityValid;
function checkViewActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'View') &&
        view_1.isViewActivityValid(activity);
}
function checkFlagActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Flag') &&
        flag_1.isFlagActivityValid(activity);
}
function checkDislikeActivity(activity) {
    return rate_1.isDislikeActivityValid(activity);
}
function checkLikeActivity(activity) {
    return rate_1.isLikeActivityValid(activity);
}
function checkCreateActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Create') &&
        (view_1.isViewActivityValid(activity.object) ||
            rate_1.isDislikeActivityValid(activity.object) ||
            flag_1.isFlagActivityValid(activity.object) ||
            playlist_1.isPlaylistObjectValid(activity.object) ||
            cache_file_1.isCacheFileObjectValid(activity.object) ||
            video_comments_1.sanitizeAndCheckVideoCommentObject(activity.object) ||
            videos_1.sanitizeAndCheckVideoTorrentObject(activity.object));
}
function checkUpdateActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Update') &&
        (cache_file_1.isCacheFileObjectValid(activity.object) ||
            playlist_1.isPlaylistObjectValid(activity.object) ||
            videos_1.sanitizeAndCheckVideoTorrentObject(activity.object) ||
            actor_1.sanitizeAndCheckActorObject(activity.object));
}
function checkDeleteActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Delete') &&
        misc_2.isObjectValid(activity.object);
}
function checkFollowActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Follow') &&
        misc_2.isObjectValid(activity.object);
}
function checkAcceptActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Accept');
}
function checkRejectActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Reject');
}
function checkAnnounceActivity(activity) {
    return share_1.isShareActivityValid(activity);
}
function checkUndoActivity(activity) {
    return misc_2.isBaseActivityValid(activity, 'Undo') &&
        (checkFollowActivity(activity.object) ||
            checkLikeActivity(activity.object) ||
            checkDislikeActivity(activity.object) ||
            checkAnnounceActivity(activity.object) ||
            checkCreateActivity(activity.object));
}
