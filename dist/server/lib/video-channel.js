"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.federateAllVideosOfChannel = exports.createLocalVideoChannel = void 0;
const tslib_1 = require("tslib");
const uuid_1 = require("uuid");
const video_channel_1 = require("../models/video/video-channel");
const actor_1 = require("./activitypub/actor");
const video_1 = require("../models/video/video");
const url_1 = require("./activitypub/url");
const videos_1 = require("./activitypub/videos");
function createLocalVideoChannel(videoChannelInfo, account, t) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const uuid = uuid_1.v4();
        const url = url_1.getVideoChannelActivityPubUrl(videoChannelInfo.name);
        const actorInstance = actor_1.buildActorInstance('Group', url, videoChannelInfo.name, uuid);
        const actorInstanceCreated = yield actorInstance.save({ transaction: t });
        const videoChannelData = {
            name: videoChannelInfo.displayName,
            description: videoChannelInfo.description,
            support: videoChannelInfo.support,
            accountId: account.id,
            actorId: actorInstanceCreated.id
        };
        const videoChannel = new video_channel_1.VideoChannelModel(videoChannelData);
        const options = { transaction: t };
        const videoChannelCreated = yield videoChannel.save(options);
        videoChannelCreated.Account = account;
        videoChannelCreated.Actor = actorInstanceCreated;
        return videoChannelCreated;
    });
}
exports.createLocalVideoChannel = createLocalVideoChannel;
function federateAllVideosOfChannel(videoChannel) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const videoIds = yield video_1.VideoModel.getAllIdsFromChannel(videoChannel);
        for (const videoId of videoIds) {
            const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(videoId);
            yield videos_1.federateVideoIfNeeded(video, false);
        }
    });
}
exports.federateAllVideosOfChannel = federateAllVideosOfChannel;
