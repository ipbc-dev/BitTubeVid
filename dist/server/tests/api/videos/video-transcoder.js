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
const chai = require("chai");
require("mocha");
const lodash_1 = require("lodash");
const videos_1 = require("../../../../shared/models/videos");
const ffmpeg_utils_1 = require("../../../helpers/ffmpeg-utils");
const extra_utils_1 = require("../../../../shared/extra-utils");
const path_1 = require("path");
const constants_1 = require("../../../../server/initializers/constants");
const expect = chai.expect;
describe('Test video transcoding', function () {
    let servers = [];
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    it('Should not transcode video on server 1', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributes = {
                name: 'my super name for server 1',
                description: 'my super description for server 1',
                fixture: 'video_short.webm'
            };
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data[0];
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(1);
                const magnetUri = videoDetails.files[0].magnetUri;
                expect(magnetUri).to.match(/\.webm/);
                const torrent = yield extra_utils_1.webtorrentAdd(magnetUri, true);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).match(/\.webm$/);
            }
        });
    });
    it('Should transcode video on server 2', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributes = {
                name: 'my super name for server 2',
                description: 'my super description for server 2',
                fixture: 'video_short.webm'
            };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === videoAttributes.name);
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(4);
                const magnetUri = videoDetails.files[0].magnetUri;
                expect(magnetUri).to.match(/\.mp4/);
                const torrent = yield extra_utils_1.webtorrentAdd(magnetUri, true);
                expect(torrent.files).to.be.an('array');
                expect(torrent.files.length).to.equal(1);
                expect(torrent.files[0].path).match(/\.mp4$/);
            }
        });
    });
    it('Should transcode high bit rate mp3 to proper bit rate', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributes = {
                name: 'mp3_256k',
                fixture: 'video_short_mp3_256k.mp4'
            };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === videoAttributes.name);
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(4);
                const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-240.mp4');
                const probe = yield ffmpeg_utils_1.audio.get(path);
                if (probe.audioStream) {
                    expect(probe.audioStream['codec_name']).to.be.equal('aac');
                    expect(probe.audioStream['bit_rate']).to.be.at.most(384 * 8000);
                }
                else {
                    this.fail('Could not retrieve the audio stream on ' + probe.absolutePath);
                }
            }
        });
    });
    it('Should transcode video with no audio and have no audio itself', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributes = {
                name: 'no_audio',
                fixture: 'video_short_no_audio.mp4'
            };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === videoAttributes.name);
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(4);
                const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-240.mp4');
                const probe = yield ffmpeg_utils_1.audio.get(path);
                expect(probe).to.not.have.property('audioStream');
            }
        });
    });
    it('Should leave the audio untouched, but properly transcode the video', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributes = {
                name: 'untouched_audio',
                fixture: 'video_short.mp4'
            };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === videoAttributes.name);
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(4);
                const fixturePath = extra_utils_1.buildAbsoluteFixturePath(videoAttributes.fixture);
                const fixtureVideoProbe = yield ffmpeg_utils_1.audio.get(fixturePath);
                const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-240.mp4');
                const videoProbe = yield ffmpeg_utils_1.audio.get(path);
                if (videoProbe.audioStream && fixtureVideoProbe.audioStream) {
                    const toOmit = ['max_bit_rate', 'duration', 'duration_ts', 'nb_frames', 'start_time', 'start_pts'];
                    expect(lodash_1.omit(videoProbe.audioStream, toOmit)).to.be.deep.equal(lodash_1.omit(fixtureVideoProbe.audioStream, toOmit));
                }
                else {
                    this.fail('Could not retrieve the audio stream on ' + videoProbe.absolutePath);
                }
            }
        });
    });
    it('Should transcode a 60 FPS video', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributes = {
                name: 'my super 30fps name for server 2',
                description: 'my super 30fps description for server 2',
                fixture: '60fps_720p_small.mp4'
            };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === videoAttributes.name);
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(4);
                expect(videoDetails.files[0].fps).to.be.above(58).and.below(62);
                expect(videoDetails.files[1].fps).to.be.below(31);
                expect(videoDetails.files[2].fps).to.be.below(31);
                expect(videoDetails.files[3].fps).to.be.below(31);
                for (const resolution of ['240', '360', '480']) {
                    const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-' + resolution + '.mp4');
                    const fps = yield ffmpeg_utils_1.getVideoFileFPS(path);
                    expect(fps).to.be.below(31);
                }
                const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-720.mp4');
                const fps = yield ffmpeg_utils_1.getVideoFileFPS(path);
                expect(fps).to.be.above(58).and.below(62);
            }
        });
    });
    it('Should wait for transcoding before publishing the video', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(80000);
            {
                const videoAttributes = {
                    name: 'waiting video',
                    fixture: 'video_short1.webm',
                    waitTranscoding: true
                };
                const resVideo = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
                const videoId = resVideo.body.video.uuid;
                const { body } = yield extra_utils_1.getVideo(servers[1].url, videoId);
                expect(body.name).to.equal('waiting video');
                expect(body.state.id).to.equal(videos_1.VideoState.TO_TRANSCODE);
                expect(body.state.label).to.equal('To transcode');
                expect(body.waitTranscoding).to.be.true;
                const resMyVideos = yield extra_utils_1.getMyVideos(servers[1].url, servers[1].accessToken, 0, 10);
                const videoToFindInMine = resMyVideos.body.data.find(v => v.name === videoAttributes.name);
                expect(videoToFindInMine).not.to.be.undefined;
                expect(videoToFindInMine.state.id).to.equal(videos_1.VideoState.TO_TRANSCODE);
                expect(videoToFindInMine.state.label).to.equal('To transcode');
                expect(videoToFindInMine.waitTranscoding).to.be.true;
                const resVideos = yield extra_utils_1.getVideosList(servers[1].url);
                const videoToFindInList = resVideos.body.data.find(v => v.name === videoAttributes.name);
                expect(videoToFindInList).to.be.undefined;
                yield extra_utils_1.getVideo(servers[0].url, videoId, 404);
            }
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const videoToFind = res.body.data.find(v => v.name === 'waiting video');
                expect(videoToFind).not.to.be.undefined;
                const res2 = yield extra_utils_1.getVideo(server.url, videoToFind.id);
                const videoDetails = res2.body;
                expect(videoDetails.state.id).to.equal(videos_1.VideoState.PUBLISHED);
                expect(videoDetails.state.label).to.equal('Published');
                expect(videoDetails.waitTranscoding).to.be.true;
            }
        });
    });
    it('Should respect maximum bitrate values', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(160000);
            let tempFixturePath;
            {
                tempFixturePath = yield extra_utils_1.generateHighBitrateVideo();
                const bitrate = yield ffmpeg_utils_1.getVideoFileBitrate(tempFixturePath);
                expect(bitrate).to.be.above(videos_1.getMaxBitrate(videos_1.VideoResolution.H_1080P, 25, constants_1.VIDEO_TRANSCODING_FPS));
            }
            const videoAttributes = {
                name: 'high bitrate video',
                description: 'high bitrate video',
                fixture: tempFixturePath
            };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === videoAttributes.name);
                for (const resolution of ['240', '360', '480', '720', '1080']) {
                    const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-' + resolution + '.mp4');
                    const bitrate = yield ffmpeg_utils_1.getVideoFileBitrate(path);
                    const fps = yield ffmpeg_utils_1.getVideoFileFPS(path);
                    const resolution2 = yield ffmpeg_utils_1.getVideoFileResolution(path);
                    expect(resolution2.videoFileResolution.toString()).to.equal(resolution);
                    expect(bitrate).to.be.below(videos_1.getMaxBitrate(resolution2.videoFileResolution, fps, constants_1.VIDEO_TRANSCODING_FPS));
                }
            }
        });
    });
    it('Should accept and transcode additional extensions', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(300000);
            let tempFixturePath;
            {
                tempFixturePath = yield extra_utils_1.generateHighBitrateVideo();
                const bitrate = yield ffmpeg_utils_1.getVideoFileBitrate(tempFixturePath);
                expect(bitrate).to.be.above(videos_1.getMaxBitrate(videos_1.VideoResolution.H_1080P, 25, constants_1.VIDEO_TRANSCODING_FPS));
            }
            for (const fixture of ['video_short.mkv', 'video_short.avi']) {
                const videoAttributes = {
                    name: fixture,
                    fixture
                };
                yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
                yield extra_utils_1.waitJobs(servers);
                for (const server of servers) {
                    const res = yield extra_utils_1.getVideosList(server.url);
                    const video = res.body.data.find(v => v.name === videoAttributes.name);
                    const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                    const videoDetails = res2.body;
                    expect(videoDetails.files).to.have.lengthOf(4);
                    const magnetUri = videoDetails.files[0].magnetUri;
                    expect(magnetUri).to.contain('.mp4');
                }
            }
        });
    });
    it('Should correctly detect if quick transcode is possible', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            expect(yield ffmpeg_utils_1.canDoQuickTranscode(extra_utils_1.buildAbsoluteFixturePath('video_short.mp4'))).to.be.true;
            expect(yield ffmpeg_utils_1.canDoQuickTranscode(extra_utils_1.buildAbsoluteFixturePath('video_short.webm'))).to.be.false;
        });
    });
    it('Should merge an audio file with the preview file', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributesArg = { name: 'audio_with_preview', previewfile: 'preview.jpg', fixture: 'sample.ogg' };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributesArg);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === 'audio_with_preview');
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(1);
                yield extra_utils_1.makeGetRequest({ url: server.url, path: videoDetails.thumbnailPath, statusCodeExpected: 200 });
                yield extra_utils_1.makeGetRequest({ url: server.url, path: videoDetails.previewPath, statusCodeExpected: 200 });
                const magnetUri = videoDetails.files[0].magnetUri;
                expect(magnetUri).to.contain('.mp4');
            }
        });
    });
    it('Should upload an audio file and choose a default background image', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const videoAttributesArg = { name: 'audio_without_preview', fixture: 'sample.ogg' };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributesArg);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === 'audio_without_preview');
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(1);
                yield extra_utils_1.makeGetRequest({ url: server.url, path: videoDetails.thumbnailPath, statusCodeExpected: 200 });
                yield extra_utils_1.makeGetRequest({ url: server.url, path: videoDetails.previewPath, statusCodeExpected: 200 });
                const magnetUri = videoDetails.files[0].magnetUri;
                expect(magnetUri).to.contain('.mp4');
            }
        });
    });
    it('Should downscale to the closest divisor standard framerate', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(160000);
            let tempFixturePath;
            {
                tempFixturePath = yield extra_utils_1.generateVideoWithFramerate(59);
                const fps = yield ffmpeg_utils_1.getVideoFileFPS(tempFixturePath);
                expect(fps).to.be.equal(59);
            }
            const videoAttributes = {
                name: '59fps video',
                description: '59fps video',
                fixture: tempFixturePath
            };
            yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, videoAttributes);
            yield extra_utils_1.waitJobs(servers);
            for (const server of servers) {
                const res = yield extra_utils_1.getVideosList(server.url);
                const video = res.body.data.find(v => v.name === videoAttributes.name);
                {
                    const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-240.mp4');
                    const fps = yield ffmpeg_utils_1.getVideoFileFPS(path);
                    expect(fps).to.be.equal(25);
                }
                {
                    const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', video.uuid + '-720.mp4');
                    const fps = yield ffmpeg_utils_1.getVideoFileFPS(path);
                    expect(fps).to.be.equal(59);
                }
            }
        });
    });
    it('Should provide valid ffprobe data', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(160000);
            const videoUUID = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'ffprobe data' })).uuid;
            yield extra_utils_1.waitJobs(servers);
            {
                const path = path_1.join(extra_utils_1.root(), 'test' + servers[1].internalServerNumber, 'videos', videoUUID + '-240.mp4');
                const metadata = yield ffmpeg_utils_1.getMetadataFromFile(path);
                for (const p of [
                    'tags.encoder',
                    'format_long_name',
                    'size',
                    'bit_rate'
                ]) {
                    expect(metadata.format).to.have.nested.property(p);
                }
                for (const p of [
                    'codec_long_name',
                    'profile',
                    'width',
                    'height',
                    'display_aspect_ratio',
                    'avg_frame_rate',
                    'pix_fmt'
                ]) {
                    expect(metadata.streams[0]).to.have.nested.property(p);
                }
                expect(metadata).to.not.have.nested.property('format.filename');
            }
            for (const server of servers) {
                const res2 = yield extra_utils_1.getVideo(server.url, videoUUID);
                const videoDetails = res2.body;
                const videoFiles = videoDetails.files
                    .concat(videoDetails.streamingPlaylists[0].files);
                expect(videoFiles).to.have.lengthOf(8);
                for (const file of videoFiles) {
                    expect(file.metadata).to.be.undefined;
                    expect(file.metadataUrl).to.exist;
                    expect(file.metadataUrl).to.contain(servers[1].url);
                    expect(file.metadataUrl).to.contain(videoUUID);
                    const res3 = yield extra_utils_1.getVideoFileMetadataUrl(file.metadataUrl);
                    const metadata = res3.body;
                    expect(metadata).to.have.nested.property('format.size');
                }
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
