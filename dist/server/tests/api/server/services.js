"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const servers_1 = require("../../../../shared/extra-utils/server/servers");
const expect = chai.expect;
describe('Test services', function () {
    let server = null;
    let playlistUUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield servers_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.setDefaultVideoChannel([server]);
            {
                const videoAttributes = {
                    name: 'my super name'
                };
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, videoAttributes);
                const res = yield extra_utils_1.getVideosList(server.url);
                server.video = res.body.data[0];
            }
            {
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistAttrs: {
                        displayName: 'The Life and Times of Scrooge McDuck',
                        privacy: 1,
                        videoChannelId: server.videoChannel.id
                    }
                });
                playlistUUID = res.body.videoPlaylist.uuid;
                yield extra_utils_1.addVideoInPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistId: res.body.videoPlaylist.id,
                    elementAttrs: {
                        videoId: server.video.id
                    }
                });
            }
        });
    });
    it('Should have a valid oEmbed video response', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const oembedUrl = 'http://localhost:' + server.port + '/videos/watch/' + server.video.uuid;
            const res = yield extra_utils_1.getOEmbed(server.url, oembedUrl);
            const expectedHtml = '<iframe width="560" height="315" sandbox="allow-same-origin allow-scripts" ' +
                `src="http://localhost:${server.port}/videos/embed/${server.video.uuid}" ` +
                'frameborder="0" allowfullscreen></iframe>';
            const expectedThumbnailUrl = 'http://localhost:' + server.port + '/lazy-static/previews/' + server.video.uuid + '.jpg';
            expect(res.body.html).to.equal(expectedHtml);
            expect(res.body.title).to.equal(server.video.name);
            expect(res.body.author_name).to.equal(server.videoChannel.displayName);
            expect(res.body.width).to.equal(560);
            expect(res.body.height).to.equal(315);
            expect(res.body.thumbnail_url).to.equal(expectedThumbnailUrl);
            expect(res.body.thumbnail_width).to.equal(850);
            expect(res.body.thumbnail_height).to.equal(480);
        });
    });
    it('Should have a valid playlist oEmbed response', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const oembedUrl = 'http://localhost:' + server.port + '/videos/watch/playlist/' + playlistUUID;
            const res = yield extra_utils_1.getOEmbed(server.url, oembedUrl);
            const expectedHtml = '<iframe width="560" height="315" sandbox="allow-same-origin allow-scripts" ' +
                `src="http://localhost:${server.port}/video-playlists/embed/${playlistUUID}" ` +
                'frameborder="0" allowfullscreen></iframe>';
            expect(res.body.html).to.equal(expectedHtml);
            expect(res.body.title).to.equal('The Life and Times of Scrooge McDuck');
            expect(res.body.author_name).to.equal(server.videoChannel.displayName);
            expect(res.body.width).to.equal(560);
            expect(res.body.height).to.equal(315);
            expect(res.body.thumbnail_url).exist;
            expect(res.body.thumbnail_width).to.equal(223);
            expect(res.body.thumbnail_height).to.equal(122);
        });
    });
    it('Should have a valid oEmbed response with small max height query', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const oembedUrl = 'http://localhost:' + server.port + '/videos/watch/' + server.video.uuid;
            const format = 'json';
            const maxHeight = 50;
            const maxWidth = 50;
            const res = yield extra_utils_1.getOEmbed(server.url, oembedUrl, format, maxHeight, maxWidth);
            const expectedHtml = '<iframe width="50" height="50" sandbox="allow-same-origin allow-scripts" ' +
                `src="http://localhost:${server.port}/videos/embed/${server.video.uuid}" ` +
                'frameborder="0" allowfullscreen></iframe>';
            expect(res.body.html).to.equal(expectedHtml);
            expect(res.body.title).to.equal(server.video.name);
            expect(res.body.author_name).to.equal(server.videoChannel.displayName);
            expect(res.body.height).to.equal(50);
            expect(res.body.width).to.equal(50);
            expect(res.body).to.not.have.property('thumbnail_url');
            expect(res.body).to.not.have.property('thumbnail_width');
            expect(res.body).to.not.have.property('thumbnail_height');
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests([server]);
        });
    });
});
