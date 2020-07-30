"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoAbusePredefinedReasonsMap = exports.VideoAbusePredefinedReasons = void 0;
var VideoAbusePredefinedReasons;
(function (VideoAbusePredefinedReasons) {
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["VIOLENT_OR_REPULSIVE"] = 1] = "VIOLENT_OR_REPULSIVE";
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["HATEFUL_OR_ABUSIVE"] = 2] = "HATEFUL_OR_ABUSIVE";
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["SPAM_OR_MISLEADING"] = 3] = "SPAM_OR_MISLEADING";
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["PRIVACY"] = 4] = "PRIVACY";
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["RIGHTS"] = 5] = "RIGHTS";
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["SERVER_RULES"] = 6] = "SERVER_RULES";
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["THUMBNAILS"] = 7] = "THUMBNAILS";
    VideoAbusePredefinedReasons[VideoAbusePredefinedReasons["CAPTIONS"] = 8] = "CAPTIONS";
})(VideoAbusePredefinedReasons = exports.VideoAbusePredefinedReasons || (exports.VideoAbusePredefinedReasons = {}));
exports.videoAbusePredefinedReasonsMap = {
    violentOrRepulsive: VideoAbusePredefinedReasons.VIOLENT_OR_REPULSIVE,
    hatefulOrAbusive: VideoAbusePredefinedReasons.HATEFUL_OR_ABUSIVE,
    spamOrMisleading: VideoAbusePredefinedReasons.SPAM_OR_MISLEADING,
    privacy: VideoAbusePredefinedReasons.PRIVACY,
    rights: VideoAbusePredefinedReasons.RIGHTS,
    serverRules: VideoAbusePredefinedReasons.SERVER_RULES,
    thumbnails: VideoAbusePredefinedReasons.THUMBNAILS,
    captions: VideoAbusePredefinedReasons.CAPTIONS
};
