"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const chai = require("chai");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
const video_imports_1 = require("../../../shared/extra-utils/videos/video-imports");
const expect = chai.expect;
describe('Test plugin filter hooks', function () {
    let servers;
    let videoUUID;
    let threadId;
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield servers_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            yield extra_utils_1.doubleFollow(servers[0], servers[1]);
            yield extra_utils_1.installPlugin({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                path: extra_utils_1.getPluginTestPath()
            });
            yield extra_utils_1.installPlugin({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                path: extra_utils_1.getPluginTestPath('-two')
            });
            for (let i = 0; i < 10; i++) {
                yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'default video ' + i });
            }
            const res = yield extra_utils_1.getVideosList(servers[0].url);
            videoUUID = res.body.data[0].uuid;
        });
    });
    it('Should run filter:api.videos.list.params', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosListPagination(servers[0].url, 0, 2);
            expect(res.body.data).to.have.lengthOf(4);
        });
    });
    it('Should run filter:api.videos.list.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosListPagination(servers[0].url, 0, 0);
            expect(res.body.total).to.equal(11);
        });
    });
    it('Should run filter:api.video.get.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideo(servers[0].url, videoUUID);
            expect(res.body.name).to.contain('<3');
        });
    });
    it('Should run filter:api.video.upload.accept.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video with bad word' }, 403);
        });
    });
    it('Should run filter:api.video.pre-import-url.accept.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const baseAttributes = {
                name: 'normal title',
                privacy: 1,
                channelId: servers[0].videoChannel.id,
                targetUrl: video_imports_1.getGoodVideoUrl() + 'bad'
            };
            yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, baseAttributes, 403);
        });
    });
    it('Should run filter:api.video.pre-import-torrent.accept.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const baseAttributes = {
                name: 'bad torrent',
                privacy: 1,
                channelId: servers[0].videoChannel.id,
                torrentfile: 'video-720p.torrent'
            };
            yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, baseAttributes, 403);
        });
    });
    it('Should run filter:api.video.post-import-url.accept.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            let videoImportId;
            {
                const baseAttributes = {
                    name: 'title with bad word',
                    privacy: 1,
                    channelId: servers[0].videoChannel.id,
                    targetUrl: video_imports_1.getGoodVideoUrl()
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, baseAttributes);
                videoImportId = res.body.id;
            }
            yield extra_utils_1.waitJobs(servers);
            {
                const res = yield video_imports_1.getMyVideoImports(servers[0].url, servers[0].accessToken);
                const videoImports = res.body.data;
                const videoImport = videoImports.find(i => i.id === videoImportId);
                expect(videoImport.state.id).to.equal(4);
                expect(videoImport.state.label).to.equal('Rejected');
            }
        });
    });
    it('Should run filter:api.video.post-import-torrent.accept.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(60000);
            let videoImportId;
            {
                const baseAttributes = {
                    name: 'title with bad word',
                    privacy: 1,
                    channelId: servers[0].videoChannel.id,
                    torrentfile: 'video-720p.torrent'
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, baseAttributes);
                videoImportId = res.body.id;
            }
            yield extra_utils_1.waitJobs(servers);
            {
                const res = yield video_imports_1.getMyVideoImports(servers[0].url, servers[0].accessToken);
                const videoImports = res.body.data;
                const videoImport = videoImports.find(i => i.id === videoImportId);
                expect(videoImport.state.id).to.equal(4);
                expect(videoImport.state.label).to.equal('Rejected');
            }
        });
    });
    it('Should run filter:api.video-thread.create.accept.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, 'comment with bad word', 403);
        });
    });
    it('Should run filter:api.video-comment-reply.create.accept.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, 'thread');
            threadId = res.body.comment.id;
            yield extra_utils_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID, threadId, 'comment with bad word', 403);
            yield extra_utils_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID, threadId, 'comment with good word', 200);
        });
    });
    it('Should run filter:api.video-threads.list.params', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoCommentThreads(servers[0].url, videoUUID, 0, 0);
            expect(res.body.data).to.have.lengthOf(1);
        });
    });
    it('Should run filter:api.video-threads.list.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoCommentThreads(servers[0].url, videoUUID, 0, 0);
            expect(res.body.total).to.equal(2);
        });
    });
    it('Should run filter:api.video-thread-comments.list.params');
    it('Should run filter:api.video-thread-comments.list.result', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoThreadComments(servers[0].url, videoUUID, threadId);
            const thread = res.body;
            expect(thread.comment.text.endsWith(' <3')).to.be.true;
        });
    });
    describe('Should run filter:video.auto-blacklist.result', function () {
        function checkIsBlacklisted(oldRes, value) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const videoId = oldRes.body.video.uuid;
                const res = yield extra_utils_1.getVideoWithToken(servers[0].url, servers[0].accessToken, videoId);
                const video = res.body;
                expect(video.blacklisted).to.equal(value);
            });
        }
        it('Should blacklist on upload', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video please blacklist me' });
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on import', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                const attributes = {
                    name: 'video please blacklist me',
                    targetUrl: video_imports_1.getGoodVideoUrl(),
                    channelId: servers[0].videoChannel.id
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on update', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video' });
                const videoId = res.body.video.uuid;
                yield checkIsBlacklisted(res, false);
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, videoId, { name: 'please blacklist me' });
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on remote upload', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(45000);
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'remote please blacklist me' });
                yield extra_utils_1.waitJobs(servers);
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on remote update', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.timeout(45000);
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'video' });
                yield extra_utils_1.waitJobs(servers);
                const videoId = res.body.video.uuid;
                yield checkIsBlacklisted(res, false);
                yield extra_utils_1.updateVideo(servers[1].url, servers[1].accessToken, videoId, { name: 'please blacklist me' });
                yield extra_utils_1.waitJobs(servers);
                yield checkIsBlacklisted(res, true);
            });
        });
    });
    describe('Should run filter:api.user.signup.allowed.result', function () {
        it('Should run on config endpoint', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getConfig(servers[0].url);
                expect(res.body.signup.allowed).to.be.true;
            });
        });
        it('Should allow a signup', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.registerUser(servers[0].url, 'john', 'password');
            });
        });
        it('Should not allow a signup', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.registerUser(servers[0].url, 'jma', 'password', 403);
                expect(res.body.error).to.equal('No jma');
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests(servers);
        });
    });
});
