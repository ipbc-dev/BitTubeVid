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
const register_ts_paths_1 = require("../server/helpers/register-ts-paths");
register_ts_paths_1.registerTSPaths();
const constants_1 = require("../server/initializers/constants");
const actor_follow_1 = require("../server/models/activitypub/actor-follow");
const video_1 = require("../server/models/video/video");
const actor_1 = require("../server/models/activitypub/actor");
const url_1 = require("../server/lib/activitypub/url");
const video_share_1 = require("../server/models/video/video-share");
const video_comment_1 = require("../server/models/video/video-comment");
const account_1 = require("../server/models/account/account");
const video_channel_1 = require("../server/models/video/video-channel");
const video_streaming_playlist_1 = require("../server/models/video/video-streaming-playlist");
const database_1 = require("../server/initializers/database");
const webtorrent_1 = require("@server/helpers/webtorrent");
const application_1 = require("@server/models/application/application");
run()
    .then(() => process.exit(0))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield database_1.initDatabaseModels(true);
        const serverAccount = yield application_1.getServerActor();
        {
            const res = yield actor_follow_1.ActorFollowModel.listAcceptedFollowingUrlsForApi([serverAccount.id], undefined);
            const hasFollowing = res.total > 0;
            if (hasFollowing === true) {
                throw new Error('Cannot update host because you follow other servers!');
            }
        }
        console.log('Updating actors.');
        const actors = yield actor_1.ActorModel.unscoped().findAll({
            include: [
                {
                    model: video_channel_1.VideoChannelModel.unscoped(),
                    required: false
                },
                {
                    model: account_1.AccountModel.unscoped(),
                    required: false
                }
            ]
        });
        for (const actor of actors) {
            if (actor.isOwned() === false)
                continue;
            console.log('Updating actor ' + actor.url);
            const newUrl = actor.Account
                ? url_1.getAccountActivityPubUrl(actor.preferredUsername)
                : url_1.getVideoChannelActivityPubUrl(actor.preferredUsername);
            actor.url = newUrl;
            actor.inboxUrl = newUrl + '/inbox';
            actor.outboxUrl = newUrl + '/outbox';
            actor.sharedInboxUrl = constants_1.WEBSERVER.URL + '/inbox';
            actor.followersUrl = newUrl + '/followers';
            actor.followingUrl = newUrl + '/following';
            yield actor.save();
        }
        console.log('Updating video shares.');
        const videoShares = yield video_share_1.VideoShareModel.findAll({
            include: [video_1.VideoModel.unscoped(), actor_1.ActorModel.unscoped()]
        });
        for (const videoShare of videoShares) {
            if (videoShare.Video.isOwned() === false)
                continue;
            console.log('Updating video share ' + videoShare.url);
            videoShare.url = url_1.getVideoAnnounceActivityPubUrl(videoShare.Actor, videoShare.Video);
            yield videoShare.save();
        }
        console.log('Updating video comments.');
        const videoComments = yield video_comment_1.VideoCommentModel.findAll({
            include: [
                {
                    model: video_1.VideoModel.unscoped()
                },
                {
                    model: account_1.AccountModel.unscoped(),
                    include: [
                        {
                            model: actor_1.ActorModel.unscoped()
                        }
                    ]
                }
            ]
        });
        for (const comment of videoComments) {
            if (comment.isOwned() === false)
                continue;
            console.log('Updating comment ' + comment.url);
            comment.url = url_1.getVideoCommentActivityPubUrl(comment.Video, comment);
            yield comment.save();
        }
        console.log('Updating video and torrent files.');
        const videos = yield video_1.VideoModel.listLocal();
        for (const video of videos) {
            console.log('Updating video ' + video.uuid);
            video.url = url_1.getVideoActivityPubUrl(video);
            yield video.save();
            for (const file of video.VideoFiles) {
                console.log('Updating torrent file %s of video %s.', file.resolution, video.uuid);
                yield webtorrent_1.createTorrentAndSetInfoHash(video, file);
            }
            for (const playlist of video.VideoStreamingPlaylists) {
                playlist.playlistUrl = constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsMasterPlaylistStaticPath(video.uuid);
                playlist.segmentsSha256Url = constants_1.WEBSERVER.URL + video_streaming_playlist_1.VideoStreamingPlaylistModel.getHlsSha256SegmentsStaticPath(video.uuid);
                yield playlist.save();
            }
        }
    });
}
