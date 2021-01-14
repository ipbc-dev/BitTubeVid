"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const jobs_1 = require("../../../../shared/extra-utils/server/jobs");
const video_captions_1 = require("../../../../shared/extra-utils/videos/video-captions");
const expect = chai.expect;
describe('Test video captions', function () {
    let servers;
    let videoUUID;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield index_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield jobs_1.waitJobs(servers);
            const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'my video name' });
            videoUUID = res.body.video.uuid;
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should list the captions and return an empty list', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield video_captions_1.listVideoCaptions(server.url, videoUUID);
                expect(res.body.total).to.equal(0);
                expect(res.body.data).to.have.lengthOf(0);
            }
        });
    });
    it('Should create two new captions', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield video_captions_1.createVideoCaption({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                language: 'ar',
                videoId: videoUUID,
                fixture: 'subtitle-good1.vtt'
            });
            yield video_captions_1.createVideoCaption({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                language: 'zh',
                videoId: videoUUID,
                fixture: 'subtitle-good2.vtt',
                mimeType: 'application/octet-stream'
            });
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should list these uploaded captions', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield video_captions_1.listVideoCaptions(server.url, videoUUID);
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(2);
                const caption1 = res.body.data[0];
                expect(caption1.language.id).to.equal('ar');
                expect(caption1.language.label).to.equal('Arabic');
                expect(caption1.captionPath).to.equal('/lazy-static/video-captions/' + videoUUID + '-ar.vtt');
                yield video_captions_1.testCaptionFile(server.url, caption1.captionPath, 'Subtitle good 1.');
                const caption2 = res.body.data[1];
                expect(caption2.language.id).to.equal('zh');
                expect(caption2.language.label).to.equal('Chinese');
                expect(caption2.captionPath).to.equal('/lazy-static/video-captions/' + videoUUID + '-zh.vtt');
                yield video_captions_1.testCaptionFile(server.url, caption2.captionPath, 'Subtitle good 2.');
            }
        });
    });
    it('Should replace an existing caption', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield video_captions_1.createVideoCaption({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                language: 'ar',
                videoId: videoUUID,
                fixture: 'subtitle-good2.vtt'
            });
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have this caption updated', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield video_captions_1.listVideoCaptions(server.url, videoUUID);
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(2);
                const caption1 = res.body.data[0];
                expect(caption1.language.id).to.equal('ar');
                expect(caption1.language.label).to.equal('Arabic');
                expect(caption1.captionPath).to.equal('/lazy-static/video-captions/' + videoUUID + '-ar.vtt');
                yield video_captions_1.testCaptionFile(server.url, caption1.captionPath, 'Subtitle good 2.');
            }
        });
    });
    it('Should replace an existing caption with a srt file and convert it', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield video_captions_1.createVideoCaption({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                language: 'ar',
                videoId: videoUUID,
                fixture: 'subtitle-good.srt'
            });
            yield jobs_1.waitJobs(servers);
            yield extra_utils_1.wait(3000);
        });
    });
    it('Should have this caption updated and converted', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield video_captions_1.listVideoCaptions(server.url, videoUUID);
                expect(res.body.total).to.equal(2);
                expect(res.body.data).to.have.lengthOf(2);
                const caption1 = res.body.data[0];
                expect(caption1.language.id).to.equal('ar');
                expect(caption1.language.label).to.equal('Arabic');
                expect(caption1.captionPath).to.equal('/lazy-static/video-captions/' + videoUUID + '-ar.vtt');
                const expected = 'WEBVTT FILE\r\n' +
                    '\r\n' +
                    '1\r\n' +
                    '00:00:01.600 --> 00:00:04.200\r\n' +
                    'English (US)\r\n' +
                    '\r\n' +
                    '2\r\n' +
                    '00:00:05.900 --> 00:00:07.999\r\n' +
                    'This is a subtitle in American English\r\n' +
                    '\r\n' +
                    '3\r\n' +
                    '00:00:10.000 --> 00:00:14.000\r\n' +
                    'Adding subtitles is very easy to do\r\n';
                yield video_captions_1.testCaptionFile(server.url, caption1.captionPath, expected);
            }
        });
    });
    it('Should remove one caption', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield video_captions_1.deleteVideoCaption(servers[0].url, servers[0].accessToken, videoUUID, 'ar');
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should only list the caption that was not deleted', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const server of servers) {
                const res = yield video_captions_1.listVideoCaptions(server.url, videoUUID);
                expect(res.body.total).to.equal(1);
                expect(res.body.data).to.have.lengthOf(1);
                const caption = res.body.data[0];
                expect(caption.language.id).to.equal('zh');
                expect(caption.language.label).to.equal('Chinese');
                expect(caption.captionPath).to.equal('/lazy-static/video-captions/' + videoUUID + '-zh.vtt');
                yield video_captions_1.testCaptionFile(server.url, caption.captionPath, 'Subtitle good 2.');
            }
        });
    });
    it('Should remove the video, and thus all video captions', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.removeVideo(servers[0].url, servers[0].accessToken, videoUUID);
            yield extra_utils_1.checkVideoFilesWereRemoved(videoUUID, 1);
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
