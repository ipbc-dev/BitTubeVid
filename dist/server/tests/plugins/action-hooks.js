"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("mocha");
const extra_utils_1 = require("../../../shared/extra-utils");
const servers_1 = require("../../../shared/extra-utils/server/servers");
describe('Test plugin action hooks', function () {
    let servers;
    let videoUUID;
    let threadId;
    function checkHook(hook) {
        return servers_1.waitUntilLog(servers[0], 'Run hook ' + hook);
    }
    before(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield servers_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.setDefaultVideoChannel(servers);
            yield extra_utils_1.installPlugin({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                path: extra_utils_1.getPluginTestPath()
            });
            servers_1.killallServers([servers[0]]);
            yield servers_1.reRunServer(servers[0], {
                live: {
                    enabled: true
                }
            });
        });
    });
    describe('Application hooks', function () {
        it('Should run action:application.listening', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield checkHook('action:application.listening');
            });
        });
    });
    describe('Videos hooks', function () {
        it('Should run action:api.video.uploaded', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video' });
                videoUUID = res.body.video.uuid;
                yield checkHook('action:api.video.uploaded');
            });
        });
        it('Should run action:api.video.updated', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, videoUUID, { name: 'video updated' });
                yield checkHook('action:api.video.updated');
            });
        });
        it('Should run action:api.video.viewed', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.viewVideo(servers[0].url, videoUUID);
                yield checkHook('action:api.video.viewed');
            });
        });
    });
    describe('Live hooks', function () {
        it('Should run action:api.live-video.created', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const attributes = {
                    name: 'live',
                    privacy: 1,
                    channelId: servers[0].videoChannel.id
                };
                yield extra_utils_1.createLive(servers[0].url, servers[0].accessToken, attributes);
                yield checkHook('action:api.live-video.created');
            });
        });
    });
    describe('Comments hooks', function () {
        it('Should run action:api.video-thread.created', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, 'thread');
                threadId = res.body.comment.id;
                yield checkHook('action:api.video-thread.created');
            });
        });
        it('Should run action:api.video-comment-reply.created', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID, threadId, 'reply');
                yield checkHook('action:api.video-comment-reply.created');
            });
        });
        it('Should run action:api.video-comment.deleted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoComment(servers[0].url, servers[0].accessToken, videoUUID, threadId);
                yield checkHook('action:api.video-comment.deleted');
            });
        });
    });
    describe('Users hooks', function () {
        let userId;
        it('Should run action:api.user.registered', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.registerUser(servers[0].url, 'registered_user', 'super_password');
                yield checkHook('action:api.user.registered');
            });
        });
        it('Should run action:api.user.created', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.createUser({
                    url: servers[0].url,
                    accessToken: servers[0].accessToken,
                    username: 'created_user',
                    password: 'super_password'
                });
                userId = res.body.user.id;
                yield checkHook('action:api.user.created');
            });
        });
        it('Should run action:api.user.oauth2-got-token', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.userLogin(servers[0], { username: 'created_user', password: 'super_password' });
                yield checkHook('action:api.user.oauth2-got-token');
            });
        });
        it('Should run action:api.user.blocked', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.blockUser(servers[0].url, userId, servers[0].accessToken);
                yield checkHook('action:api.user.blocked');
            });
        });
        it('Should run action:api.user.unblocked', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.unblockUser(servers[0].url, userId, servers[0].accessToken);
                yield checkHook('action:api.user.unblocked');
            });
        });
        it('Should run action:api.user.updated', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateUser({ url: servers[0].url, accessToken: servers[0].accessToken, userId, videoQuota: 50 });
                yield checkHook('action:api.user.updated');
            });
        });
        it('Should run action:api.user.deleted', function () {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeUser(servers[0].url, userId, servers[0].accessToken);
                yield checkHook('action:api.user.deleted');
            });
        });
    });
    after(function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests(servers);
        });
    });
});
