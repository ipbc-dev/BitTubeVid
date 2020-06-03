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
const servers_1 = require("../../../shared/extra-utils/server/servers");
const extra_utils_1 = require("../../../shared/extra-utils");
describe('Test plugin action hooks', function () {
    let servers;
    let videoUUID;
    let threadId;
    function checkHook(hook) {
        return servers_1.waitUntilLog(servers[0], 'Run hook ' + hook);
    }
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            servers = yield servers_1.flushAndRunMultipleServers(2);
            yield extra_utils_1.setAccessTokensToServers(servers);
            yield extra_utils_1.installPlugin({
                url: servers[0].url,
                accessToken: servers[0].accessToken,
                path: extra_utils_1.getPluginTestPath()
            });
            servers_1.killallServers([servers[0]]);
            yield servers_1.reRunServer(servers[0]);
        });
    });
    describe('Application hooks', function () {
        it('Should run action:application.listening', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield checkHook('action:application.listening');
            });
        });
    });
    describe('Videos hooks', function () {
        it('Should run action:api.video.uploaded', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.uploadVideo(servers[0].url, servers[0].accessToken, { name: 'video' });
                videoUUID = res.body.video.uuid;
                yield checkHook('action:api.video.uploaded');
            });
        });
        it('Should run action:api.video.updated', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateVideo(servers[0].url, servers[0].accessToken, videoUUID, { name: 'video updated' });
                yield checkHook('action:api.video.updated');
            });
        });
        it('Should run action:api.video.viewed', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.viewVideo(servers[0].url, videoUUID);
                yield checkHook('action:api.video.viewed');
            });
        });
    });
    describe('Comments hooks', function () {
        it('Should run action:api.video-thread.created', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield extra_utils_1.addVideoCommentThread(servers[0].url, servers[0].accessToken, videoUUID, 'thread');
                threadId = res.body.comment.id;
                yield checkHook('action:api.video-thread.created');
            });
        });
        it('Should run action:api.video-comment-reply.created', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.addVideoCommentReply(servers[0].url, servers[0].accessToken, videoUUID, threadId, 'reply');
                yield checkHook('action:api.video-comment-reply.created');
            });
        });
        it('Should run action:api.video-comment.deleted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.deleteVideoComment(servers[0].url, servers[0].accessToken, videoUUID, threadId);
                yield checkHook('action:api.video-comment.deleted');
            });
        });
    });
    describe('Users hooks', function () {
        let userId;
        it('Should run action:api.user.registered', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.registerUser(servers[0].url, 'registered_user', 'super_password');
                yield checkHook('action:api.user.registered');
            });
        });
        it('Should run action:api.user.created', function () {
            return __awaiter(this, void 0, void 0, function* () {
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
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.userLogin(servers[0], { username: 'created_user', password: 'super_password' });
                yield checkHook('action:api.user.oauth2-got-token');
            });
        });
        it('Should run action:api.user.blocked', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.blockUser(servers[0].url, userId, servers[0].accessToken);
                yield checkHook('action:api.user.blocked');
            });
        });
        it('Should run action:api.user.unblocked', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.unblockUser(servers[0].url, userId, servers[0].accessToken);
                yield checkHook('action:api.user.unblocked');
            });
        });
        it('Should run action:api.user.updated', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.updateUser({ url: servers[0].url, accessToken: servers[0].accessToken, userId, videoQuota: 50 });
                yield checkHook('action:api.user.updated');
            });
        });
        it('Should run action:api.user.deleted', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.removeUser(servers[0].url, userId, servers[0].accessToken);
                yield checkHook('action:api.user.deleted');
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield servers_1.cleanupTests(servers);
        });
    });
});
