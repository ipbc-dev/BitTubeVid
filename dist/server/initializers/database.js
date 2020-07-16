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
const sequelize_typescript_1 = require("sequelize-typescript");
const core_utils_1 = require("../helpers/core-utils");
const logger_1 = require("../helpers/logger");
const account_1 = require("../models/account/account");
const account_video_rate_1 = require("../models/account/account-video-rate");
const user_1 = require("../models/account/user");
const actor_1 = require("../models/activitypub/actor");
const actor_follow_1 = require("../models/activitypub/actor-follow");
const application_1 = require("../models/application/application");
const avatar_1 = require("../models/avatar/avatar");
const oauth_client_1 = require("../models/oauth/oauth-client");
const oauth_token_1 = require("../models/oauth/oauth-token");
const server_1 = require("../models/server/server");
const tag_1 = require("../models/video/tag");
const video_1 = require("../models/video/video");
const video_abuse_1 = require("../models/video/video-abuse");
const video_blacklist_1 = require("../models/video/video-blacklist");
const video_channel_1 = require("../models/video/video-channel");
const video_comment_1 = require("../models/video/video-comment");
const video_file_1 = require("../models/video/video-file");
const video_share_1 = require("../models/video/video-share");
const video_tag_1 = require("../models/video/video-tag");
const config_1 = require("./config");
const schedule_video_update_1 = require("../models/video/schedule-video-update");
const video_caption_1 = require("../models/video/video-caption");
const video_import_1 = require("../models/video/video-import");
const video_views_1 = require("../models/video/video-views");
const video_change_ownership_1 = require("../models/video/video-change-ownership");
const video_redundancy_1 = require("../models/redundancy/video-redundancy");
const user_video_history_1 = require("../models/account/user-video-history");
const account_blocklist_1 = require("../models/account/account-blocklist");
const server_blocklist_1 = require("../models/server/server-blocklist");
const user_notification_1 = require("../models/account/user-notification");
const user_notification_setting_1 = require("../models/account/user-notification-setting");
const video_streaming_playlist_1 = require("../models/video/video-streaming-playlist");
const video_playlist_1 = require("../models/video/video-playlist");
const video_playlist_element_1 = require("../models/video/video-playlist-element");
const thumbnail_1 = require("../models/video/thumbnail");
const premium_storage_plan_1 = require("../models/premium-storage-plan");
const user_premium_storage_payments_1 = require("../models/user-premium-storage-payments");
const plugin_1 = require("../models/server/plugin");
const sequelize_1 = require("sequelize");
require('pg').defaults.parseInt8 = true;
const dbname = config_1.CONFIG.DATABASE.DBNAME;
const username = config_1.CONFIG.DATABASE.USERNAME;
const password = config_1.CONFIG.DATABASE.PASSWORD;
const host = config_1.CONFIG.DATABASE.HOSTNAME;
const port = config_1.CONFIG.DATABASE.PORT;
const poolMax = config_1.CONFIG.DATABASE.POOL.MAX;
const sequelizeTypescript = new sequelize_typescript_1.Sequelize({
    database: dbname,
    dialect: 'postgres',
    host,
    port,
    username,
    password,
    pool: {
        max: poolMax
    },
    benchmark: core_utils_1.isTestInstance(),
    isolationLevel: sequelize_1.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    logging: (message, benchmark) => {
        if (process.env.NODE_DB_LOG === 'false')
            return;
        let newMessage = message;
        if (core_utils_1.isTestInstance() === true && benchmark !== undefined) {
            newMessage += ' | ' + benchmark + 'ms';
        }
        logger_1.logger.debug(newMessage);
    }
});
exports.sequelizeTypescript = sequelizeTypescript;
function initDatabaseModels(silent) {
    return __awaiter(this, void 0, void 0, function* () {
        sequelizeTypescript.addModels([
            application_1.ApplicationModel,
            actor_1.ActorModel,
            actor_follow_1.ActorFollowModel,
            avatar_1.AvatarModel,
            account_1.AccountModel,
            oauth_client_1.OAuthClientModel,
            oauth_token_1.OAuthTokenModel,
            server_1.ServerModel,
            tag_1.TagModel,
            account_video_rate_1.AccountVideoRateModel,
            user_1.UserModel,
            video_abuse_1.VideoAbuseModel,
            video_1.VideoModel,
            video_change_ownership_1.VideoChangeOwnershipModel,
            video_channel_1.VideoChannelModel,
            video_share_1.VideoShareModel,
            video_file_1.VideoFileModel,
            video_caption_1.VideoCaptionModel,
            video_blacklist_1.VideoBlacklistModel,
            video_tag_1.VideoTagModel,
            video_comment_1.VideoCommentModel,
            schedule_video_update_1.ScheduleVideoUpdateModel,
            video_import_1.VideoImportModel,
            video_views_1.VideoViewModel,
            video_redundancy_1.VideoRedundancyModel,
            user_video_history_1.UserVideoHistoryModel,
            account_blocklist_1.AccountBlocklistModel,
            server_blocklist_1.ServerBlocklistModel,
            user_notification_1.UserNotificationModel,
            user_notification_setting_1.UserNotificationSettingModel,
            video_streaming_playlist_1.VideoStreamingPlaylistModel,
            video_playlist_1.VideoPlaylistModel,
            video_playlist_element_1.VideoPlaylistElementModel,
            thumbnail_1.ThumbnailModel,
            premium_storage_plan_1.PremiumStoragePlanModel,
            user_premium_storage_payments_1.userPremiumStoragePaymentModel,
            plugin_1.PluginModel
        ]);
        yield checkPostgresExtensions();
        yield createFunctions();
        if (!silent)
            logger_1.logger.info('Database %s is ready.', dbname);
    });
}
exports.initDatabaseModels = initDatabaseModels;
function checkPostgresExtensions() {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [
            checkPostgresExtension('pg_trgm'),
            checkPostgresExtension('unaccent')
        ];
        return Promise.all(promises);
    });
}
function checkPostgresExtension(extension) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT 1 FROM pg_available_extensions WHERE name = '${extension}' AND installed_version IS NOT NULL;`;
        const options = {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true
        };
        const res = yield sequelizeTypescript.query(query, options);
        if (!res || res.length === 0) {
            try {
                yield sequelizeTypescript.query(`CREATE EXTENSION ${extension};`, { raw: true });
            }
            catch (_a) {
                const errorMessage = `You need to enable ${extension} extension in PostgreSQL. ` +
                    `You can do so by running 'CREATE EXTENSION ${extension};' as a PostgreSQL super user in ${config_1.CONFIG.DATABASE.DBNAME} database.`;
                throw new Error(errorMessage);
            }
        }
    });
}
function createFunctions() {
    const query = `CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text AS
$func$
SELECT public.unaccent('public.unaccent', $1::text)
$func$  LANGUAGE sql IMMUTABLE;`;
    return sequelizeTypescript.query(query, { raw: true });
}
