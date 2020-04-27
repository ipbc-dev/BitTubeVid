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
const extra_utils_1 = require("../../../../shared/extra-utils");
const accounts_1 = require("../../../../shared/extra-utils/users/accounts");
const videos_1 = require("../../../../shared/models/videos");
describe('Test AP refresher', function () {
    let servers = [];
    let videoUUID1;
    let videoUUID2;
    let videoUUID3;
    let playlistUUID1;
    let playlistUUID2;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2, { transcoding: { enabled: false } });
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            {
                videoUUID1 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video1' })).uuid;
                videoUUID2 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video2' })).uuid;
                videoUUID3 = (yield extra_utils_1.uploadVideoAndGetId({ server: servers[1], videoName: 'video3' })).uuid;
            }
            {
                const a1 = yield extra_utils_1.generateUserAccessToken(servers[1], 'user1');
                yield extra_utils_1.uploadVideo(servers[1].url, a1, { name: 'video4' });
                const a2 = yield extra_utils_1.generateUserAccessToken(servers[1], 'user2');
                yield extra_utils_1.uploadVideo(servers[1].url, a2, { name: 'video5' });
            }
            {
                const playlistAttrs = { displayName: 'playlist1', privacy: videos_1.VideoPlaylistPrivacy.PUBLIC, videoChannelId: servers[1].videoChannel.id };
                const res = yield extra_utils_1.createVideoPlaylist({ url: servers[1].url, token: servers[1].accessToken, playlistAttrs });
                playlistUUID1 = res.body.videoPlaylist.uuid;
            }
            {
                const playlistAttrs = { displayName: 'playlist2', privacy: videos_1.VideoPlaylistPrivacy.PUBLIC, videoChannelId: servers[1].videoChannel.id };
                const res = yield extra_utils_1.createVideoPlaylist({ url: servers[1].url, token: servers[1].accessToken, playlistAttrs });
                playlistUUID2 = res.body.videoPlaylist.uuid;
            }
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
        });
    });
    describe('Videos refresher', function () {
        it('Should remove a deleted remote video', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield extra_utils_1.wait(10000);
                yield extra_utils_1.setVideoField(servers[1].internalServerNumber, videoUUID1, 'uuid', '304afe4f-39f9-4d49-8ed7-ac57b86b174f');
                yield extra_utils_1.getVideo(servers[0].url, videoUUID1);
                yield extra_utils_1.getVideo(servers[0].url, videoUUID2);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.getVideo(servers[0].url, videoUUID1, 404);
                yield extra_utils_1.getVideo(servers[0].url, videoUUID2, 200);
            });
        });
        it('Should not update a remote video if the remote instance is down', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(70000);
                extra_utils_1.killallServers([servers[1]]);
                yield extra_utils_1.setVideoField(servers[1].internalServerNumber, videoUUID3, 'uuid', '304afe4f-39f9-4d49-8ed7-ac57b86b174e');
                yield extra_utils_1.wait(10000);
                yield extra_utils_1.getVideo(servers[0].url, videoUUID3);
                yield extra_utils_1.waitJobs([servers[0]]);
                yield extra_utils_1.reRunServer(servers[1]);
                yield extra_utils_1.getVideo(servers[0].url, videoUUID3, 200);
            });
        });
    });
    describe('Actors refresher', function () {
        it('Should remove a deleted actor', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield extra_utils_1.wait(10000);
                const to = 'http://localhost:' + servers[1].port + '/accounts/user2';
                yield extra_utils_1.setActorField(servers[1].internalServerNumber, to, 'preferredUsername', 'toto');
                yield accounts_1.getAccount(servers[0].url, 'user1@localhost:' + servers[1].port);
                yield accounts_1.getAccount(servers[0].url, 'user2@localhost:' + servers[1].port);
                yield extra_utils_1.waitJobs(servers);
                yield accounts_1.getAccount(servers[0].url, 'user1@localhost:' + servers[1].port, 200);
                yield accounts_1.getAccount(servers[0].url, 'user2@localhost:' + servers[1].port, 404);
            });
        });
    });
    describe('Playlist refresher', function () {
        it('Should remove a deleted playlist', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(60000);
                yield extra_utils_1.wait(10000);
                yield extra_utils_1.setPlaylistField(servers[1].internalServerNumber, playlistUUID2, 'uuid', '304afe4f-39f9-4d49-8ed7-ac57b86b178e');
                yield extra_utils_1.getVideoPlaylist(servers[0].url, playlistUUID1);
                yield extra_utils_1.getVideoPlaylist(servers[0].url, playlistUUID2);
                yield extra_utils_1.waitJobs(servers);
                yield extra_utils_1.getVideoPlaylist(servers[0].url, playlistUUID1, 200);
                yield extra_utils_1.getVideoPlaylist(servers[0].url, playlistUUID2, 404);
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(10000);
            yield extra_utils_1.cleanupTests(servers);
            yield extra_utils_1.closeAllSequelize(servers);
        });
    });
});
