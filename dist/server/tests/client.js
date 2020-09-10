"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const request = require("supertest");
const extra_utils_1 = require("../../shared/extra-utils");
const expect = chai.expect;
function checkIndexTags(html, title, description, css) {
    expect(html).to.contain('<title>' + title + '</title>');
    expect(html).to.contain('<meta name="description" content="' + description + '" />');
    expect(html).to.contain('<style class="custom-css-style">' + css + '</style>');
}
describe('Test a client controllers', function () {
    let server;
    let account;
    const videoName = 'my super name for server 1';
    const videoDescription = 'my super description for server 1';
    const playlistName = 'super playlist name';
    const playlistDescription = 'super playlist description';
    let playlistUUID;
    const channelDescription = 'my super channel description';
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            server = yield extra_utils_1.flushAndRunServer(1);
            server.accessToken = yield extra_utils_1.serverLogin(server);
            yield extra_utils_1.setDefaultVideoChannel([server]);
            yield extra_utils_1.updateVideoChannel(server.url, server.accessToken, server.videoChannel.name, { description: channelDescription });
            const videoAttributes = { name: videoName, description: videoDescription };
            yield extra_utils_1.uploadVideo(server.url, server.accessToken, videoAttributes);
            const resVideosRequest = yield extra_utils_1.getVideosList(server.url);
            const videos = resVideosRequest.body.data;
            expect(videos.length).to.equal(1);
            server.video = videos[0];
            const playlistAttrs = {
                displayName: playlistName,
                description: playlistDescription,
                privacy: 1,
                videoChannelId: server.videoChannel.id
            };
            const resVideoPlaylistRequest = yield extra_utils_1.createVideoPlaylist({ url: server.url, token: server.accessToken, playlistAttrs });
            const playlist = resVideoPlaylistRequest.body.videoPlaylist;
            const playlistId = playlist.id;
            playlistUUID = playlist.uuid;
            yield extra_utils_1.addVideoInPlaylist({
                url: server.url,
                token: server.accessToken,
                playlistId,
                elementAttrs: { videoId: server.video.id }
            });
            yield extra_utils_1.updateMyUser({ url: server.url, accessToken: server.accessToken, description: 'my account description' });
            const resAccountRequest = yield extra_utils_1.getAccount(server.url, `${server.user.username}@${server.host}`);
            account = resAccountRequest.body;
        });
    });
    describe('oEmbed', function () {
        it('Should have valid oEmbed discovery tags for videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/videos/watch/' + server.video.uuid;
                const res = yield request(server.url)
                    .get(path)
                    .set('Accept', 'text/html')
                    .expect(200);
                const port = server.port;
                const expectedLink = '<link rel="alternate" type="application/json+oembed" href="http://localhost:' + port + '/services/oembed?' +
                    `url=http%3A%2F%2Flocalhost%3A${port}%2Fvideos%2Fwatch%2F${server.video.uuid}" ` +
                    `title="${server.video.name}" />`;
                expect(res.text).to.contain(expectedLink);
            });
        });
        it('Should have valid oEmbed discovery tags for a playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(server.url)
                    .get('/videos/watch/playlist/' + playlistUUID)
                    .set('Accept', 'text/html')
                    .expect(200);
                const port = server.port;
                const expectedLink = '<link rel="alternate" type="application/json+oembed" href="http://localhost:' + port + '/services/oembed?' +
                    `url=http%3A%2F%2Flocalhost%3A${port}%2Fvideos%2Fwatch%2Fplaylist%2F${playlistUUID}" ` +
                    `title="${playlistName}" />`;
                expect(res.text).to.contain(expectedLink);
            });
        });
    });
    describe('Open Graph', function () {
        it('Should have valid Open Graph tags on the account page', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(server.url)
                    .get('/accounts/' + server.user.username)
                    .set('Accept', 'text/html')
                    .expect(200);
                expect(res.text).to.contain(`<meta property="og:title" content="${account.displayName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${account.description}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="website" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${server.url}/accounts/${server.user.username}" />`);
            });
        });
        it('Should have valid Open Graph tags on the channel page', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(server.url)
                    .get('/video-channels/' + server.videoChannel.name)
                    .set('Accept', 'text/html')
                    .expect(200);
                expect(res.text).to.contain(`<meta property="og:title" content="${server.videoChannel.displayName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${channelDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="website" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${server.url}/video-channels/${server.videoChannel.name}" />`);
            });
        });
        it('Should have valid Open Graph tags on the watch page with video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(server.url)
                    .get('/videos/watch/' + server.video.id)
                    .set('Accept', 'text/html')
                    .expect(200);
                expect(res.text).to.contain(`<meta property="og:title" content="${videoName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${videoDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="video" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${server.url}/videos/watch/${server.video.uuid}" />`);
            });
        });
        it('Should have valid Open Graph tags on the watch page with video uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(server.url)
                    .get('/videos/watch/' + server.video.uuid)
                    .set('Accept', 'text/html')
                    .expect(200);
                expect(res.text).to.contain(`<meta property="og:title" content="${videoName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${videoDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="video" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${server.url}/videos/watch/${server.video.uuid}" />`);
            });
        });
        it('Should have valid Open Graph tags on the watch playlist page', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(server.url)
                    .get('/videos/watch/playlist/' + playlistUUID)
                    .set('Accept', 'text/html')
                    .expect(200);
                expect(res.text).to.contain(`<meta property="og:title" content="${playlistName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${playlistDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="video" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${server.url}/videos/watch/playlist/${playlistUUID}" />`);
            });
        });
    });
    describe('Twitter card', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            it('Should have valid twitter card on the watch video page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(server.url)
                        .get('/videos/watch/' + server.video.uuid)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary_large_image" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${videoName}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${videoDescription}" />`);
                });
            });
            it('Should have valid twitter card on the watch playlist page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(server.url)
                        .get('/videos/watch/playlist/' + playlistUUID)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${playlistName}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${playlistDescription}" />`);
                });
            });
            it('Should have valid twitter card on the account page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(server.url)
                        .get('/accounts/' + account.name)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${account.name}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${account.description}" />`);
                });
            });
            it('Should have valid twitter card on the channel page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(server.url)
                        .get('/video-channels/' + server.videoChannel.name)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${server.videoChannel.displayName}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${channelDescription}" />`);
                });
            });
            it('Should have valid twitter card if Twitter is whitelisted', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res1 = yield extra_utils_1.getCustomConfig(server.url, server.accessToken);
                    const config = res1.body;
                    config.services.twitter = {
                        username: '@Kuja',
                        whitelisted: true
                    };
                    yield extra_utils_1.updateCustomConfig(server.url, server.accessToken, config);
                    const resVideoRequest = yield request(server.url)
                        .get('/videos/watch/' + server.video.uuid)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(resVideoRequest.text).to.contain('<meta property="twitter:card" content="player" />');
                    expect(resVideoRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                    const resVideoPlaylistRequest = yield request(server.url)
                        .get('/videos/watch/playlist/' + playlistUUID)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(resVideoPlaylistRequest.text).to.contain('<meta property="twitter:card" content="player" />');
                    expect(resVideoPlaylistRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                    const resAccountRequest = yield request(server.url)
                        .get('/accounts/' + account.name)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(resAccountRequest.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(resAccountRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                    const resChannelRequest = yield request(server.url)
                        .get('/video-channels/' + server.videoChannel.name)
                        .set('Accept', 'text/html')
                        .expect(200);
                    expect(resChannelRequest.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(resChannelRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                });
            });
        });
    });
    describe('Index HTML', function () {
        it('Should have valid index html tags (title, description...)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(server.url, '/videos/trending');
                const description = 'PeerTube, an ActivityPub-federated video streaming platform using P2P directly in your web browser.';
                checkIndexTags(res.text, 'PeerTube', description, '');
            });
        });
        it('Should update the customized configuration and have the correct index html tags', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(server.url, server.accessToken, {
                    instance: {
                        name: 'PeerTube updated',
                        shortDescription: 'my short description',
                        description: 'my super description',
                        terms: 'my super terms',
                        defaultClientRoute: '/videos/recently-added',
                        defaultNSFWPolicy: 'blur',
                        customizations: {
                            javascript: 'alert("coucou")',
                            css: 'body { background-color: red; }'
                        }
                    }
                });
                const res = yield extra_utils_1.makeHTMLRequest(server.url, '/videos/trending');
                checkIndexTags(res.text, 'PeerTube updated', 'my short description', 'body { background-color: red; }');
            });
        });
        it('Should have valid index html updated tags (title, description...)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(server.url, '/videos/trending');
                checkIndexTags(res.text, 'PeerTube updated', 'my short description', 'body { background-color: red; }');
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
