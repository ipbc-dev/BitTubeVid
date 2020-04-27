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
const extra_utils_1 = require("../../../shared/extra-utils");
const models_1 = require("../../../shared/models");
const fs_extra_1 = require("fs-extra");
const uuidv4 = require("uuid/v4");
const path_1 = require("path");
const expect = chai.expect;
function countFiles(internalServerNumber, directory) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs_extra_1.readdir(extra_utils_1.buildServerDirectory(internalServerNumber, directory));
        return files.length;
    });
}
function assertNotExists(internalServerNumber, directory, substring) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs_extra_1.readdir(extra_utils_1.buildServerDirectory(internalServerNumber, directory));
        for (const f of files) {
            expect(f).to.not.contain(substring);
        }
    });
}
function assertCountAreOkay(servers) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const server of servers) {
            const videosCount = yield countFiles(server.internalServerNumber, 'videos');
            expect(videosCount).to.equal(8);
            const torrentsCount = yield countFiles(server.internalServerNumber, 'torrents');
            expect(torrentsCount).to.equal(16);
            const previewsCount = yield countFiles(server.internalServerNumber, 'previews');
            expect(previewsCount).to.equal(2);
            const thumbnailsCount = yield countFiles(server.internalServerNumber, 'thumbnails');
            expect(thumbnailsCount).to.equal(6);
            const avatarsCount = yield countFiles(server.internalServerNumber, 'avatars');
            expect(avatarsCount).to.equal(2);
        }
    });
}
describe('Test prune storage scripts', function () {
    let servers;
    const badNames = {};
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(120000);
            servers = yield extra_utils_1.flushAndRunMultipleServers(2, { transcoding: { enabled: true } });
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            for (const server of servers) {
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 1' });
                yield extra_utils_1.uploadVideo(server.url, server.accessToken, { name: 'video 2' });
                yield extra_utils_1.updateMyAvatar({ url: server.url, accessToken: server.accessToken, fixture: 'avatar.png' });
                yield extra_utils_1.createVideoPlaylist({
                    url: server.url,
                    token: server.accessToken,
                    playlistAttrs: {
                        displayName: 'playlist',
                        privacy: models_1.VideoPlaylistPrivacy.PUBLIC,
                        videoChannelId: server.videoChannel.id,
                        thumbnailfile: 'thumbnail.jpg'
                    }
                });
            }
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            {
                const res = yield extra_utils_1.getAccount(servers[0].url, 'root@localhost:' + servers[1].port);
                const account = res.body;
                yield extra_utils_1.makeGetRequest({
                    url: servers[0].url,
                    path: account.avatar.path,
                    statusCodeExpected: 200
                });
            }
            {
                const res = yield extra_utils_1.getAccount(servers[1].url, 'root@localhost:' + servers[0].port);
                const account = res.body;
                yield extra_utils_1.makeGetRequest({
                    url: servers[1].url,
                    path: account.avatar.path,
                    statusCodeExpected: 200
                });
            }
            yield extra_utils_1.wait(1000);
            yield jobs_1.waitJobs(servers);
        });
    });
    it('Should have the files on the disk', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield assertCountAreOkay(servers);
        });
    });
    it('Should create some dirty files', function () {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 2; i++) {
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'videos');
                    const n1 = uuidv4() + '.mp4';
                    const n2 = uuidv4() + '.webm';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['videos'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'torrents');
                    const n1 = uuidv4() + '-240.torrent';
                    const n2 = uuidv4() + '-480.torrent';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['torrents'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'thumbnails');
                    const n1 = uuidv4() + '.jpg';
                    const n2 = uuidv4() + '.jpg';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['thumbnails'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'previews');
                    const n1 = uuidv4() + '.jpg';
                    const n2 = uuidv4() + '.jpg';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['previews'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'avatars');
                    const n1 = uuidv4() + '.png';
                    const n2 = uuidv4() + '.jpg';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['avatars'] = [n1, n2];
                }
            }
        });
    });
    it('Should run prune storage', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`echo y | ${env} npm run prune-storage`);
        });
    });
    it('Should have removed files', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield assertCountAreOkay(servers);
            for (const directory of Object.keys(badNames)) {
                for (const name of badNames[directory]) {
                    yield assertNotExists(servers[0].internalServerNumber, directory, name);
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
