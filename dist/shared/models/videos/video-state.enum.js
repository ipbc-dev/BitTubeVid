"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoState = void 0;
var VideoState;
(function (VideoState) {
    VideoState[VideoState["PUBLISHED"] = 1] = "PUBLISHED";
    VideoState[VideoState["TO_TRANSCODE"] = 2] = "TO_TRANSCODE";
    VideoState[VideoState["TO_IMPORT"] = 3] = "TO_IMPORT";
})(VideoState = exports.VideoState || (exports.VideoState = {}));
