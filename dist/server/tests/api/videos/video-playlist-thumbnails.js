"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const video_playlist_privacy_model_1 = require("../../../../shared/models/videos/playlist/video-playlist-privacy.model");
const expect = chai.expect;
describe('Playlist thumbnail', function () {
    let servers = [];
    let playlistWithoutThumbnail;
    let playlistWithThumbnail;
    let withThumbnailE1;
    let withThumbnailE2;
    let withoutThumbnailE1;
    let withoutThumbnailE2;
    let video1;
    let video2;
    function getPlaylistWithoutThumbnail(server) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoPlaylistsList(server.url, 0, 10);
            return res.body.data.find(p => p.displayName === 'playlist without thumbnail');
        });
    }
    function getPlaylistWithThumbnail(server) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoPlaylistsList(server.url, 0, 10);
            return res.body.data.find(p => p.displayName === 'playlist with thumbnail');
        });
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2, { transcoding: { enabled: false } });
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            video1 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video 1' })).id;
            video2 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video 2' })).id;
            yield extra_utils_1.waitJobs(servers);
        });
    });
    it('Should automatically update the thumbnail when adding an element', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const res = yield extra_utils_1.createVideoPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistAttrs: {
                    displayName: 'playlist without thumbnail',
                    privacy: video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC,
                    videoChannelId: servers[1].videoChannel.id
                }
            });
            playlistWithoutThumbnail = res.body.videoPlaylist.id;
            const res2 = yield extra_utils_1.addVideoInPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithoutThumbnail,
                elementAttrs: { videoId: video1 }
            });
            withoutThumbnailE1 = res2.body.videoPlaylistElement.id;
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithoutThumbnail(server);
                yield extra_utils_1.testImage(server.url, 'thumbnail-playlist', p.thumbnailPath);
            }
        });
    });
    it('Should not update the thumbnail if we explicitly uploaded a thumbnail', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const res = yield extra_utils_1.createVideoPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistAttrs: {
                    displayName: 'playlist with thumbnail',
                    privacy: video_playlist_privacy_model_1.VideoPlaylistPrivacy.PUBLIC,
                    videoChannelId: servers[1].videoChannel.id,
                    thumbnailfile: 'thumbnail.jpg'
                }
            });
            playlistWithThumbnail = res.body.videoPlaylist.id;
            const res2 = yield extra_utils_1.addVideoInPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithThumbnail,
                elementAttrs: { videoId: video1 }
            });
            withThumbnailE1 = res2.body.videoPlaylistElement.id;
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithThumbnail(server);
                yield extra_utils_1.testImage(server.url, 'thumbnail', p.thumbnailPath);
            }
        });
    });
    it('Should automatically update the thumbnail when moving the first element', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const res = yield extra_utils_1.addVideoInPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithoutThumbnail,
                elementAttrs: { videoId: video2 }
            });
            withoutThumbnailE2 = res.body.videoPlaylistElement.id;
            yield extra_utils_1.reorderVideosPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithoutThumbnail,
                elementAttrs: {
                    startPosition: 1,
                    insertAfterPosition: 2
                }
            });
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithoutThumbnail(server);
                yield extra_utils_1.testImage(server.url, 'thumbnail-playlist', p.thumbnailPath);
            }
        });
    });
    it('Should not update the thumbnail when moving the first element if we explicitly uploaded a thumbnail', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const res = yield extra_utils_1.addVideoInPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithThumbnail,
                elementAttrs: { videoId: video2 }
            });
            withThumbnailE2 = res.body.videoPlaylistElement.id;
            yield extra_utils_1.reorderVideosPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithThumbnail,
                elementAttrs: {
                    startPosition: 1,
                    insertAfterPosition: 2
                }
            });
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithThumbnail(server);
                yield extra_utils_1.testImage(server.url, 'thumbnail', p.thumbnailPath);
            }
        });
    });
    it('Should automatically update the thumbnail when deleting the first element', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.removeVideoFromPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithoutThumbnail,
                playlistElementId: withoutThumbnailE1
            });
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithoutThumbnail(server);
                yield extra_utils_1.testImage(server.url, 'thumbnail-playlist', p.thumbnailPath);
            }
        });
    });
    it('Should not update the thumbnail when deleting the first element if we explicitly uploaded a thumbnail', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.removeVideoFromPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithThumbnail,
                playlistElementId: withThumbnailE1
            });
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithThumbnail(server);
                yield extra_utils_1.testImage(server.url, 'thumbnail', p.thumbnailPath);
            }
        });
    });
    it('Should the thumbnail when we delete the last element', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.removeVideoFromPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithoutThumbnail,
                playlistElementId: withoutThumbnailE2
            });
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithoutThumbnail(server);
                expect(p.thumbnailPath).to.be.null;
            }
        });
    });
    it('Should not update the thumbnail when we delete the last element if we explicitly uploaded a thumbnail', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.removeVideoFromPlaylist({
                url: servers[1].url,
                token: servers[1].accessToken,
                playlistId: playlistWithThumbnail,
                playlistElementId: withThumbnailE2
            });
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const p = yield getPlaylistWithThumbnail(server);
                yield extra_utils_1.testImage(server.url, 'thumbnail', p.thumbnailPath);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
