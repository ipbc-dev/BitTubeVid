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
const extra_utils_1 = require("../../../../shared/extra-utils");
const index_1 = require("../../../../shared/extra-utils/index");
const expect = chai.expect;
describe('Test application behind a reverse proxy', function () {
    let server = null;
    let videoId;
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            const config = {
                rates_limit: {
                    api: {
                        max: 50,
                        window: 5000
                    },
                    signup: {
                        max: 3,
                        window: 5000
                    },
                    login: {
                        max: 20
                    }
                },
                signup: {
                    limit: 20
                }
            };
            server = yield index_1.flushAndRunServer(1, config);
            yield index_1.setAccessTokensToServers([server]);
            const { body } = yield extra_utils_1.uploadVideo(server.url, server.accessToken, {});
            videoId = body.video.uuid;
        });
    });
    it('Should view a video only once with the same IP by default', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.viewVideo(server.url, videoId);
            yield extra_utils_1.viewVideo(server.url, videoId);
            yield extra_utils_1.wait(8000);
            const { body } = yield extra_utils_1.getVideo(server.url, videoId);
            expect(body.views).to.equal(1);
        });
    });
    it('Should view a video 2 times with the X-Forwarded-For header set', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.viewVideo(server.url, videoId, 204, '0.0.0.1,127.0.0.1');
            yield extra_utils_1.viewVideo(server.url, videoId, 204, '0.0.0.2,127.0.0.1');
            yield extra_utils_1.wait(8000);
            const { body } = yield extra_utils_1.getVideo(server.url, videoId);
            expect(body.views).to.equal(3);
        });
    });
    it('Should view a video only once with the same client IP in the X-Forwarded-For header', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.viewVideo(server.url, videoId, 204, '0.0.0.4,0.0.0.3,::ffff:127.0.0.1');
            yield extra_utils_1.viewVideo(server.url, videoId, 204, '0.0.0.5,0.0.0.3,127.0.0.1');
            yield extra_utils_1.wait(8000);
            const { body } = yield extra_utils_1.getVideo(server.url, videoId);
            expect(body.views).to.equal(4);
        });
    });
    it('Should view a video two times with a different client IP in the X-Forwarded-For header', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(20000);
            yield extra_utils_1.viewVideo(server.url, videoId, 204, '0.0.0.8,0.0.0.6,127.0.0.1');
            yield extra_utils_1.viewVideo(server.url, videoId, 204, '0.0.0.8,0.0.0.7,127.0.0.1');
            yield extra_utils_1.wait(8000);
            const { body } = yield extra_utils_1.getVideo(server.url, videoId);
            expect(body.views).to.equal(6);
        });
    });
    it('Should rate limit logins', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const user = { username: 'root', password: 'fail' };
            for (let i = 0; i < 19; i++) {
                yield extra_utils_1.userLogin(server, user, 400);
            }
            yield extra_utils_1.userLogin(server, user, 429);
        });
    });
    it('Should rate limit signup', function () {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 10; i++) {
                try {
                    yield extra_utils_1.registerUser(server.url, 'test' + i, 'password');
                }
                catch (_a) {
                }
            }
            yield extra_utils_1.registerUser(server.url, 'test42', 'password', 429);
        });
    });
    it('Should not rate limit failed signup', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.wait(7000);
            for (let i = 0; i < 3; i++) {
                yield extra_utils_1.registerUser(server.url, 'test' + i, 'password', 409);
            }
            yield extra_utils_1.registerUser(server.url, 'test43', 'password', 204);
        });
    });
    it('Should rate limit API calls', function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            yield extra_utils_1.wait(7000);
            for (let i = 0; i < 100; i++) {
                try {
                    yield extra_utils_1.getVideo(server.url, videoId);
                }
                catch (_a) {
                }
            }
            yield extra_utils_1.getVideo(server.url, videoId, 429);
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
