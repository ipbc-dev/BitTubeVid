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
const config_1 = require("../initializers/config");
const models_1 = require("../../shared/models");
const video_blacklist_1 = require("../models/video/video-blacklist");
const logger_1 = require("../helpers/logger");
const user_flag_model_1 = require("../../shared/models/users/user-flag.model");
const hooks_1 = require("./plugins/hooks");
const notifier_1 = require("./notifier");
function autoBlacklistVideoIfNeeded(parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        const { video, user, isRemote, isNew, notify = true, transaction } = parameters;
        const doAutoBlacklist = yield hooks_1.Hooks.wrapPromiseFun(autoBlacklistNeeded, { video, user, isRemote, isNew }, 'filter:video.auto-blacklist.result');
        if (!doAutoBlacklist)
            return false;
        const videoBlacklistToCreate = {
            videoId: video.id,
            unfederated: true,
            reason: 'Auto-blacklisted. Moderator review required.',
            type: models_1.VideoBlacklistType.AUTO_BEFORE_PUBLISHED
        };
        const [videoBlacklist] = yield video_blacklist_1.VideoBlacklistModel.findOrCreate({
            where: {
                videoId: video.id
            },
            defaults: videoBlacklistToCreate,
            transaction
        });
        video.VideoBlacklist = videoBlacklist;
        videoBlacklist.Video = video;
        if (notify)
            notifier_1.Notifier.Instance.notifyOnVideoAutoBlacklist(videoBlacklist);
        logger_1.logger.info('Video %s auto-blacklisted.', video.uuid);
        return true;
    });
}
exports.autoBlacklistVideoIfNeeded = autoBlacklistVideoIfNeeded;
function autoBlacklistNeeded(parameters) {
    return __awaiter(this, void 0, void 0, function* () {
        const { user, video, isRemote, isNew } = parameters;
        if (video.VideoBlacklist)
            return false;
        if (!config_1.CONFIG.AUTO_BLACKLIST.VIDEOS.OF_USERS.ENABLED || !user)
            return false;
        if (isRemote || isNew === false)
            return false;
        if (user.hasRight(models_1.UserRight.MANAGE_VIDEO_BLACKLIST) || user.hasAdminFlag(user_flag_model_1.UserAdminFlag.BY_PASS_VIDEO_AUTO_BLACKLIST))
            return false;
        return true;
    });
}
