"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../../shared/extra-utils");
const miscs_1 = require("../../../../shared/extra-utils/miscs/miscs");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const video_imports_1 = require("../../../../shared/extra-utils/videos/video-imports");
const expect = chai.expect;
describe('Test video imports', function () {
    let servers = [];
    let channelIdServer1;
    let channelIdServer2;
    if (miscs_1.areHttpImportTestsDisabled())
        return;
    function checkVideosServer1(url, idHttp, idMagnet, idTorrent) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const resHttp = yield extra_utils_1.getVideo(url, idHttp);
            const videoHttp = resHttp.body;
            expect(videoHttp.name).to.equal('small video - youtube');
            expect(videoHttp.language.label).to.equal('Unknown');
            expect(videoHttp.nsfw).to.be.false;
            expect(videoHttp.description).to.equal('this is a super description');
            expect(videoHttp.tags).to.deep.equal(['tag1', 'tag2']);
            expect(videoHttp.files).to.have.lengthOf(1);
            const originallyPublishedAt = new Date(videoHttp.originallyPublishedAt);
            expect(originallyPublishedAt.getDate()).to.equal(14);
            expect(originallyPublishedAt.getMonth()).to.equal(0);
            expect(originallyPublishedAt.getFullYear()).to.equal(2019);
            const resMagnet = yield extra_utils_1.getVideo(url, idMagnet);
            const videoMagnet = resMagnet.body;
            const resTorrent = yield extra_utils_1.getVideo(url, idTorrent);
            const videoTorrent = resTorrent.body;
            for (const video of [videoMagnet, videoTorrent]) {
                expect(video.category.label).to.equal('Misc');
                expect(video.licence.label).to.equal('Unknown');
                expect(video.language.label).to.equal('Unknown');
                expect(video.nsfw).to.be.false;
                expect(video.description).to.equal('this is a super torrent description');
                expect(video.tags).to.deep.equal(['tag_torrent1', 'tag_torrent2']);
                expect(video.files).to.have.lengthOf(1);
            }
            expect(videoTorrent.name).to.contain('你好 世界 720p.mp4');
            expect(videoMagnet.name).to.contain('super peertube2 video');
            const resCaptions = yield extra_utils_1.listVideoCaptions(url, idHttp);
            expect(resCaptions.body.total).to.equal(2);
        });
    }
    function checkVideoServer2(url, id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideo(url, id);
            const video = res.body;
            expect(video.name).to.equal('my super name');
            expect(video.category.label).to.equal('Entertainment');
            expect(video.licence.label).to.equal('Public Domain Dedication');
            expect(video.language.label).to.equal('English');
            expect(video.nsfw).to.be.false;
            expect(video.description).to.equal('my super description');
            expect(video.tags).to.deep.equal(['supertag1', 'supertag2']);
            expect(video.files).to.have.lengthOf(1);
            const resCaptions = yield extra_utils_1.listVideoCaptions(url, id);
            expect(resCaptions.body.total).to.equal(2);
        });
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            {
                const res = yield extra_utils_1.getMyUserInformation(servers[0].url, servers[0].accessToken);
                channelIdServer1 = res.body.videoChannels[0].id;
            }
            {
                const res = yield extra_utils_1.getMyUserInformation(servers[1].url, servers[1].accessToken);
                channelIdServer2 = res.body.videoChannels[0].id;
            }
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should import videos on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const baseAttributes = {
                channelId: channelIdServer1,
                privacy: 1
            };
            {
                const attributes = extra_utils_1.immutableAssign(baseAttributes, { targetUrl: video_imports_1.getYoutubeVideoUrl() });
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                expect(res.body.video.name).to.equal('small video - youtube');
                expect(res.body.video.thumbnailPath).to.equal(`/static/thumbnails/${res.body.video.uuid}.jpg`);
                expect(res.body.video.previewPath).to.equal(`/lazy-static/previews/${res.body.video.uuid}.jpg`);
                yield miscs_1.testImage(servers[0].url, 'video_import_thumbnail', res.body.video.thumbnailPath);
                yield miscs_1.testImage(servers[0].url, 'video_import_preview', res.body.video.previewPath);
                const resCaptions = yield extra_utils_1.listVideoCaptions(servers[0].url, res.body.video.id);
                const videoCaptions = resCaptions.body.data;
                expect(videoCaptions).to.have.lengthOf(2);
                const enCaption = videoCaptions.find(caption => caption.language.id === 'en');
                expect(enCaption).to.exist;
                expect(enCaption.language.label).to.equal('English');
                expect(enCaption.captionPath).to.equal(`/lazy-static/video-captions/${res.body.video.uuid}-en.vtt`);
                yield extra_utils_1.testCaptionFile(servers[0].url, enCaption.captionPath, `WEBVTT
Kind: captions
Language: en

00:00:01.600 --> 00:00:04.200
English (US)

00:00:05.900 --> 00:00:07.999
This is a subtitle in American English

00:00:10.000 --> 00:00:14.000
Adding subtitles is very easy to do`);
                const frCaption = videoCaptions.find(caption => caption.language.id === 'fr');
                expect(frCaption).to.exist;
                expect(frCaption.language.label).to.equal('French');
                expect(frCaption.captionPath).to.equal(`/lazy-static/video-captions/${res.body.video.uuid}-fr.vtt`);
                yield extra_utils_1.testCaptionFile(servers[0].url, frCaption.captionPath, `WEBVTT
Kind: captions
Language: fr

00:00:01.600 --> 00:00:04.200
Français (FR)

00:00:05.900 --> 00:00:07.999
C'est un sous-titre français

00:00:10.000 --> 00:00:14.000
Ajouter un sous-titre est vraiment facile`);
            }
            {
                const attributes = extra_utils_1.immutableAssign(baseAttributes, {
                    magnetUri: video_imports_1.getMagnetURI(),
                    description: 'this is a super torrent description',
                    tags: ['tag_torrent1', 'tag_torrent2']
                });
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                expect(res.body.video.name).to.equal('super peertube2 video');
            }
            {
                const attributes = extra_utils_1.immutableAssign(baseAttributes, {
                    torrentfile: 'video-720p.torrent',
                    description: 'this is a super torrent description',
                    tags: ['tag_torrent1', 'tag_torrent2']
                });
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                expect(res.body.video.name).to.equal('你好 世界 720p.mp4');
            }
        });
    });
    it('Should list the videos to import in my videos on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getMyVideos(servers[0].url, servers[0].accessToken, 0, 5, 'createdAt');
            expect(res.body.total).to.equal(3);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(3);
            expect(videos[0].name).to.equal('small video - youtube');
            expect(videos[1].name).to.equal('super peertube2 video');
            expect(videos[2].name).to.equal('你好 世界 720p.mp4');
        });
    });
    it('Should list the videos to import in my imports on server 1', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield video_imports_1.getMyVideoImports(servers[0].url, servers[0].accessToken, '-createdAt');
            expect(res.body.total).to.equal(3);
            const videoImports = res.body.data;
            expect(videoImports).to.have.lengthOf(3);
            expect(videoImports[2].targetUrl).to.equal(video_imports_1.getYoutubeVideoUrl());
            expect(videoImports[2].magnetUri).to.be.null;
            expect(videoImports[2].torrentName).to.be.null;
            expect(videoImports[2].video.name).to.equal('small video - youtube');
            expect(videoImports[1].targetUrl).to.be.null;
            expect(videoImports[1].magnetUri).to.equal(video_imports_1.getMagnetURI());
            expect(videoImports[1].torrentName).to.be.null;
            expect(videoImports[1].video.name).to.equal('super peertube2 video');
            expect(videoImports[0].targetUrl).to.be.null;
            expect(videoImports[0].magnetUri).to.be.null;
            expect(videoImports[0].torrentName).to.equal('video-720p.torrent');
            expect(videoImports[0].video.name).to.equal('你好 世界 720p.mp4');
        });
    });
    it('Should have the video listed on the two instances', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.total).to.equal(3);
                expect(res.body.data).to.have.lengthOf(3);
                const [videoHttp, videoMagnet, videoTorrent] = res.body.data;
                yield checkVideosServer1(server.url, videoHttp.uuid, videoMagnet.uuid, videoTorrent.uuid);
            }
        });
    });
    it('Should import a video on server 2 with some fields', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const attributes = {
                targetUrl: video_imports_1.getYoutubeVideoUrl(),
                channelId: channelIdServer2,
                privacy: 1,
                category: 10,
                licence: 7,
                language: 'en',
                name: 'my super name',
                description: 'my super description',
                tags: ['supertag1', 'supertag2']
            };
            const res = yield video_imports_1.importVideo(servers[1].url, servers[1].accessToken, attributes);
            expect(res.body.video.name).to.equal('my super name');
        });
    });
    it('Should have the videos listed on the two instances', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                expect(res.body.total).to.equal(4);
                expect(res.body.data).to.have.lengthOf(4);
                yield checkVideoServer2(server.url, res.body.data[0].uuid);
                const [, videoHttp, videoMagnet, videoTorrent] = res.body.data;
                yield checkVideosServer1(server.url, videoHttp.uuid, videoMagnet.uuid, videoTorrent.uuid);
            }
        });
    });
    it('Should import a video that will be transcoded', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            const attributes = {
                name: 'transcoded video',
                magnetUri: video_imports_1.getMagnetURI(),
                channelId: channelIdServer2,
                privacy: 1
            };
            const res = yield video_imports_1.importVideo(servers[1].url, servers[1].accessToken, attributes);
            const videoUUID = res.body.video.uuid;
            yield jobs_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideo(server.url, videoUUID);
                const video = res.body;
                expect(video.name).to.equal('transcoded video');
                expect(video.files).to.have.lengthOf(4);
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
