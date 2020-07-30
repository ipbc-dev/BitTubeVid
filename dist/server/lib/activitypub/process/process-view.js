"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processViewActivity = void 0;
const tslib_1 = require("tslib");
const videos_1 = require("../videos");
const utils_1 = require("../send/utils");
const redis_1 = require("../../redis");
function processViewActivity(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        return processCreateView(activity, byActor);
    });
}
exports.processViewActivity = processViewActivity;
function processCreateView(activity, byActor) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoObject = activity.type === 'View' ? activity.object : activity.object.object;
        const options = {
            videoObject,
            fetchType: 'only-immutable-attributes',
            allowRefresh: false
        };
        const { video } = yield videos_1.getOrCreateVideoAndAccountAndChannel(options);
        yield redis_1.Redis.Instance.addVideoView(video.id);
        if (video.isOwned()) {
            const exceptions = [byActor];
            yield utils_1.forwardVideoRelatedActivity(activity, undefined, exceptions, video);
        }
    });
}
