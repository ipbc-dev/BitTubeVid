"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const blocklist_1 = require("../../../../shared/extra-utils/users/blocklist");
const expect = chai.expect;
function checkPlaylistElementType(servers, playlistId, type, position, name, total) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        for (const server of servers) {
            const res = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistId, 0, 10);
            expect(res.body.total).to.equal(total);
            const videoElement = res.body.data.find((e) => e.position === position);
            expect(videoElement.type).to.equal(type, 'On server ' + server.url);
            if (type === 0) {
                expect(videoElement.video).to.not.be.null;
                expect(videoElement.video.name).to.equal(name);
            }
            else {
                expect(videoElement.video).to.be.null;
            }
        }
    });
}
describe('Test video playlists', function () {
    let servers = [];
    let playlistServer2Id1;
    let playlistServer2Id2;
    let playlistServer2UUID2;
    let playlistServer1Id;
    let playlistServer1UUID;
    let playlistServer1UUID2;
    let playlistElementServer1Video4;
    let playlistElementServer1Video5;
    let playlistElementNSFW;
    let nsfwVideoServer1;
    let userAccessTokenServer1;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(3, { transcoding: { enabled: false } });
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.doubleFollow(servers[0], servers[2]);
            {
                const serverPromises = [];
                for (const server of servers) {
                    const videoPromises = [];
                    for (let i = 0; i < 7; i++) {
                        videoPromises.push(extra_utils_1.uploadVideo(server.url, server.accessToken, { name: `video ${i} server ${server.serverNumber}`, nsfw: false })
                            .then(res => res.body.video));
                    }
                    serverPromises.push(videoPromises);
                }
                servers[0].videos = yield Promise.all(serverPromises[0]);
                servers[1].videos = yield Promise.all(serverPromises[1]);
                servers[2].videos = yield Promise.all(serverPromises[2]);
            }
            nsfwVideoServer1 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'NSFW video', nsfw: true })).id;
            {
                yield extra_utils_1.createUser({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    username: 'user1',
                    password: 'password'
                });
                userAccessTokenServer1 = yield extra_utils_1.getAccessToken(servers[0].url, 'user1', 'password');
            }
            yield extra_utils_1.waitJobs(servers);
        });
    });
    describe('Get default playlists', function () {
        it('Should list video playlist privacies', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getVideoPlaylistPrivacies(servers[0].url);
                const privacies = res.body;
                expect(Object.keys(privacies)).to.have.length.at.least(3);
                expect(privacies[3]).to.equal('Private');
            });
        });
        it('Should list watch later playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const url = servers[0].url;
                const accessToken = servers[0].accessToken;
                {
                    const res = yield extra_utils_1.getAccountPlaylistsListWithToken(url, accessToken, 'root', 0, 5, 2);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                    const playlist = res.body.data[0];
                    expect(playlist.displayName).to.equal('Watch later');
                    expect(playlist.type.id).to.equal(2);
                    expect(playlist.type.label).to.equal('Watch later');
                }
                {
                    const res = yield extra_utils_1.getAccountPlaylistsListWithToken(url, accessToken, 'root', 0, 5, 1);
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.have.lengthOf(0);
                }
                {
                    const res = yield extra_utils_1.getAccountPlaylistsList(url, 'root', 0, 5);
                    expect(res.body.total).to.equal(0);
                    expect(res.body.data).to.have.lengthOf(0);
                }
            });
        });
        it('Should get private playlist for a classic user', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const token = yield extra_utils_1.generateUserAccessToken(servers[0], 'toto');
                const res = yield extra_utils_1.getAccountPlaylistsListWithToken(servers[0].url, token, 'toto', 0, 5);
                expect(res.body.total).to.equal(1);
                expect(res.body.data).to.have.lengthOf(1);
                const playlistId = res.body.data[0].id;
                yield extra_utils_1.getPlaylistVideos(servers[0].url, token, playlistId, 0, 5);
            });
        });
    });
    describe('Create and federate playlists', function () {
        it('Should create a playlist on server 1 and have the playlist on server 2 and 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.createVideoPlaylist({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistAttrs: {
                        displayName: 'my super playlist',
                        privacy: 1,
                        description: 'my super description',
                        thumbnailfile: 'thumbnail.jpg',
                        videoChannelId: servers[0].videoChannel.id
                    }
                });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideoPlaylistsList(server.url, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(res.body.data).to.have.lengthOf(1);
                    const playlistFromList = res.body.data[0];
                    const res2 = yield extra_utils_1.getVideoPlaylist(server.url, playlistFromList.uuid);
                    const playlistFromGet = res2.body;
                    for (const playlist of [playlistFromGet, playlistFromList]) {
                        expect(playlist.id).to.be.a('number');
                        expect(playlist.uuid).to.be.a('string');
                        expect(playlist.isLocal).to.equal(server.serverNumber === 1);
                        expect(playlist.displayName).to.equal('my super playlist');
                        expect(playlist.description).to.equal('my super description');
                        expect(playlist.privacy.id).to.equal(1);
                        expect(playlist.privacy.label).to.equal('Public');
                        expect(playlist.type.id).to.equal(1);
                        expect(playlist.type.label).to.equal('Regular');
                        expect(playlist.embedPath).to.equal('/video-playlists/embed/' + playlist.uuid);
                        expect(playlist.videosLength).to.equal(0);
                        expect(playlist.ownerAccount.name).to.equal('root');
                        expect(playlist.ownerAccount.displayName).to.equal('root');
                        expect(playlist.videoChannel.name).to.equal('root_channel');
                        expect(playlist.videoChannel.displayName).to.equal('Main root channel');
                    }
                }
            });
        });
        it('Should create a playlist on server 2 and have the playlist on server 1 but not on server 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                {
                    const res = yield extra_utils_1.createVideoPlaylist({
                        url: servers[1].url,
                        token: servers[1].accessToken,
                        playlistAttrs: {
                            displayName: 'playlist 2',
                            privacy: 1,
                            videoChannelId: servers[1].videoChannel.id
                        }
                    });
                    playlistServer2Id1 = res.body.videoPlaylist.id;
                }
                {
                    const res = yield extra_utils_1.createVideoPlaylist({
                        url: servers[1].url,
                        token: servers[1].accessToken,
                        playlistAttrs: {
                            displayName: 'playlist 3',
                            privacy: 1,
                            thumbnailfile: 'thumbnail.jpg',
                            videoChannelId: servers[1].videoChannel.id
                        }
                    });
                    playlistServer2Id2 = res.body.videoPlaylist.id;
                    playlistServer2UUID2 = res.body.videoPlaylist.uuid;
                }
                for (const id of [playlistServer2Id1, playlistServer2Id2]) {
                    yield extra_utils_1.addVideoInPlaylist({
                        url: servers[1].url,
                        token: servers[1].accessToken,
                        playlistId: id,
                        elementAttrs: { videoId: servers[1].videos[0].id, startTimestamp: 1, stopTimestamp: 2 }
                    });
                    yield extra_utils_1.addVideoInPlaylist({
                        url: servers[1].url,
                        token: servers[1].accessToken,
                        playlistId: id,
                        elementAttrs: { videoId: servers[1].videos[1].id }
                    });
                }
                yield extra_utils_1.waitJobs(servers);
                for (const server of [servers[0], servers[1]]) {
                    const res = yield extra_utils_1.getVideoPlaylistsList(server.url, 0, 5);
                    const playlist2 = res.body.data.find(p => p.displayName === 'playlist 2');
                    expect(playlist2).to.not.be.undefined;
                    yield extra_utils_1.testImage(server.url, 'thumbnail-playlist', playlist2.thumbnailPath);
                    const playlist3 = res.body.data.find(p => p.displayName === 'playlist 3');
                    expect(playlist3).to.not.be.undefined;
                    yield extra_utils_1.testImage(server.url, 'thumbnail', playlist3.thumbnailPath);
                }
                const res = yield extra_utils_1.getVideoPlaylistsList(servers[2].url, 0, 5);
                expect(res.body.data.find(p => p.displayName === 'playlist 2')).to.be.undefined;
                expect(res.body.data.find(p => p.displayName === 'playlist 3')).to.be.undefined;
            });
        });
        it('Should have the playlist on server 3 after a new follow', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.doubleFollow(servers[1], servers[2]);
                const res = yield extra_utils_1.getVideoPlaylistsList(servers[2].url, 0, 5);
                const playlist2 = res.body.data.find(p => p.displayName === 'playlist 2');
                expect(playlist2).to.not.be.undefined;
                yield extra_utils_1.testImage(servers[2].url, 'thumbnail-playlist', playlist2.thumbnailPath);
                expect(res.body.data.find(p => p.displayName === 'playlist 3')).to.not.be.undefined;
            });
        });
    });
    describe('List playlists', function () {
        it('Should correctly list the playlists', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                {
                    const res = yield extra_utils_1.getVideoPlaylistsList(servers[2].url, 1, 2, 'createdAt');
                    expect(res.body.total).to.equal(3);
                    const data = res.body.data;
                    expect(data).to.have.lengthOf(2);
                    expect(data[0].displayName).to.equal('playlist 2');
                    expect(data[1].displayName).to.equal('playlist 3');
                }
                {
                    const res = yield extra_utils_1.getVideoPlaylistsList(servers[2].url, 1, 2, '-createdAt');
                    expect(res.body.total).to.equal(3);
                    const data = res.body.data;
                    expect(data).to.have.lengthOf(2);
                    expect(data[0].displayName).to.equal('playlist 2');
                    expect(data[1].displayName).to.equal('my super playlist');
                }
            });
        });
        it('Should list video channel playlists', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                {
                    const res = yield extra_utils_1.getVideoChannelPlaylistsList(servers[0].url, 'root_channel', 0, 2, '-createdAt');
                    expect(res.body.total).to.equal(1);
                    const data = res.body.data;
                    expect(data).to.have.lengthOf(1);
                    expect(data[0].displayName).to.equal('my super playlist');
                }
            });
        });
        it('Should list account playlists', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                {
                    const res = yield extra_utils_1.getAccountPlaylistsList(servers[1].url, 'root', 1, 2, '-createdAt');
                    expect(res.body.total).to.equal(2);
                    const data = res.body.data;
                    expect(data).to.have.lengthOf(1);
                    expect(data[0].displayName).to.equal('playlist 2');
                }
                {
                    const res = yield extra_utils_1.getAccountPlaylistsList(servers[1].url, 'root', 1, 2, 'createdAt');
                    expect(res.body.total).to.equal(2);
                    const data = res.body.data;
                    expect(data).to.have.lengthOf(1);
                    expect(data[0].displayName).to.equal('playlist 3');
                }
                {
                    const res = yield extra_utils_1.getAccountPlaylistsList(servers[1].url, 'root', 0, 10, 'createdAt', '3');
                    expect(res.body.total).to.equal(1);
                    const data = res.body.data;
                    expect(data).to.have.lengthOf(1);
                    expect(data[0].displayName).to.equal('playlist 3');
                }
                {
                    const res = yield extra_utils_1.getAccountPlaylistsList(servers[1].url, 'root', 0, 10, 'createdAt', '4');
                    expect(res.body.total).to.equal(0);
                    const data = res.body.data;
                    expect(data).to.have.lengthOf(0);
                }
            });
        });
        it('Should not list unlisted or private playlists', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.createVideoPlaylist({
                    url: servers[1].url,
                    token: servers[1].accessToken,
                    playlistAttrs: {
                        displayName: 'playlist unlisted',
                        privacy: 2
                    }
                });
                yield extra_utils_1.createVideoPlaylist({
                    url: servers[1].url,
                    token: servers[1].accessToken,
                    playlistAttrs: {
                        displayName: 'playlist private',
                        privacy: 3
                    }
                });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const results = [
                        yield extra_utils_1.getAccountPlaylistsList(server.url, 'root@localhost:' + servers[1].port, 0, 5, '-createdAt'),
                        yield extra_utils_1.getVideoPlaylistsList(server.url, 0, 2, '-createdAt')
                    ];
                    expect(results[0].body.total).to.equal(2);
                    expect(results[1].body.total).to.equal(3);
                    for (const res of results) {
                        const data = res.body.data;
                        expect(data).to.have.lengthOf(2);
                        expect(data[0].displayName).to.equal('playlist 3');
                        expect(data[1].displayName).to.equal('playlist 2');
                    }
                }
            });
        });
    });
    describe('Update playlists', function () {
        it('Should update a playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.updateVideoPlaylist({
                    url: servers[1].url,
                    token: servers[1].accessToken,
                    playlistAttrs: {
                        displayName: 'playlist 3 updated',
                        description: 'description updated',
                        privacy: 2,
                        thumbnailfile: 'thumbnail.jpg',
                        videoChannelId: servers[1].videoChannel.id
                    },
                    playlistId: playlistServer2Id2
                });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideoPlaylist(server.url, playlistServer2UUID2);
                    const playlist = res.body;
                    expect(playlist.displayName).to.equal('playlist 3 updated');
                    expect(playlist.description).to.equal('description updated');
                    expect(playlist.privacy.id).to.equal(2);
                    expect(playlist.privacy.label).to.equal('Unlisted');
                    expect(playlist.type.id).to.equal(1);
                    expect(playlist.type.label).to.equal('Regular');
                    expect(playlist.videosLength).to.equal(2);
                    expect(playlist.ownerAccount.name).to.equal('root');
                    expect(playlist.ownerAccount.displayName).to.equal('root');
                    expect(playlist.videoChannel.name).to.equal('root_channel');
                    expect(playlist.videoChannel.displayName).to.equal('Main root channel');
                }
            });
        });
    });
    describe('Element timestamps', function () {
        it('Should create a playlist containing different startTimestamp/endTimestamp videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const addVideo = (elementAttrs) => {
                    return extra_utils_1.addVideoInPlaylist({ url: servers[0].url, token: servers[0].accessToken, playlistId: playlistServer1Id, elementAttrs });
                };
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistAttrs: {
                        displayName: 'playlist 4',
                        privacy: 1,
                        videoChannelId: servers[0].videoChannel.id
                    }
                });
                playlistServer1Id = res.body.videoPlaylist.id;
                playlistServer1UUID = res.body.videoPlaylist.uuid;
                yield addVideo({ videoId: servers[0].videos[0].uuid, startTimestamp: 15, stopTimestamp: 28 });
                yield addVideo({ videoId: servers[2].videos[1].uuid, startTimestamp: 35 });
                yield addVideo({ videoId: servers[2].videos[2].uuid });
                {
                    const res = yield addVideo({ videoId: servers[0].videos[3].uuid, stopTimestamp: 35 });
                    playlistElementServer1Video4 = res.body.videoPlaylistElement.id;
                }
                {
                    const res = yield addVideo({ videoId: servers[0].videos[4].uuid, startTimestamp: 45, stopTimestamp: 60 });
                    playlistElementServer1Video5 = res.body.videoPlaylistElement.id;
                }
                {
                    const res = yield addVideo({ videoId: nsfwVideoServer1, startTimestamp: 5 });
                    playlistElementNSFW = res.body.videoPlaylistElement.id;
                    yield addVideo({ videoId: nsfwVideoServer1, startTimestamp: 4 });
                    yield addVideo({ videoId: nsfwVideoServer1 });
                }
                yield extra_utils_1.waitJobs(servers);
            });
        });
        it('Should correctly list playlist videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                for (const server of servers) {
                    const res = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistServer1UUID, 0, 10);
                    expect(res.body.total).to.equal(8);
                    const videoElements = res.body.data;
                    expect(videoElements).to.have.lengthOf(8);
                    expect(videoElements[0].video.name).to.equal('video 0 server 1');
                    expect(videoElements[0].position).to.equal(1);
                    expect(videoElements[0].startTimestamp).to.equal(15);
                    expect(videoElements[0].stopTimestamp).to.equal(28);
                    expect(videoElements[1].video.name).to.equal('video 1 server 3');
                    expect(videoElements[1].position).to.equal(2);
                    expect(videoElements[1].startTimestamp).to.equal(35);
                    expect(videoElements[1].stopTimestamp).to.be.null;
                    expect(videoElements[2].video.name).to.equal('video 2 server 3');
                    expect(videoElements[2].position).to.equal(3);
                    expect(videoElements[2].startTimestamp).to.be.null;
                    expect(videoElements[2].stopTimestamp).to.be.null;
                    expect(videoElements[3].video.name).to.equal('video 3 server 1');
                    expect(videoElements[3].position).to.equal(4);
                    expect(videoElements[3].startTimestamp).to.be.null;
                    expect(videoElements[3].stopTimestamp).to.equal(35);
                    expect(videoElements[4].video.name).to.equal('video 4 server 1');
                    expect(videoElements[4].position).to.equal(5);
                    expect(videoElements[4].startTimestamp).to.equal(45);
                    expect(videoElements[4].stopTimestamp).to.equal(60);
                    expect(videoElements[5].video.name).to.equal('NSFW video');
                    expect(videoElements[5].position).to.equal(6);
                    expect(videoElements[5].startTimestamp).to.equal(5);
                    expect(videoElements[5].stopTimestamp).to.be.null;
                    expect(videoElements[6].video.name).to.equal('NSFW video');
                    expect(videoElements[6].position).to.equal(7);
                    expect(videoElements[6].startTimestamp).to.equal(4);
                    expect(videoElements[6].stopTimestamp).to.be.null;
                    expect(videoElements[7].video.name).to.equal('NSFW video');
                    expect(videoElements[7].position).to.equal(8);
                    expect(videoElements[7].startTimestamp).to.be.null;
                    expect(videoElements[7].stopTimestamp).to.be.null;
                    const res3 = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistServer1UUID, 0, 2);
                    expect(res3.body.data).to.have.lengthOf(2);
                }
            });
        });
    });
    describe('Element type', function () {
        let groupUser1;
        let groupWithoutToken1;
        let group1;
        let group2;
        let video1;
        let video2;
        let video3;
        before(function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                groupUser1 = [Object.assign({}, servers[0], { accessToken: userAccessTokenServer1 })];
                groupWithoutToken1 = [Object.assign({}, servers[0], { accessToken: undefined })];
                group1 = [servers[0]];
                group2 = [servers[1], servers[2]];
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: servers[0].url,
                    token: userAccessTokenServer1,
                    playlistAttrs: {
                        displayName: 'playlist 56',
                        privacy: 1,
                        videoChannelId: servers[0].videoChannel.id
                    }
                });
                const playlistServer1Id2 = res.body.videoPlaylist.id;
                playlistServer1UUID2 = res.body.videoPlaylist.uuid;
                const addVideo = (elementAttrs) => {
                    return extra_utils_1.addVideoInPlaylist({ url: servers[0].url, token: userAccessTokenServer1, playlistId: playlistServer1Id2, elementAttrs });
                };
                video1 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video 89', token: userAccessTokenServer1 })).uuid;
                video2 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video 90' })).uuid;
                video3 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[0], videoName: 'video 91', nsfw: true })).uuid;
                yield addVideo({ videoId: video1, startTimestamp: 15, stopTimestamp: 28 });
                yield addVideo({ videoId: video2, startTimestamp: 35 });
                yield addVideo({ videoId: video3 });
                yield extra_utils_1.waitJobs(servers);
            });
        });
        it('Should update the element type if the video is private', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const name = 'video 89';
                const position = 1;
                {
                    yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, video1, { privacy: 3 });
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(groupWithoutToken1, playlistServer1UUID2, 2, position, name, 3);
                    yield checkPlaylistElementType(group1, playlistServer1UUID2, 2, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 1, position, name, 3);
                }
                {
                    yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, video1, { privacy: 1 });
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(groupWithoutToken1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(group1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 1, position, name, 3);
                }
            });
        });
        it('Should update the element type if the video is blacklisted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const name = 'video 89';
                const position = 1;
                {
                    yield extra_utils_1.addVideoToBlacklist(servers[0].url, servers[0].accessToken, video1, 'reason', true);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(groupWithoutToken1, playlistServer1UUID2, 3, position, name, 3);
                    yield checkPlaylistElementType(group1, playlistServer1UUID2, 3, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 1, position, name, 3);
                }
                {
                    yield extra_utils_1.removeVideoFromBlacklist(servers[0].url, servers[0].accessToken, video1);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(groupWithoutToken1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(group1, playlistServer1UUID2, 0, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 1, position, name, 3);
                }
            });
        });
        it('Should update the element type if the account or server of the video is blocked', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(90000);
                const name = 'video 90';
                const position = 2;
                {
                    yield blocklist_1.addAccountToAccountBlocklist(servers[0].url, userAccessTokenServer1, 'root@localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 3, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                    yield blocklist_1.removeAccountFromAccountBlocklist(servers[0].url, userAccessTokenServer1, 'root@localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                }
                {
                    yield blocklist_1.addServerToAccountBlocklist(servers[0].url, userAccessTokenServer1, 'localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 3, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                    yield blocklist_1.removeServerFromAccountBlocklist(servers[0].url, userAccessTokenServer1, 'localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                }
                {
                    yield blocklist_1.addAccountToServerBlocklist(servers[0].url, servers[0].accessToken, 'root@localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 3, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                    yield blocklist_1.removeAccountFromServerBlocklist(servers[0].url, servers[0].accessToken, 'root@localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                }
                {
                    yield blocklist_1.addServerToServerBlocklist(servers[0].url, servers[0].accessToken, 'localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(groupUser1, playlistServer1UUID2, 3, position, name, 3);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                    yield blocklist_1.removeServerFromServerBlocklist(servers[0].url, servers[0].accessToken, 'localhost:' + servers[1].port);
                    yield extra_utils_1.waitJobs(servers);
                    yield checkPlaylistElementType(group2, playlistServer1UUID2, 0, position, name, 3);
                }
            });
        });
        it('Should hide the video if it is NSFW', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getPlaylistVideos(servers[0].url, userAccessTokenServer1, playlistServer1UUID2, 0, 10, { nsfw: false });
                expect(res.body.total).to.equal(3);
                const elements = res.body.data;
                const element = elements.find(e => e.position === 3);
                expect(element).to.exist;
                expect(element.video).to.be.null;
                expect(element.type).to.equal(3);
            });
        });
    });
    describe('Managing playlist elements', function () {
        it('Should reorder the playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                {
                    yield extra_utils_1.reorderVideosPlaylist({
                        url: servers[0].url,
                        token: servers[0].accessToken,
                        playlistId: playlistServer1Id,
                        elementAttrs: {
                            startPosition: 2,
                            insertAfterPosition: 3
                        }
                    });
                    yield extra_utils_1.waitJobs(servers);
                    for (const server of servers) {
                        const res = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistServer1UUID, 0, 10);
                        const names = res.body.data.map(v => v.video.name);
                        expect(names).to.deep.equal([
                            'video 0 server 1',
                            'video 2 server 3',
                            'video 1 server 3',
                            'video 3 server 1',
                            'video 4 server 1',
                            'NSFW video',
                            'NSFW video',
                            'NSFW video'
                        ]);
                    }
                }
                {
                    yield extra_utils_1.reorderVideosPlaylist({
                        url: servers[0].url,
                        token: servers[0].accessToken,
                        playlistId: playlistServer1Id,
                        elementAttrs: {
                            startPosition: 1,
                            reorderLength: 3,
                            insertAfterPosition: 4
                        }
                    });
                    yield extra_utils_1.waitJobs(servers);
                    for (const server of servers) {
                        const res = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistServer1UUID, 0, 10);
                        const names = res.body.data.map(v => v.video.name);
                        expect(names).to.deep.equal([
                            'video 3 server 1',
                            'video 0 server 1',
                            'video 2 server 3',
                            'video 1 server 3',
                            'video 4 server 1',
                            'NSFW video',
                            'NSFW video',
                            'NSFW video'
                        ]);
                    }
                }
                {
                    yield extra_utils_1.reorderVideosPlaylist({
                        url: servers[0].url,
                        token: servers[0].accessToken,
                        playlistId: playlistServer1Id,
                        elementAttrs: {
                            startPosition: 6,
                            insertAfterPosition: 3
                        }
                    });
                    yield extra_utils_1.waitJobs(servers);
                    for (const server of servers) {
                        const res = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistServer1UUID, 0, 10);
                        const elements = res.body.data;
                        const names = elements.map(v => v.video.name);
                        expect(names).to.deep.equal([
                            'video 3 server 1',
                            'video 0 server 1',
                            'video 2 server 3',
                            'NSFW video',
                            'video 1 server 3',
                            'video 4 server 1',
                            'NSFW video',
                            'NSFW video'
                        ]);
                        for (let i = 1; i <= elements.length; i++) {
                            expect(elements[i - 1].position).to.equal(i);
                        }
                    }
                }
            });
        });
        it('Should update startTimestamp/endTimestamp of some elements', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.updateVideoPlaylistElement({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistId: playlistServer1Id,
                    playlistElementId: playlistElementServer1Video4,
                    elementAttrs: {
                        startTimestamp: 1
                    }
                });
                yield extra_utils_1.updateVideoPlaylistElement({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistId: playlistServer1Id,
                    playlistElementId: playlistElementServer1Video5,
                    elementAttrs: {
                        stopTimestamp: null
                    }
                });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistServer1UUID, 0, 10);
                    const elements = res.body.data;
                    expect(elements[0].video.name).to.equal('video 3 server 1');
                    expect(elements[0].position).to.equal(1);
                    expect(elements[0].startTimestamp).to.equal(1);
                    expect(elements[0].stopTimestamp).to.equal(35);
                    expect(elements[5].video.name).to.equal('video 4 server 1');
                    expect(elements[5].position).to.equal(6);
                    expect(elements[5].startTimestamp).to.equal(45);
                    expect(elements[5].stopTimestamp).to.be.null;
                }
            });
        });
        it('Should check videos existence in my playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const videoIds = [
                    servers[0].videos[0].id,
                    42000,
                    servers[0].videos[3].id,
                    43000,
                    servers[0].videos[4].id
                ];
                const res = yield extra_utils_1.doVideosExistInMyPlaylist(servers[0].url, servers[0].accessToken, videoIds);
                const obj = res.body;
                {
                    const elem = obj[servers[0].videos[0].id];
                    expect(elem).to.have.lengthOf(1);
                    expect(elem[0].playlistElementId).to.exist;
                    expect(elem[0].playlistId).to.equal(playlistServer1Id);
                    expect(elem[0].startTimestamp).to.equal(15);
                    expect(elem[0].stopTimestamp).to.equal(28);
                }
                {
                    const elem = obj[servers[0].videos[3].id];
                    expect(elem).to.have.lengthOf(1);
                    expect(elem[0].playlistElementId).to.equal(playlistElementServer1Video4);
                    expect(elem[0].playlistId).to.equal(playlistServer1Id);
                    expect(elem[0].startTimestamp).to.equal(1);
                    expect(elem[0].stopTimestamp).to.equal(35);
                }
                {
                    const elem = obj[servers[0].videos[4].id];
                    expect(elem).to.have.lengthOf(1);
                    expect(elem[0].playlistId).to.equal(playlistServer1Id);
                    expect(elem[0].startTimestamp).to.equal(45);
                    expect(elem[0].stopTimestamp).to.equal(null);
                }
                expect(obj[42000]).to.have.lengthOf(0);
                expect(obj[43000]).to.have.lengthOf(0);
            });
        });
        it('Should automatically update updatedAt field of playlists', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const server = servers[1];
                const videoId = servers[1].videos[5].id;
                function getPlaylistNames() {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const res = yield extra_utils_1.getAccountPlaylistsListWithToken(server.url, server.accessToken, 'root', 0, 5, undefined, '-updatedAt');
                        return res.body.data.map(p => p.displayName);
                    });
                }
                const elementAttrs = { videoId };
                const res1 = yield extra_utils_1.addVideoInPlaylist({ url: server.url, token: server.accessToken, playlistId: playlistServer2Id1, elementAttrs });
                const res2 = yield extra_utils_1.addVideoInPlaylist({ url: server.url, token: server.accessToken, playlistId: playlistServer2Id2, elementAttrs });
                const element1 = res1.body.videoPlaylistElement.id;
                const element2 = res2.body.videoPlaylistElement.id;
                const names1 = yield getPlaylistNames();
                expect(names1[0]).to.equal('playlist 3 updated');
                expect(names1[1]).to.equal('playlist 2');
                yield extra_utils_1.removeVideoFromPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistId: playlistServer2Id1,
                    playlistElementId: element1
                });
                const names2 = yield getPlaylistNames();
                expect(names2[0]).to.equal('playlist 2');
                expect(names2[1]).to.equal('playlist 3 updated');
                yield extra_utils_1.removeVideoFromPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistId: playlistServer2Id2,
                    playlistElementId: element2
                });
                const names3 = yield getPlaylistNames();
                expect(names3[0]).to.equal('playlist 3 updated');
                expect(names3[1]).to.equal('playlist 2');
            });
        });
        it('Should delete some elements', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.removeVideoFromPlaylist({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistId: playlistServer1Id,
                    playlistElementId: playlistElementServer1Video4
                });
                yield extra_utils_1.removeVideoFromPlaylist({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistId: playlistServer1Id,
                    playlistElementId: playlistElementNSFW
                });
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getPlaylistVideos(server.url, server.accessToken, playlistServer1UUID, 0, 10);
                    expect(res.body.total).to.equal(6);
                    const elements = res.body.data;
                    expect(elements).to.have.lengthOf(6);
                    expect(elements[0].video.name).to.equal('video 0 server 1');
                    expect(elements[0].position).to.equal(1);
                    expect(elements[1].video.name).to.equal('video 2 server 3');
                    expect(elements[1].position).to.equal(2);
                    expect(elements[2].video.name).to.equal('video 1 server 3');
                    expect(elements[2].position).to.equal(3);
                    expect(elements[3].video.name).to.equal('video 4 server 1');
                    expect(elements[3].position).to.equal(4);
                    expect(elements[4].video.name).to.equal('NSFW video');
                    expect(elements[4].position).to.equal(5);
                    expect(elements[5].video.name).to.equal('NSFW video');
                    expect(elements[5].position).to.equal(6);
                }
            });
        });
        it('Should be able to create a public playlist, and set it to private', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistAttrs: {
                        displayName: 'my super public playlist',
                        privacy: 1,
                        videoChannelId: servers[0].videoChannel.id
                    }
                });
                const videoPlaylistIds = res.body.videoPlaylist;
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    yield extra_utils_1.getVideoPlaylist(server.url, videoPlaylistIds.uuid, 200);
                }
                const playlistAttrs = { privacy: 3 };
                yield extra_utils_1.updateVideoPlaylist({ url: servers[0].url, token: servers[0].accessToken, playlistId: videoPlaylistIds.id, playlistAttrs });
                yield extra_utils_1.waitJobs(servers);
                for (const server of [servers[1], servers[2]]) {
                    yield extra_utils_1.getVideoPlaylist(server.url, videoPlaylistIds.uuid, 404);
                }
                yield extra_utils_1.getVideoPlaylist(servers[0].url, videoPlaylistIds.uuid, 401);
                yield extra_utils_1.getVideoPlaylistWithToken(servers[0].url, servers[0].accessToken, videoPlaylistIds.uuid, 200);
            });
        });
    });
    describe('Playlist deletion', function () {
        it('Should delete the playlist on server 1 and delete on server 2 and 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                yield extra_utils_1.deleteVideoPlaylist(servers[0].url, servers[0].accessToken, playlistServer1Id);
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    yield extra_utils_1.getVideoPlaylist(server.url, playlistServer1UUID, 404);
                }
            });
        });
        it('Should have deleted the thumbnail on server 1, 2 and 3', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                for (const server of servers) {
                    yield extra_utils_1.checkPlaylistFilesWereRemoved(playlistServer1UUID, server.internalServerNumber);
                }
            });
        });
        it('Should unfollow servers 1 and 2 and hide their playlists', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const finder = data => data.find(p => p.displayName === 'my super playlist');
                {
                    const res = yield extra_utils_1.getVideoPlaylistsList(servers[2].url, 0, 5);
                    expect(res.body.total).to.equal(3);
                    expect(finder(res.body.data)).to.not.be.undefined;
                }
                yield extra_utils_1.unfollow(servers[2].url, servers[2].accessToken, servers[0]);
                {
                    const res = yield extra_utils_1.getVideoPlaylistsList(servers[2].url, 0, 5);
                    expect(res.body.total).to.equal(1);
                    expect(finder(res.body.data)).to.be.undefined;
                }
            });
        });
        it('Should delete a channel and put the associated playlist in private mode', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const res = yield extra_utils_1.addVideoChannel(servers[0].url, servers[0].accessToken, { name: 'super_channel', displayName: 'super channel' });
                const videoChannelId = res.body.videoChannel.id;
                const res2 = yield extra_utils_1.createVideoPlaylist({
                    url: servers[0].url,
                    token: servers[0].accessToken,
                    playlistAttrs: {
                        displayName: 'channel playlist',
                        privacy: 1,
                        videoChannelId
                    }
                });
                const videoPlaylistUUID = res2.body.videoPlaylist.uuid;
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.deleteVideoChannel(servers[0].url, servers[0].accessToken, 'super_channel');
                yield extra_utils_1.waitJobs(servers);
                const res3 = yield extra_utils_1.getVideoPlaylistWithToken(servers[0].url, servers[0].accessToken, videoPlaylistUUID);
                expect(res3.body.displayName).to.equal('channel playlist');
                expect(res3.body.privacy.id).to.equal(3);
                yield extra_utils_1.getVideoPlaylist(servers[1].url, videoPlaylistUUID, 404);
            });
        });
        it('Should delete an account and delete its playlists', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const user = { username: 'user_1', password: 'password' };
                const res = yield extra_utils_1.createUser({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    username: user.username,
                    password: user.password
                });
                const userId = res.body.user.id;
                const userAccessToken = yield extra_utils_1.userLogin(servers[0], user);
                const resChannel = yield extra_utils_1.getMyUserInformation(servers[0].url, userAccessToken);
                const userChannel = resChannel.body.videoChannels[0];
                yield extra_utils_1.createVideoPlaylist({
                    url: servers[0].url,
                    token: userAccessToken,
                    playlistAttrs: {
                        displayName: 'playlist to be deleted',
                        privacy: 1,
                        videoChannelId: userChannel.id
                    }
                });
                yield extra_utils_1.waitJobs(servers);
                const finder = data => data.find(p => p.displayName === 'playlist to be deleted');
                {
                    for (const server of [servers[0], servers[1]]) {
                        const res = yield extra_utils_1.getVideoPlaylistsList(server.url, 0, 15);
                        expect(finder(res.body.data)).to.not.be.undefined;
                    }
                }
                yield extra_utils_1.removeUser(servers[0].url, userId, servers[0].accessToken);
                yield extra_utils_1.waitJobs(servers);
                {
                    for (const server of [servers[0], servers[1]]) {
                        const res = yield extra_utils_1.getVideoPlaylistsList(server.url, 0, 15);
                        expect(finder(res.body.data)).to.be.undefined;
                    }
                }
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
