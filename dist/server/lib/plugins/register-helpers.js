"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterHelpers = void 0;
const express = require("express");
const logger_1 = require("@server/helpers/logger");
const constants_1 = require("@server/initializers/constants");
const auth_1 = require("@server/lib/auth");
const plugin_1 = require("@server/models/server/plugin");
const server_hook_model_1 = require("@shared/models/plugins/server-hook.model");
const video_transcoding_profiles_1 = require("../video-transcoding-profiles");
const plugin_helpers_builder_1 = require("./plugin-helpers-builder");
class RegisterHelpers {
    constructor(npmName, plugin, onHookAdded) {
        this.npmName = npmName;
        this.plugin = plugin;
        this.onHookAdded = onHookAdded;
        this.updatedVideoConstants = {
            playlistPrivacy: { added: [], deleted: [] },
            privacy: { added: [], deleted: [] },
            language: { added: [], deleted: [] },
            licence: { added: [], deleted: [] },
            category: { added: [], deleted: [] }
        };
        this.transcodingProfiles = {};
        this.transcodingEncoders = {};
        this.settings = [];
        this.idAndPassAuths = [];
        this.externalAuths = [];
        this.onSettingsChangeCallbacks = [];
        this.router = express.Router();
    }
    buildRegisterHelpers() {
        const registerHook = this.buildRegisterHook();
        const registerSetting = this.buildRegisterSetting();
        const getRouter = this.buildGetRouter();
        const settingsManager = this.buildSettingsManager();
        const storageManager = this.buildStorageManager();
        const videoLanguageManager = this.buildVideoLanguageManager();
        const videoLicenceManager = this.buildVideoLicenceManager();
        const videoCategoryManager = this.buildVideoCategoryManager();
        const videoPrivacyManager = this.buildVideoPrivacyManager();
        const playlistPrivacyManager = this.buildPlaylistPrivacyManager();
        const transcodingManager = this.buildTranscodingManager();
        const registerIdAndPassAuth = this.buildRegisterIdAndPassAuth();
        const registerExternalAuth = this.buildRegisterExternalAuth();
        const unregisterIdAndPassAuth = this.buildUnregisterIdAndPassAuth();
        const unregisterExternalAuth = this.buildUnregisterExternalAuth();
        const peertubeHelpers = plugin_helpers_builder_1.buildPluginHelpers(this.npmName);
        return {
            registerHook,
            registerSetting,
            getRouter,
            settingsManager,
            storageManager,
            videoLanguageManager,
            videoCategoryManager,
            videoLicenceManager,
            videoPrivacyManager,
            playlistPrivacyManager,
            transcodingManager,
            registerIdAndPassAuth,
            registerExternalAuth,
            unregisterIdAndPassAuth,
            unregisterExternalAuth,
            peertubeHelpers
        };
    }
    reinitVideoConstants(npmName) {
        const hash = {
            language: constants_1.VIDEO_LANGUAGES,
            licence: constants_1.VIDEO_LICENCES,
            category: constants_1.VIDEO_CATEGORIES,
            privacy: constants_1.VIDEO_PRIVACIES,
            playlistPrivacy: constants_1.VIDEO_PLAYLIST_PRIVACIES
        };
        const types = ['language', 'licence', 'category', 'privacy', 'playlistPrivacy'];
        for (const type of types) {
            const updatedConstants = this.updatedVideoConstants[type][npmName];
            if (!updatedConstants)
                continue;
            for (const added of updatedConstants.added) {
                delete hash[type][added.key];
            }
            for (const deleted of updatedConstants.deleted) {
                hash[type][deleted.key] = deleted.label;
            }
            delete this.updatedVideoConstants[type][npmName];
        }
    }
    reinitTranscodingProfilesAndEncoders(npmName) {
        const profiles = this.transcodingProfiles[npmName];
        if (Array.isArray(profiles)) {
            for (const profile of profiles) {
                video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.removeProfile(profile);
            }
        }
        const encoders = this.transcodingEncoders[npmName];
        if (Array.isArray(encoders)) {
            for (const o of encoders) {
                video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.removeEncoderPriority(o.type, o.streamType, o.encoder, o.priority);
            }
        }
    }
    getSettings() {
        return this.settings;
    }
    getRouter() {
        return this.router;
    }
    getIdAndPassAuths() {
        return this.idAndPassAuths;
    }
    getExternalAuths() {
        return this.externalAuths;
    }
    getOnSettingsChangedCallbacks() {
        return this.onSettingsChangeCallbacks;
    }
    buildGetRouter() {
        return () => this.router;
    }
    buildRegisterSetting() {
        return (options) => {
            this.settings.push(options);
        };
    }
    buildRegisterHook() {
        return (options) => {
            if (server_hook_model_1.serverHookObject[options.target] !== true) {
                logger_1.logger.warn('Unknown hook %s of plugin %s. Skipping.', options.target, this.npmName);
                return;
            }
            return this.onHookAdded(options);
        };
    }
    buildRegisterIdAndPassAuth() {
        return (options) => {
            if (!options.authName || typeof options.getWeight !== 'function' || typeof options.login !== 'function') {
                logger_1.logger.error('Cannot register auth plugin %s: authName, getWeight or login are not valid.', this.npmName, { options });
                return;
            }
            this.idAndPassAuths.push(options);
        };
    }
    buildRegisterExternalAuth() {
        const self = this;
        return (options) => {
            if (!options.authName || typeof options.authDisplayName !== 'function' || typeof options.onAuthRequest !== 'function') {
                logger_1.logger.error('Cannot register auth plugin %s: authName, authDisplayName or onAuthRequest are not valid.', this.npmName, { options });
                return;
            }
            this.externalAuths.push(options);
            return {
                userAuthenticated(result) {
                    auth_1.onExternalUserAuthenticated({
                        npmName: self.npmName,
                        authName: options.authName,
                        authResult: result
                    }).catch(err => {
                        logger_1.logger.error('Cannot execute onExternalUserAuthenticated.', { npmName: self.npmName, authName: options.authName, err });
                    });
                }
            };
        };
    }
    buildUnregisterExternalAuth() {
        return (authName) => {
            this.externalAuths = this.externalAuths.filter(a => a.authName !== authName);
        };
    }
    buildUnregisterIdAndPassAuth() {
        return (authName) => {
            this.idAndPassAuths = this.idAndPassAuths.filter(a => a.authName !== authName);
        };
    }
    buildSettingsManager() {
        return {
            getSetting: (name) => plugin_1.PluginModel.getSetting(this.plugin.name, this.plugin.type, name, this.settings),
            getSettings: (names) => plugin_1.PluginModel.getSettings(this.plugin.name, this.plugin.type, names, this.settings),
            setSetting: (name, value) => plugin_1.PluginModel.setSetting(this.plugin.name, this.plugin.type, name, value),
            onSettingsChange: (cb) => this.onSettingsChangeCallbacks.push(cb)
        };
    }
    buildStorageManager() {
        return {
            getData: (key) => plugin_1.PluginModel.getData(this.plugin.name, this.plugin.type, key),
            storeData: (key, data) => plugin_1.PluginModel.storeData(this.plugin.name, this.plugin.type, key, data)
        };
    }
    buildVideoLanguageManager() {
        return {
            addLanguage: (key, label) => {
                return this.addConstant({ npmName: this.npmName, type: 'language', obj: constants_1.VIDEO_LANGUAGES, key, label });
            },
            deleteLanguage: (key) => {
                return this.deleteConstant({ npmName: this.npmName, type: 'language', obj: constants_1.VIDEO_LANGUAGES, key });
            }
        };
    }
    buildVideoCategoryManager() {
        return {
            addCategory: (key, label) => {
                return this.addConstant({ npmName: this.npmName, type: 'category', obj: constants_1.VIDEO_CATEGORIES, key, label });
            },
            deleteCategory: (key) => {
                return this.deleteConstant({ npmName: this.npmName, type: 'category', obj: constants_1.VIDEO_CATEGORIES, key });
            }
        };
    }
    buildVideoPrivacyManager() {
        return {
            deletePrivacy: (key) => {
                return this.deleteConstant({ npmName: this.npmName, type: 'privacy', obj: constants_1.VIDEO_PRIVACIES, key });
            }
        };
    }
    buildPlaylistPrivacyManager() {
        return {
            deletePlaylistPrivacy: (key) => {
                return this.deleteConstant({ npmName: this.npmName, type: 'playlistPrivacy', obj: constants_1.VIDEO_PLAYLIST_PRIVACIES, key });
            }
        };
    }
    buildVideoLicenceManager() {
        return {
            addLicence: (key, label) => {
                return this.addConstant({ npmName: this.npmName, type: 'licence', obj: constants_1.VIDEO_LICENCES, key, label });
            },
            deleteLicence: (key) => {
                return this.deleteConstant({ npmName: this.npmName, type: 'licence', obj: constants_1.VIDEO_LICENCES, key });
            }
        };
    }
    addConstant(parameters) {
        const { npmName, type, obj, key, label } = parameters;
        if (obj[key]) {
            logger_1.logger.warn('Cannot add %s %s by plugin %s: key already exists.', type, npmName, key);
            return false;
        }
        if (!this.updatedVideoConstants[type][npmName]) {
            this.updatedVideoConstants[type][npmName] = {
                added: [],
                deleted: []
            };
        }
        this.updatedVideoConstants[type][npmName].added.push({ key, label });
        obj[key] = label;
        return true;
    }
    deleteConstant(parameters) {
        const { npmName, type, obj, key } = parameters;
        if (!obj[key]) {
            logger_1.logger.warn('Cannot delete %s %s by plugin %s: key does not exist.', type, npmName, key);
            return false;
        }
        if (!this.updatedVideoConstants[type][npmName]) {
            this.updatedVideoConstants[type][npmName] = {
                added: [],
                deleted: []
            };
        }
        this.updatedVideoConstants[type][npmName].deleted.push({ key, label: obj[key] });
        delete obj[key];
        return true;
    }
    buildTranscodingManager() {
        const self = this;
        function addProfile(type, encoder, profile, builder) {
            if (profile === 'default') {
                logger_1.logger.error('A plugin cannot add a default live transcoding profile');
                return false;
            }
            video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.addProfile({
                type,
                encoder,
                profile,
                builder
            });
            if (!self.transcodingProfiles[self.npmName])
                self.transcodingProfiles[self.npmName] = [];
            self.transcodingProfiles[self.npmName].push({ type, encoder, profile });
            return true;
        }
        function addEncoderPriority(type, streamType, encoder, priority) {
            video_transcoding_profiles_1.VideoTranscodingProfilesManager.Instance.addEncoderPriority(type, streamType, encoder, priority);
            if (!self.transcodingEncoders[self.npmName])
                self.transcodingEncoders[self.npmName] = [];
            self.transcodingEncoders[self.npmName].push({ type, streamType, encoder, priority });
        }
        return {
            addLiveProfile(encoder, profile, builder) {
                return addProfile('live', encoder, profile, builder);
            },
            addVODProfile(encoder, profile, builder) {
                return addProfile('vod', encoder, profile, builder);
            },
            addLiveEncoderPriority(streamType, encoder, priority) {
                return addEncoderPriority('live', streamType, encoder, priority);
            },
            addVODEncoderPriority(streamType, encoder, priority) {
                return addEncoderPriority('vod', streamType, encoder, priority);
            },
            removeAllProfilesAndEncoderPriorities() {
                return self.reinitTranscodingProfilesAndEncoders(self.npmName);
            }
        };
    }
}
exports.RegisterHelpers = RegisterHelpers;
