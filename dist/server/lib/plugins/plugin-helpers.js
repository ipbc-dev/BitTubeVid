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
const database_1 = require("@server/initializers/database");
const logger_1 = require("@server/helpers/logger");
const video_1 = require("@server/models/video/video");
const constants_1 = require("@server/initializers/constants");
const server_1 = require("@server/models/server/server");
const application_1 = require("@server/models/application/application");
const blocklist_1 = require("../blocklist");
const server_blocklist_1 = require("@server/models/server/server-blocklist");
const account_1 = require("@server/models/account/account");
const video_blacklist_1 = require("../video-blacklist");
const video_blacklist_2 = require("@server/models/video/video-blacklist");
const account_blocklist_1 = require("@server/models/account/account-blocklist");
function buildPluginHelpers(npmName) {
    const logger = buildPluginLogger(npmName);
    const database = buildDatabaseHelpers();
    const videos = buildVideosHelpers();
    const config = buildConfigHelpers();
    const server = buildServerHelpers();
    const moderation = buildModerationHelpers();
    return {
        logger,
        database,
        videos,
        config,
        moderation,
        server
    };
}
exports.buildPluginHelpers = buildPluginHelpers;
function buildPluginLogger(npmName) {
    return logger_1.buildLogger(npmName);
}
function buildDatabaseHelpers() {
    return {
        query: database_1.sequelizeTypescript.query.bind(database_1.sequelizeTypescript)
    };
}
function buildServerHelpers() {
    return {
        getServerActor: () => application_1.getServerActor()
    };
}
function buildVideosHelpers() {
    return {
        loadByUrl: (url) => {
            return video_1.VideoModel.loadByUrl(url);
        },
        removeVideo: (id) => {
            return database_1.sequelizeTypescript.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(id, t);
                yield video.destroy({ transaction: t });
            }));
        }
    };
}
function buildModerationHelpers() {
    return {
        blockServer: (options) => __awaiter(this, void 0, void 0, function* () {
            const serverToBlock = yield server_1.ServerModel.loadOrCreateByHost(options.hostToBlock);
            yield blocklist_1.addServerInBlocklist(options.byAccountId, serverToBlock.id);
        }),
        unblockServer: (options) => __awaiter(this, void 0, void 0, function* () {
            const serverBlock = yield server_blocklist_1.ServerBlocklistModel.loadByAccountAndHost(options.byAccountId, options.hostToUnblock);
            if (!serverBlock)
                return;
            yield blocklist_1.removeServerFromBlocklist(serverBlock);
        }),
        blockAccount: (options) => __awaiter(this, void 0, void 0, function* () {
            const accountToBlock = yield account_1.AccountModel.loadByNameWithHost(options.handleToBlock);
            if (!accountToBlock)
                return;
            yield blocklist_1.addAccountInBlocklist(options.byAccountId, accountToBlock.id);
        }),
        unblockAccount: (options) => __awaiter(this, void 0, void 0, function* () {
            const targetAccount = yield account_1.AccountModel.loadByNameWithHost(options.handleToUnblock);
            if (!targetAccount)
                return;
            const accountBlock = yield account_blocklist_1.AccountBlocklistModel.loadByAccountAndTarget(options.byAccountId, targetAccount.id);
            if (!accountBlock)
                return;
            yield blocklist_1.removeAccountFromBlocklist(accountBlock);
        }),
        blacklistVideo: (options) => __awaiter(this, void 0, void 0, function* () {
            const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(options.videoIdOrUUID);
            if (!video)
                return;
            yield video_blacklist_1.blacklistVideo(video, options.createOptions);
        }),
        unblacklistVideo: (options) => __awaiter(this, void 0, void 0, function* () {
            const video = yield video_1.VideoModel.loadAndPopulateAccountAndServerAndTags(options.videoIdOrUUID);
            if (!video)
                return;
            const videoBlacklist = yield video_blacklist_2.VideoBlacklistModel.loadByVideoId(video.id);
            if (!videoBlacklist)
                return;
            yield video_blacklist_1.unblacklistVideo(videoBlacklist, video);
        })
    };
}
function buildConfigHelpers() {
    return {
        getWebserverUrl() {
            return constants_1.WEBSERVER.URL;
        }
    };
}
