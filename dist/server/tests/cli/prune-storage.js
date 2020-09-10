"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const jobs_1 = require("../../../shared/extra-utils/server/jobs");
const extra_utils_1 = require("../../../shared/extra-utils");
const fs_extra_1 = require("fs-extra");
const uuid_1 = require("uuid");
const path_1 = require("path");
const expect = chai.expect;
function countFiles(internalServerNumber, directory) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const files = yield fs_extra_1.readdir(extra_utils_1.buildServerDirectory(internalServerNumber, directory));
        return files.length;
    });
}
function assertNotExists(internalServerNumber, directory, substring) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const files = yield fs_extra_1.readdir(extra_utils_1.buildServerDirectory(internalServerNumber, directory));
        for (const f of files) {
            expect(f).to.not.contain(substring);
        }
    });
}
function assertCountAreOkay(servers) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                        privacy: 1,
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield assertCountAreOkay(servers);
        });
    });
    it('Should create some dirty files', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 2; i++) {
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'videos');
                    const n1 = uuid_1.v4() + '.mp4';
                    const n2 = uuid_1.v4() + '.webm';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['videos'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'torrents');
                    const n1 = uuid_1.v4() + '-240.torrent';
                    const n2 = uuid_1.v4() + '-480.torrent';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['torrents'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'thumbnails');
                    const n1 = uuid_1.v4() + '.jpg';
                    const n2 = uuid_1.v4() + '.jpg';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['thumbnails'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'previews');
                    const n1 = uuid_1.v4() + '.jpg';
                    const n2 = uuid_1.v4() + '.jpg';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['previews'] = [n1, n2];
                }
                {
                    const base = extra_utils_1.buildServerDirectory(servers[0].internalServerNumber, 'avatars');
                    const n1 = uuid_1.v4() + '.png';
                    const n2 = uuid_1.v4() + '.jpg';
                    yield fs_extra_1.createFile(path_1.join(base, n1));
                    yield fs_extra_1.createFile(path_1.join(base, n2));
                    badNames['avatars'] = [n1, n2];
                }
            }
        });
    });
    it('Should run prune storage', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const env = extra_utils_1.getEnvCli(servers[0]);
            yield extra_utils_1.execCLI(`echo y | ${env} npm run prune-storage`);
        });
    });
    it('Should have removed files', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield assertCountAreOkay(servers);
            for (const directory of Object.keys(badNames)) {
                for (const name of badNames[directory]) {
                    yield assertNotExists(servers[0].internalServerNumber, directory, name);
                }
            }
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests(servers);
        });
    });
});
