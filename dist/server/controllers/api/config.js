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
const hooks_1 = require("@server/lib/plugins/hooks");
const express = require("express");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const validator_1 = require("validator");
const shared_1 = require("../../../shared");
const audit_logger_1 = require("../../helpers/audit-logger");
const core_utils_1 = require("../../helpers/core-utils");
const signup_1 = require("../../helpers/signup");
const utils_1 = require("../../helpers/utils");
const config_1 = require("../../initializers/config");
const constants_1 = require("../../initializers/constants");
const client_html_1 = require("../../lib/client-html");
const plugin_manager_1 = require("../../lib/plugins/plugin-manager");
const theme_utils_1 = require("../../lib/plugins/theme-utils");
const middlewares_1 = require("../../middlewares");
const config_2 = require("../../middlewares/validators/config");
const logger_1 = require("@server/helpers/logger");
const configRouter = express.Router();
exports.configRouter = configRouter;
const auditLogger = audit_logger_1.auditLoggerFactory('config');
configRouter.get('/about', getAbout);
configRouter.get('/', middlewares_1.asyncMiddleware(getConfig));
configRouter.get('/custom', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_CONFIGURATION), getCustomConfig);
configRouter.put('/custom', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_CONFIGURATION), config_2.customConfigUpdateValidator, middlewares_1.asyncMiddleware(updateCustomConfig));
configRouter.delete('/custom', middlewares_1.authenticate, middlewares_1.ensureUserHasRight(shared_1.UserRight.MANAGE_CONFIGURATION), middlewares_1.asyncMiddleware(deleteCustomConfig));
let serverCommit;
function getConfig(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { allowed } = yield hooks_1.Hooks.wrapPromiseFun(signup_1.isSignupAllowed, {
            ip: req.ip
        }, 'filter:api.user.signup.allowed.result');
        const allowedForCurrentIP = signup_1.isSignupAllowedForCurrentIP(req.ip);
        const defaultTheme = theme_utils_1.getThemeOrDefault(config_1.CONFIG.THEME.DEFAULT, constants_1.DEFAULT_THEME_NAME);
        if (serverCommit === undefined)
            serverCommit = yield utils_1.getServerCommit();
        const json = {
            instance: {
                name: config_1.CONFIG.INSTANCE.NAME,
                shortDescription: config_1.CONFIG.INSTANCE.SHORT_DESCRIPTION,
                defaultClientRoute: config_1.CONFIG.INSTANCE.DEFAULT_CLIENT_ROUTE,
                isNSFW: config_1.CONFIG.INSTANCE.IS_NSFW,
                defaultNSFWPolicy: config_1.CONFIG.INSTANCE.DEFAULT_NSFW_POLICY,
                customizations: {
                    javascript: config_1.CONFIG.INSTANCE.CUSTOMIZATIONS.JAVASCRIPT,
                    css: config_1.CONFIG.INSTANCE.CUSTOMIZATIONS.CSS
                }
            },
            search: {
                remoteUri: {
                    users: config_1.CONFIG.SEARCH.REMOTE_URI.USERS,
                    anonymous: config_1.CONFIG.SEARCH.REMOTE_URI.ANONYMOUS
                }
            },
            plugin: {
                registered: getRegisteredPlugins(),
                registeredExternalAuths: getExternalAuthsPlugins(),
                registeredIdAndPassAuths: getIdAndPassAuthPlugins()
            },
            theme: {
                registered: getRegisteredThemes(),
                default: defaultTheme
            },
            email: {
                enabled: config_1.isEmailEnabled()
            },
            contactForm: {
                enabled: config_1.CONFIG.CONTACT_FORM.ENABLED
            },
            serverVersion: constants_1.PEERTUBE_VERSION,
            serverCommit,
            signup: {
                allowed,
                allowedForCurrentIP,
                requiresEmailVerification: config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION
            },
            transcoding: {
                hls: {
                    enabled: config_1.CONFIG.TRANSCODING.HLS.ENABLED
                },
                webtorrent: {
                    enabled: config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED
                },
                enabledResolutions: getEnabledResolutions()
            },
            import: {
                videos: {
                    http: {
                        enabled: config_1.CONFIG.IMPORT.VIDEOS.HTTP.ENABLED
                    },
                    torrent: {
                        enabled: config_1.CONFIG.IMPORT.VIDEOS.TORRENT.ENABLED
                    }
                }
            },
            autoBlacklist: {
                videos: {
                    ofUsers: {
                        enabled: config_1.CONFIG.AUTO_BLACKLIST.VIDEOS.OF_USERS.ENABLED
                    }
                }
            },
            avatar: {
                file: {
                    size: {
                        max: constants_1.CONSTRAINTS_FIELDS.ACTORS.AVATAR.FILE_SIZE.max
                    },
                    extensions: constants_1.CONSTRAINTS_FIELDS.ACTORS.AVATAR.EXTNAME
                }
            },
            video: {
                image: {
                    extensions: constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.EXTNAME,
                    size: {
                        max: constants_1.CONSTRAINTS_FIELDS.VIDEOS.IMAGE.FILE_SIZE.max
                    }
                },
                file: {
                    extensions: constants_1.CONSTRAINTS_FIELDS.VIDEOS.EXTNAME
                }
            },
            videoCaption: {
                file: {
                    size: {
                        max: constants_1.CONSTRAINTS_FIELDS.VIDEO_CAPTIONS.CAPTION_FILE.FILE_SIZE.max
                    },
                    extensions: constants_1.CONSTRAINTS_FIELDS.VIDEO_CAPTIONS.CAPTION_FILE.EXTNAME
                }
            },
            user: {
                videoQuota: config_1.CONFIG.USER.VIDEO_QUOTA,
                videoQuotaDaily: config_1.CONFIG.USER.VIDEO_QUOTA_DAILY
            },
            trending: {
                videos: {
                    intervalDays: config_1.CONFIG.TRENDING.VIDEOS.INTERVAL_DAYS
                }
            },
            tracker: {
                enabled: config_1.CONFIG.TRACKER.ENABLED
            },
            followings: {
                instance: {
                    autoFollowIndex: {
                        indexUrl: config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_INDEX.INDEX_URL
                    }
                }
            },
            premium_storage: {
                enabled: config_1.CONFIG.PREMIUM_STORAGE.ENABLED
            }
        };
        return res.json(json);
    });
}
function getAbout(req, res) {
    const about = {
        instance: {
            name: config_1.CONFIG.INSTANCE.NAME,
            shortDescription: config_1.CONFIG.INSTANCE.SHORT_DESCRIPTION,
            description: config_1.CONFIG.INSTANCE.DESCRIPTION,
            terms: config_1.CONFIG.INSTANCE.TERMS,
            codeOfConduct: config_1.CONFIG.INSTANCE.CODE_OF_CONDUCT,
            hardwareInformation: config_1.CONFIG.INSTANCE.HARDWARE_INFORMATION,
            creationReason: config_1.CONFIG.INSTANCE.CREATION_REASON,
            moderationInformation: config_1.CONFIG.INSTANCE.MODERATION_INFORMATION,
            administrator: config_1.CONFIG.INSTANCE.ADMINISTRATOR,
            maintenanceLifetime: config_1.CONFIG.INSTANCE.MAINTENANCE_LIFETIME,
            businessModel: config_1.CONFIG.INSTANCE.BUSINESS_MODEL,
            languages: config_1.CONFIG.INSTANCE.LANGUAGES,
            categories: config_1.CONFIG.INSTANCE.CATEGORIES
        }
    };
    return res.json(about).end();
}
function getCustomConfig(req, res) {
    const data = customConfig();
    return res.json(data).end();
}
function deleteCustomConfig(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs_extra_1.remove(config_1.CONFIG.CUSTOM_FILE);
        auditLogger.delete(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.CustomConfigAuditView(customConfig()));
        config_1.reloadConfig();
        client_html_1.ClientHtml.invalidCache();
        const data = customConfig();
        return res.json(data).end();
    });
}
function updateCustomConfig(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const oldCustomConfigAuditKeys = new audit_logger_1.CustomConfigAuditView(customConfig());
        const toUpdateJSON = convertCustomConfigBody(req.body);
        logger_1.logger.debug('ICEICE CONFIG.CUSTOM_FILE is: ', config_1.CONFIG.CUSTOM_FILE);
        logger_1.logger.debug('ICEICE toUpdateJSON is: ', toUpdateJSON);
        yield fs_extra_1.writeJSON(config_1.CONFIG.CUSTOM_FILE, toUpdateJSON, { spaces: 2 });
        config_1.reloadConfig();
        client_html_1.ClientHtml.invalidCache();
        const data = customConfig();
        auditLogger.update(audit_logger_1.getAuditIdFromRes(res), new audit_logger_1.CustomConfigAuditView(data), oldCustomConfigAuditKeys);
        return res.json(data).end();
    });
}
function getRegisteredThemes() {
    return plugin_manager_1.PluginManager.Instance.getRegisteredThemes()
        .map(t => ({
        name: t.name,
        version: t.version,
        description: t.description,
        css: t.css,
        clientScripts: t.clientScripts
    }));
}
exports.getRegisteredThemes = getRegisteredThemes;
function getEnabledResolutions() {
    return Object.keys(config_1.CONFIG.TRANSCODING.RESOLUTIONS)
        .filter(key => config_1.CONFIG.TRANSCODING.ENABLED && config_1.CONFIG.TRANSCODING.RESOLUTIONS[key] === true)
        .map(r => parseInt(r, 10));
}
exports.getEnabledResolutions = getEnabledResolutions;
function getRegisteredPlugins() {
    return plugin_manager_1.PluginManager.Instance.getRegisteredPlugins()
        .map(p => ({
        name: p.name,
        version: p.version,
        description: p.description,
        clientScripts: p.clientScripts
    }));
}
exports.getRegisteredPlugins = getRegisteredPlugins;
function getIdAndPassAuthPlugins() {
    const result = [];
    for (const p of plugin_manager_1.PluginManager.Instance.getIdAndPassAuths()) {
        for (const auth of p.idAndPassAuths) {
            result.push({
                npmName: p.npmName,
                name: p.name,
                version: p.version,
                authName: auth.authName,
                weight: auth.getWeight()
            });
        }
    }
    return result;
}
function getExternalAuthsPlugins() {
    const result = [];
    for (const p of plugin_manager_1.PluginManager.Instance.getExternalAuths()) {
        for (const auth of p.externalAuths) {
            result.push({
                npmName: p.npmName,
                name: p.name,
                version: p.version,
                authName: auth.authName,
                authDisplayName: auth.authDisplayName()
            });
        }
    }
    return result;
}
function customConfig() {
    return {
        instance: {
            name: config_1.CONFIG.INSTANCE.NAME,
            shortDescription: config_1.CONFIG.INSTANCE.SHORT_DESCRIPTION,
            description: config_1.CONFIG.INSTANCE.DESCRIPTION,
            terms: config_1.CONFIG.INSTANCE.TERMS,
            codeOfConduct: config_1.CONFIG.INSTANCE.CODE_OF_CONDUCT,
            creationReason: config_1.CONFIG.INSTANCE.CREATION_REASON,
            moderationInformation: config_1.CONFIG.INSTANCE.MODERATION_INFORMATION,
            administrator: config_1.CONFIG.INSTANCE.ADMINISTRATOR,
            maintenanceLifetime: config_1.CONFIG.INSTANCE.MAINTENANCE_LIFETIME,
            businessModel: config_1.CONFIG.INSTANCE.BUSINESS_MODEL,
            hardwareInformation: config_1.CONFIG.INSTANCE.HARDWARE_INFORMATION,
            languages: config_1.CONFIG.INSTANCE.LANGUAGES,
            categories: config_1.CONFIG.INSTANCE.CATEGORIES,
            isNSFW: config_1.CONFIG.INSTANCE.IS_NSFW,
            defaultClientRoute: config_1.CONFIG.INSTANCE.DEFAULT_CLIENT_ROUTE,
            defaultNSFWPolicy: config_1.CONFIG.INSTANCE.DEFAULT_NSFW_POLICY,
            customizations: {
                css: config_1.CONFIG.INSTANCE.CUSTOMIZATIONS.CSS,
                javascript: config_1.CONFIG.INSTANCE.CUSTOMIZATIONS.JAVASCRIPT
            }
        },
        theme: {
            default: config_1.CONFIG.THEME.DEFAULT
        },
        services: {
            twitter: {
                username: config_1.CONFIG.SERVICES.TWITTER.USERNAME,
                whitelisted: config_1.CONFIG.SERVICES.TWITTER.WHITELISTED
            }
        },
        cache: {
            previews: {
                size: config_1.CONFIG.CACHE.PREVIEWS.SIZE
            },
            captions: {
                size: config_1.CONFIG.CACHE.VIDEO_CAPTIONS.SIZE
            }
        },
        signup: {
            enabled: config_1.CONFIG.SIGNUP.ENABLED,
            limit: config_1.CONFIG.SIGNUP.LIMIT,
            requiresEmailVerification: config_1.CONFIG.SIGNUP.REQUIRES_EMAIL_VERIFICATION
        },
        admin: {
            email: config_1.CONFIG.ADMIN.EMAIL
        },
        contactForm: {
            enabled: config_1.CONFIG.CONTACT_FORM.ENABLED
        },
        user: {
            videoQuota: config_1.CONFIG.USER.VIDEO_QUOTA,
            videoQuotaDaily: config_1.CONFIG.USER.VIDEO_QUOTA_DAILY
        },
        transcoding: {
            enabled: config_1.CONFIG.TRANSCODING.ENABLED,
            allowAdditionalExtensions: config_1.CONFIG.TRANSCODING.ALLOW_ADDITIONAL_EXTENSIONS,
            allowAudioFiles: config_1.CONFIG.TRANSCODING.ALLOW_AUDIO_FILES,
            threads: config_1.CONFIG.TRANSCODING.THREADS,
            resolutions: {
                '0p': config_1.CONFIG.TRANSCODING.RESOLUTIONS['0p'],
                '240p': config_1.CONFIG.TRANSCODING.RESOLUTIONS['240p'],
                '360p': config_1.CONFIG.TRANSCODING.RESOLUTIONS['360p'],
                '480p': config_1.CONFIG.TRANSCODING.RESOLUTIONS['480p'],
                '720p': config_1.CONFIG.TRANSCODING.RESOLUTIONS['720p'],
                '1080p': config_1.CONFIG.TRANSCODING.RESOLUTIONS['1080p'],
                '2160p': config_1.CONFIG.TRANSCODING.RESOLUTIONS['2160p']
            },
            webtorrent: {
                enabled: config_1.CONFIG.TRANSCODING.WEBTORRENT.ENABLED
            },
            hls: {
                enabled: config_1.CONFIG.TRANSCODING.HLS.ENABLED
            }
        },
        import: {
            videos: {
                http: {
                    enabled: config_1.CONFIG.IMPORT.VIDEOS.HTTP.ENABLED
                },
                torrent: {
                    enabled: config_1.CONFIG.IMPORT.VIDEOS.TORRENT.ENABLED
                }
            }
        },
        autoBlacklist: {
            videos: {
                ofUsers: {
                    enabled: config_1.CONFIG.AUTO_BLACKLIST.VIDEOS.OF_USERS.ENABLED
                }
            }
        },
        followers: {
            instance: {
                enabled: config_1.CONFIG.FOLLOWERS.INSTANCE.ENABLED,
                manualApproval: config_1.CONFIG.FOLLOWERS.INSTANCE.MANUAL_APPROVAL
            }
        },
        followings: {
            instance: {
                autoFollowBack: {
                    enabled: config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_BACK.ENABLED
                },
                autoFollowIndex: {
                    enabled: config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_INDEX.ENABLED,
                    indexUrl: config_1.CONFIG.FOLLOWINGS.INSTANCE.AUTO_FOLLOW_INDEX.INDEX_URL
                }
            }
        },
        premium_storage: {
            enabled: config_1.CONFIG.PREMIUM_STORAGE.ENABLED
        }
    };
}
function convertCustomConfigBody(body) {
    function keyConverter(k) {
        if (/^\d{3,4}p$/.exec(k))
            return k;
        if (k === '0p')
            return k;
        return lodash_1.snakeCase(k);
    }
    function valueConverter(v) {
        if (validator_1.default.isNumeric(v + ''))
            return parseInt('' + v, 10);
        return v;
    }
    return core_utils_1.objectConverter(body, keyConverter, valueConverter);
}
