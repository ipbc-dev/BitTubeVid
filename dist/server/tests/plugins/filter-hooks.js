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
const servers_1 = require("../../../shared/extra-utils/server/servers");
const extra_utils_1 = require("../../../shared/extra-utils");
const video_imports_1 = require("../../../shared/extra-utils/videos/video-imports");
const expect = chai.expect;
describe('Test plugin filter hooks', function () {
    let servers;
    let videoUUID;
    let threadId;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosListPagination(servers[0].url, 0, 2);
            expect(res.body.data).to.have.lengthOf(4);
        });
    });
    it('Should run filter:api.videos.list.result', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideosListPagination(servers[0].url, 0, 0);
            expect(res.body.total).to.equal(11);
        });
    });
    it('Should run filter:api.video.get.result', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideo(servers[0].url, videoUUID);
            expect(res.body.name).to.contain('<3');
        });
    });
    it('Should run filter:api.video.upload.accept.result', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video with bad word' }, 403);
        });
    });
    it('Should run filter:api.video-thread.create.accept.result', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, 'comment with bad word', 403);
        });
    });
    it('Should run filter:api.video-comment-reply.create.accept.result', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, 'thread');
            threadId = res.body.comment.id;
            yield extra_utils_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID, threadId, 'comment with bad word', 403);
            yield extra_utils_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID, threadId, 'comment with good word', 200);
        });
    });
    it('Should run filter:api.video-threads.list.params', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoCommentThreads(servers[0].url, videoUUID, 0, 0);
            expect(res.body.data).to.have.lengthOf(1);
        });
    });
    it('Should run filter:api.video-threads.list.result', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoCommentThreads(servers[0].url, videoUUID, 0, 0);
            expect(res.body.total).to.equal(2);
        });
    });
    it('Should run filter:api.video-thread-comments.list.params');
    it('Should run filter:api.video-thread-comments.list.result', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield extra_utils_1.getVideoThreadComments(servers[0].url, videoUUID, threadId);
            const thread = res.body;
            expect(thread.comment.text.endsWith(' <3')).to.be.true;
        });
    });
    describe('Should run filter:video.auto-blacklist.result', function () {
        function checkIsBlacklisted(oldRes, value) {
            return __awaiter(this, void 0, void 0, function* () {
                const videoId = oldRes.body.video.uuid;
                const res = yield extra_utils_1.getVideoWithToken(servers[0].url, servers[0].accessToken, videoId);
                const video = res.body;
                expect(video.blacklisted).to.equal(value);
            });
        }
        it('Should blacklist on upload', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video please blacklist me' });
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on import', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(15000);
                const attributes = {
                    name: 'video please blacklist me',
                    targetUrl: video_imports_1.getYoutubeVideoUrl(),
                    channelId: servers[0].videoChannel.id
                };
                const res = yield video_imports_1.importVideo(servers[0].url, servers[0].accessToken, attributes);
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on update', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video' });
                const videoId = res.body.video.uuid;
                yield checkIsBlacklisted(res, false);
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, videoId, { name: 'please blacklist me' });
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on remote upload', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(45000);
                const res = yield extra_utils_1.uploadVideo(servers[1].url, servers[1].accessToken, { name: 'remote please blacklist me' });
                yield extra_utils_1.waitJobs(servers);
                yield checkIsBlacklisted(res, true);
            });
        });
        it('Should blacklist on remote update', function () {
            return __awaiter(this, void 0, void 0, function* () {
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
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.getConfig(servers[0].url);
                expect(res.body.signup.allowed).to.be.true;
            });
        });
        it('Should allow a signup', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.registerUser(servers[0].url, 'john', 'password');
            });
        });
        it('Should not allow a signup', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.registerUser(servers[0].url, 'jma', 'password', 403);
                expect(res.body.error).to.equal('No jma');
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests(servers);
        });
    });
});
