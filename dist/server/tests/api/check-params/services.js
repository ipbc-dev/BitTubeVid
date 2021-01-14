"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const http_error_codes_1 = require("../../../../shared/core-utils/miscs/http-error-codes");
describe('Test services API validators', function () {
    let server;
    let playlistUUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            yield extra_utils_1.setDefaultVideoChannel([server]);
            {
                const res = yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'my super name' });
                server.video = res.body.video;
            }
            {
                const res = yield extra_utils_1.createVideoPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistAttrs: {
                        displayName: 'super playlist',
                        privacy: 1,
                        videoChannelId: server.videoChannel.id
                    }
                });
                playlistUUID = res.body.videoPlaylist.uuid;
            }
        });
    });
    describe('Test oEmbed API validators', function () {
        it('Should fail with an invalid url', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = 'hello.com';
                yield checkParamEmbed(server, embedUrl);
            });
        });
        it('Should fail with an invalid host', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = 'http://hello.com/videos/watch/' + server.video.uuid;
                yield checkParamEmbed(server, embedUrl);
            });
        });
        it('Should fail with an invalid element id', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/blabla`;
                yield checkParamEmbed(server, embedUrl);
            });
        });
        it('Should fail with an unknown element', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/88fc0165-d1f0-4a35-a51a-3b47f668689c`;
                yield checkParamEmbed(server, embedUrl, http_error_codes_1.HttpStatusCode.NOT_FOUND_404);
            });
        });
        it('Should fail with an invalid path', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watchs/${server.video.uuid}`;
                yield checkParamEmbed(server, embedUrl);
            });
        });
        it('Should fail with an invalid max height', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/${server.video.uuid}`;
                yield checkParamEmbed(server, embedUrl, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400, { maxheight: 'hello' });
            });
        });
        it('Should fail with an invalid max width', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/${server.video.uuid}`;
                yield checkParamEmbed(server, embedUrl, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400, { maxwidth: 'hello' });
            });
        });
        it('Should fail with an invalid format', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/${server.video.uuid}`;
                yield checkParamEmbed(server, embedUrl, http_error_codes_1.HttpStatusCode.BAD_REQUEST_400, { format: 'blabla' });
            });
        });
        it('Should fail with a non supported format', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/${server.video.uuid}`;
                yield checkParamEmbed(server, embedUrl, http_error_codes_1.HttpStatusCode.NOT_IMPLEMENTED_501, { format: 'xml' });
            });
        });
        it('Should succeed with the correct params with a video', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/${server.video.uuid}`;
                const query = {
                    format: 'json',
                    maxheight: 400,
                    maxwidth: 400
                };
                yield checkParamEmbed(server, embedUrl, http_error_codes_1.HttpStatusCode.OK_200, query);
            });
        });
        it('Should succeed with the correct params with a playlist', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const embedUrl = `http://localhost:${server.port}/videos/watch/playlist/${playlistUUID}`;
                const query = {
                    format: 'json',
                    maxheight: 400,
                    maxwidth: 400
                };
                yield checkParamEmbed(server, embedUrl, http_error_codes_1.HttpStatusCode.OK_200, query);
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
function checkParamEmbed(server, embedUrl, statusCodeExpected = http_error_codes_1.HttpStatusCode.BAD_REQUEST_400, query = {}) {
    const path = '/services/oembed';
    return extra_utils_1.makeGetRequest({
        url: server.url,
        path,
        query: Object.assign(query, { url: embedUrl }),
        statusCodeExpected
    });
}
