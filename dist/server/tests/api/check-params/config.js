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
const lodash_1 = require("lodash");
require("mocha");
const extra_utils_1 = require("../../../../shared/extra-utils");
describe('Test config API validators', function () {
    const path = '/api/v1/config/custom';
    let server;
    let userAccessToken;
    const updateParams = {
        instance: {
            name: 'PeerTube updated',
            shortDescription: 'my short description',
            description: 'my super description',
            terms: 'my super terms',
            codeOfConduct: 'my super coc',
            creationReason: 'my super reason',
            moderationInformation: 'my super moderation information',
            administrator: 'Kuja',
            maintenanceLifetime: 'forever',
            businessModel: 'my super business model',
            hardwareInformation: '2vCore 3GB RAM',
            languages: ['en', 'es'],
            categories: [1, 2],
            isNSFW: true,
            defaultClientRoute: '/videos/recently-added',
            defaultNSFWPolicy: 'blur',
            customizations: {
                javascript: 'alert("coucou")',
                css: 'body { background-color: red; }'
            }
        },
        theme: {
            default: 'default'
        },
        services: {
            twitter: {
                username: '@MySuperUsername',
                whitelisted: true
            }
        },
        cache: {
            previews: {
                size: 2
            },
            captions: {
                size: 3
            }
        },
        signup: {
            enabled: false,
            limit: 5,
            requiresEmailVerification: false
        },
        admin: {
            email: 'superadmin1@example.com'
        },
        contactForm: {
            enabled: false
        },
        user: {
            videoQuota: 5242881,
            videoQuotaDaily: 318742
        },
        transcoding: {
            enabled: true,
            allowAdditionalExtensions: true,
            allowAudioFiles: true,
            threads: 1,
            resolutions: {
                '0p': false,
                '240p': false,
                '360p': true,
                '480p': true,
                '720p': false,
                '1080p': false,
                '2160p': false
            },
            webtorrent: {
                enabled: true
            },
            hls: {
                enabled: false
            }
        },
        import: {
            videos: {
                http: {
                    enabled: false
                },
                torrent: {
                    enabled: false
                }
            }
        },
        autoBlacklist: {
            videos: {
                ofUsers: {
                    enabled: false
                }
            }
        },
        followers: {
            instance: {
                enabled: false,
                manualApproval: true
            }
        },
        followings: {
            instance: {
                autoFollowBack: {
                    enabled: true
                },
                autoFollowIndex: {
                    enabled: true,
                    indexUrl: 'https://index.example.com'
                }
            }
        },
        premium_storage: {
            enabled: false
        }
    };
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(30000);
            server = yield extra_utils_1.flushAndRunServer(1);
            yield extra_utils_1.setAccessTokensToServers([server]);
            const user = {
                username: 'user1',
                password: 'password'
            };
            yield extra_utils_1.createUser({ url: server.url, accessToken: server.accessToken, username: user.username, password: user.password });
            userAccessToken = yield extra_utils_1.userLogin(server, user);
        });
    });
    describe('When getting the configuration', function () {
        it('Should fail without token', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeGetRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    statusCodeExpected: 403
                });
            });
        });
    });
    describe('When updating the configuration', function () {
        it('Should fail without token', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: updateParams,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: updateParams,
                    token: userAccessToken,
                    statusCodeExpected: 403
                });
            });
        });
        it('Should fail if it misses a key', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const newUpdateParams = lodash_1.omit(updateParams, 'admin.email');
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: newUpdateParams,
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with a bad default NSFW policy', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const newUpdateParams = extra_utils_1.immutableAssign(updateParams, {
                    instance: {
                        defaultNSFWPolicy: 'hello'
                    }
                });
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: newUpdateParams,
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail if email disabled and signup requires email verification', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const newUpdateParams = extra_utils_1.immutableAssign(updateParams, {
                    signup: {
                        enabled: true,
                        limit: 5,
                        requiresEmailVerification: true
                    }
                });
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: newUpdateParams,
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should fail with a disabled webtorrent & hls transcoding', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const newUpdateParams = extra_utils_1.immutableAssign(updateParams, {
                    transcoding: {
                        hls: {
                            enabled: false
                        },
                        webtorrent: {
                            enabled: false
                        }
                    }
                });
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: newUpdateParams,
                    token: server.accessToken,
                    statusCodeExpected: 400
                });
            });
        });
        it('Should success with the correct parameters', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makePutBodyRequest({
                    url: server.url,
                    path,
                    fields: updateParams,
                    token: server.accessToken,
                    statusCodeExpected: 200
                });
            });
        });
    });
    describe('When deleting the configuration', function () {
        it('Should fail without token', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path,
                    statusCodeExpected: 401
                });
            });
        });
        it('Should fail if the user is not an administrator', function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield extra_utils_1.makeDeleteRequest({
                    url: server.url,
                    path,
                    token: userAccessToken,
                    statusCodeExpected: 403
                });
            });
        });
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield extra_utils_1.cleanupTests([server]);
        });
    });
});
