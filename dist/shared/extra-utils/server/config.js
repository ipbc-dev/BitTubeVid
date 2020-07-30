"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomSubConfig = exports.deleteCustomConfig = exports.getAbout = exports.updateCustomConfig = exports.getCustomConfig = exports.getConfig = void 0;
const requests_1 = require("../requests/requests");
const lodash_1 = require("lodash");
function getConfig(url) {
    const path = '/api/v1/config';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: 200
    });
}
exports.getConfig = getConfig;
function getAbout(url) {
    const path = '/api/v1/config/about';
    return requests_1.makeGetRequest({
        url,
        path,
        statusCodeExpected: 200
    });
}
exports.getAbout = getAbout;
function getCustomConfig(url, token, statusCodeExpected = 200) {
    const path = '/api/v1/config/custom';
    return requests_1.makeGetRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.getCustomConfig = getCustomConfig;
function updateCustomConfig(url, token, newCustomConfig, statusCodeExpected = 200) {
    const path = '/api/v1/config/custom';
    return requests_1.makePutBodyRequest({
        url,
        token,
        path,
        fields: newCustomConfig,
        statusCodeExpected
    });
}
exports.updateCustomConfig = updateCustomConfig;
function updateCustomSubConfig(url, token, newConfig) {
    const updateParams = {
        instance: {
            name: 'PeerTube updated',
            shortDescription: 'my short description',
            description: 'my super description',
            terms: 'my super terms',
            codeOfConduct: 'my super coc',
            creationReason: 'my super creation reason',
            moderationInformation: 'my super moderation information',
            administrator: 'Kuja',
            maintenanceLifetime: 'forever',
            businessModel: 'my super business model',
            hardwareInformation: '2vCore 3GB RAM',
            languages: ['en', 'es'],
            categories: [1, 2],
            defaultClientRoute: '/videos/recently-added',
            isNSFW: true,
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
            enabled: true
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
                enabled: true,
                manualApproval: false
            }
        },
        followings: {
            instance: {
                autoFollowBack: {
                    enabled: false
                },
                autoFollowIndex: {
                    indexUrl: 'https://instances.joinpeertube.org/api/v1/instances/hosts',
                    enabled: false
                }
            }
        },
        premium_storage: {
            enabled: false
        },
        broadcastMessage: {
            enabled: true,
            level: 'warning',
            message: 'hello',
            dismissable: true
        },
        search: {
            remoteUri: {
                users: true,
                anonymous: true
            },
            searchIndex: {
                enabled: true,
                url: 'https://search.joinpeertube.org',
                disableLocalSearch: true,
                isDefaultSearch: true
            }
        }
    };
    lodash_1.merge(updateParams, newConfig);
    return updateCustomConfig(url, token, updateParams);
}
exports.updateCustomSubConfig = updateCustomSubConfig;
function deleteCustomConfig(url, token, statusCodeExpected = 200) {
    const path = '/api/v1/config/custom';
    return requests_1.makeDeleteRequest({
        url,
        token,
        path,
        statusCodeExpected
    });
}
exports.deleteCustomConfig = deleteCustomConfig;
