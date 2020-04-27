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
require("mocha");
const chai = require("chai");
const jobs_1 = require("../../../shared/extra-utils/server/jobs");
const video_comments_1 = require("../../../shared/extra-utils/videos/video-comments");
const extra_utils_1 = require("../../../shared/extra-utils");
const accounts_1 = require("../../../shared/extra-utils/users/accounts");
const expect = chai.expect;
describe('Test update host scripts', function () {
    let server;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            const overrideConfig = {
                webserver: {
                    port: 9256
                }
            };
            server = yield extra_utils_1.flushAndRunServer(2, overrideConfig);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const videoAttributes = {};
            const resVideo1 = yield extra_utils_1.uploadVideo(server.url, server.accessToken, videoAttributes);
            const video1UUID = resVideo1.body.video.uuid;
            yield extra_utils_1.uploadVideo(server.url, server.accessToken, videoAttributes);
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: 'toto', password: 'coucou' });
            const videoChannel = {
                name: 'second_channel',
                displayName: 'second video channel',
                description: 'super video channel description'
            };
            yield extra_utils_1.addVideoChannel(server.url, server.accessToken, videoChannel);
            const text = 'my super first comment';
            yield video_comments_1.addVideoCommentThread(server.url, server.accessToken, video1UUID, text);
            yield jobs_1.waitJobs(server);
        });
    });
    it('Should run update host', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            extra_utils_1.killallServers([server]);
            yield extra_utils_1.reRunServer(server);
            const env = extra_utils_1.getEnvCli(server);
            yield extra_utils_1.execCLI(`${env} npm run update-host`);
        });
    });
    it('Should have updated videos url', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosList(server.url);
            expect(res.body.total).to.equal(2);
            for (const video of res.body.data) {
                const { body } = yield extra_utils_1.makeActivityPubGetRequest(server.url, '/videos/watch/' + video.uuid);
                expect(body.id).to.equal('http://localhost:9002/videos/watch/' + video.uuid);
                const res = yield extra_utils_1.getVideo(server.url, video.uuid);
                const videoDetails = res.body;
                expect(videoDetails.trackerUrls[0]).to.include(server.host);
                expect(videoDetails.streamingPlaylists[0].playlistUrl).to.include(server.host);
                expect(videoDetails.streamingPlaylists[0].segmentsSha256Url).to.include(server.host);
            }
        });
    });
    it('Should have updated video channels url', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoChannelsList(server.url, 0, 5, '-name');
            expect(res.body.total).to.equal(3);
            for (const channel of res.body.data) {
                const { body } = yield extra_utils_1.makeActivityPubGetRequest(server.url, '/video-channels/' + channel.name);
                expect(body.id).to.equal('http://localhost:9002/video-channels/' + channel.name);
            }
        });
    });
    it('Should have updated accounts url', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield accounts_1.getAccountsList(server.url);
            expect(res.body.total).to.equal(3);
            for (const account of res.body.data) {
                const usernameWithDomain = account.name;
                const { body } = yield extra_utils_1.makeActivityPubGetRequest(server.url, '/accounts/' + usernameWithDomain);
                expect(body.id).to.equal('http://localhost:9002/accounts/' + usernameWithDomain);
            }
        });
    });
    it('Should have updated torrent hosts', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const res = yield extra_utils_1.getVideosList(server.url);
            const videos = res.body.data;
            expect(videos).to.have.lengthOf(2);
            for (const video of videos) {
                const res2 = yield extra_utils_1.getVideo(server.url, video.id);
                const videoDetails = res2.body;
                expect(videoDetails.files).to.have.lengthOf(4);
                for (const file of videoDetails.files) {
                    expect(file.magnetUri).to.contain('localhost%3A9002%2Ftracker%2Fsocket');
                    expect(file.magnetUri).to.contain('localhost%3A9002%2Fstatic%2Fwebseed%2F');
                    const torrent = yield extra_utils_1.parseTorrentVideo(server, videoDetails.uuid, file.resolution.id);
                    const announceWS = torrent.announce.find(a => a === 'ws://localhost:9002/tracker/socket');
                    expect(announceWS).to.not.be.undefined;
                    const announceHttp = torrent.announce.find(a => a === 'http://localhost:9002/tracker/announce');
                    expect(announceHttp).to.not.be.undefined;
                    expect(torrent.urlList[0]).to.contain('http://localhost:9002/static/webseed');
                }
            }
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
