"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const request = require("supertest");
const extra_utils_1 = require("../../shared/extra-utils");
const http_error_codes_1 = require("@shared/core-utils/miscs/http-error-codes");
const expect = chai.expect;
function checkIndexTags(html, title, description, css) {
    expect(html).to.contain('<title>' + title + '</title>');
    expect(html).to.contain('<meta name="description" content="' + description + '" />');
    expect(html).to.contain('<style class="custom-css-style">' + css + '</style>');
}
describe('Test a client controllers', function () {
    let servers = [];
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
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            yield extra_utils_1.updateVideoChannel(servers[0].url, servers[0].accessToken, servers[0].videoChannel.name, { description: channelDescription });
            const videoAttributes = { name: videoName, description: videoDescription };
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            const resVideosRequest = yield extra_utils_1.getVideosList(servers[0].url);
            const videos = resVideosRequest.body.data;
            expect(videos.length).to.equal(1);
            servers[0].video = videos[0];
            const playlistAttrs = {
                displayName: playlistName,
                description: playlistDescription,
                privacy: 1,
                videoChannelId: servers[0].videoChannel.id
            };
            const resVideoPlaylistRequest = yield extra_utils_1.createVideoPlaylist({ url: servers[0].url, token: servers[0].accessToken, playlistAttrs });
            const playlist = resVideoPlaylistRequest.body.videoPlaylist;
            const playlistId = playlist.id;
            playlistUUID = playlist.uuid;
            yield extra_utils_1.addVideoInPlaylist({
                url: servers[0].url,
                token: servers[0].accessToken,
                playlistId,
                elementAttrs: { videoId: servers[0].video.id }
            });
            yield extra_utils_1.updateMyUser({ url: servers[0].url, accessToken: servers[0].accessToken, description: 'my account description' });
            const resAccountRequest = yield extra_utils_1.getAccount(servers[0].url, `${servers[0].user.username}@${servers[0].host}`);
            account = resAccountRequest.body;
            yield extra_utils_1.waitJobs(servers);
        });
    });
    describe('oEmbed', function () {
        it('Should have valid oEmbed discovery tags for videos', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const path = '/videos/watch/' + servers[0].video.uuid;
                const res = yield request(servers[0].url)
                    .get(path)
                    .set('Accept', 'text/html')
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                const port = servers[0].port;
                const expectedLink = '<link rel="alternate" type="application/json+oembed" href="http://localhost:' + port + '/services/oembed?' +
                    `url=http%3A%2F%2Flocalhost%3A${port}%2Fvideos%2Fwatch%2F${servers[0].video.uuid}" ` +
                    `title="${servers[0].video.name}" />`;
                expect(res.text).to.contain(expectedLink);
            });
        });
        it('Should have valid oEmbed discovery tags for a playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(servers[0].url)
                    .get('/videos/watch/playlist/' + playlistUUID)
                    .set('Accept', 'text/html')
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                const port = servers[0].port;
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
                const res = yield request(servers[0].url)
                    .get('/accounts/' + servers[0].user.username)
                    .set('Accept', 'text/html')
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                expect(res.text).to.contain(`<meta property="og:title" content="${account.displayName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${account.description}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="website" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${servers[0].url}/accounts/${servers[0].user.username}" />`);
            });
        });
        it('Should have valid Open Graph tags on the channel page', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(servers[0].url)
                    .get('/video-channels/' + servers[0].videoChannel.name)
                    .set('Accept', 'text/html')
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                expect(res.text).to.contain(`<meta property="og:title" content="${servers[0].videoChannel.displayName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${channelDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="website" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${servers[0].url}/video-channels/${servers[0].videoChannel.name}" />`);
            });
        });
        it('Should have valid Open Graph tags on the watch page with video id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(servers[0].url)
                    .get('/videos/watch/' + servers[0].video.id)
                    .set('Accept', 'text/html')
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                expect(res.text).to.contain(`<meta property="og:title" content="${videoName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${videoDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="video" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${servers[0].url}/videos/watch/${servers[0].video.uuid}" />`);
            });
        });
        it('Should have valid Open Graph tags on the watch page with video uuid', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(servers[0].url)
                    .get('/videos/watch/' + servers[0].video.uuid)
                    .set('Accept', 'text/html')
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                expect(res.text).to.contain(`<meta property="og:title" content="${videoName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${videoDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="video" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${servers[0].url}/videos/watch/${servers[0].video.uuid}" />`);
            });
        });
        it('Should have valid Open Graph tags on the watch playlist page', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield request(servers[0].url)
                    .get('/videos/watch/playlist/' + playlistUUID)
                    .set('Accept', 'text/html')
                    .expect(http_error_codes_1.HttpStatusCode.OK_200);
                expect(res.text).to.contain(`<meta property="og:title" content="${playlistName}" />`);
                expect(res.text).to.contain(`<meta property="og:description" content="${playlistDescription}" />`);
                expect(res.text).to.contain('<meta property="og:type" content="video" />');
                expect(res.text).to.contain(`<meta property="og:url" content="${servers[0].url}/videos/watch/playlist/${playlistUUID}" />`);
            });
        });
    });
    describe('Twitter card', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            it('Should have valid twitter card on the watch video page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(servers[0].url)
                        .get('/videos/watch/' + servers[0].video.uuid)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary_large_image" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${videoName}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${videoDescription}" />`);
                });
            });
            it('Should have valid twitter card on the watch playlist page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(servers[0].url)
                        .get('/videos/watch/playlist/' + playlistUUID)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${playlistName}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${playlistDescription}" />`);
                });
            });
            it('Should have valid twitter card on the account page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(servers[0].url)
                        .get('/accounts/' + account.name)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${account.name}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${account.description}" />`);
                });
            });
            it('Should have valid twitter card on the channel page', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res = yield request(servers[0].url)
                        .get('/video-channels/' + servers[0].videoChannel.name)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(res.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(res.text).to.contain('<meta property="twitter:site" content="@Chocobozzz" />');
                    expect(res.text).to.contain(`<meta property="twitter:title" content="${servers[0].videoChannel.displayName}" />`);
                    expect(res.text).to.contain(`<meta property="twitter:description" content="${channelDescription}" />`);
                });
            });
            it('Should have valid twitter card if Twitter is whitelisted', function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const res1 = yield extra_utils_1.getCustomConfig(servers[0].url, servers[0].accessToken);
                    const config = res1.body;
                    config.services.twitter = {
                        username: '@Kuja',
                        whitelisted: true
                    };
                    yield extra_utils_1.updateCustomConfig(servers[0].url, servers[0].accessToken, config);
                    const resVideoRequest = yield request(servers[0].url)
                        .get('/videos/watch/' + servers[0].video.uuid)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(resVideoRequest.text).to.contain('<meta property="twitter:card" content="player" />');
                    expect(resVideoRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                    const resVideoPlaylistRequest = yield request(servers[0].url)
                        .get('/videos/watch/playlist/' + playlistUUID)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(resVideoPlaylistRequest.text).to.contain('<meta property="twitter:card" content="player" />');
                    expect(resVideoPlaylistRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                    const resAccountRequest = yield request(servers[0].url)
                        .get('/accounts/' + account.name)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(resAccountRequest.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(resAccountRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                    const resChannelRequest = yield request(servers[0].url)
                        .get('/video-channels/' + servers[0].videoChannel.name)
                        .set('Accept', 'text/html')
                        .expect(http_error_codes_1.HttpStatusCode.OK_200);
                    expect(resChannelRequest.text).to.contain('<meta property="twitter:card" content="summary" />');
                    expect(resChannelRequest.text).to.contain('<meta property="twitter:site" content="@Kuja" />');
                });
            });
        });
    });
    describe('Index HTML', function () {
        it('Should have valid index html tags (title, description...)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(servers[0].url, '/videos/trending');
                const description = 'PeerTube, an ActivityPub-federated video streaming platform using P2P directly in your web browser.';
                checkIndexTags(res.text, 'PeerTube', description, '');
            });
        });
        it('Should update the customized configuration and have the correct index html tags', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateCustomSubConfig(servers[0].url, servers[0].accessToken, {
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
                const res = yield extra_utils_1.makeHTMLRequest(servers[0].url, '/videos/trending');
                checkIndexTags(res.text, 'PeerTube updated', 'my short description', 'body { background-color: red; }');
            });
        });
        it('Should have valid index html updated tags (title, description...)', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(servers[0].url, '/videos/trending');
                checkIndexTags(res.text, 'PeerTube updated', 'my short description', 'body { background-color: red; }');
            });
        });
        it('Should use the original video URL for the canonical tag', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(servers[1].url, '/videos/watch/' + servers[0].video.uuid);
                expect(res.text).to.contain(`<link rel="canonical" href="${servers[0].url}/videos/watch/${servers[0].video.uuid}" />`);
            });
        });
        it('Should use the original account URL for the canonical tag', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(servers[1].url, '/accounts/root@' + servers[0].host);
                expect(res.text).to.contain(`<link rel="canonical" href="${servers[0].url}/accounts/root" />`);
            });
        });
        it('Should use the original channel URL for the canonical tag', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(servers[1].url, '/video-channels/root_channel@' + servers[0].host);
                expect(res.text).to.contain(`<link rel="canonical" href="${servers[0].url}/video-channels/root_channel" />`);
            });
        });
        it('Should use the original playlist URL for the canonical tag', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.makeHTMLRequest(servers[1].url, '/videos/watch/playlist/' + playlistUUID);
                expect(res.text).to.contain(`<link rel="canonical" href="${servers[0].url}/video-playlists/${playlistUUID}" />`);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
