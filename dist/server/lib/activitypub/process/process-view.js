"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const videos_1 = require("../videos");
const utils_1 = require("../send/utils");
const redis_1 = require("../../redis");
function processViewActivity(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { activity, byActor } = options;
        return processCreateView(activity, byActor);
    });
}
exports.processViewActivity = processViewActivity;
function processCreateView(activity, byActor) {
    return __awaiter(this, void 0, void 0, function* () {
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
