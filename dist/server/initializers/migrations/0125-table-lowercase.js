"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const tslib_1 = require("tslib");
function up(utils) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield utils.queryInterface.renameTable('Applications', 'application');
        yield utils.queryInterface.renameTable('AccountFollows', 'accountFollow');
        yield utils.queryInterface.renameTable('AccountVideoRates', 'accountVideoRate');
        yield utils.queryInterface.renameTable('Accounts', 'account');
        yield utils.queryInterface.renameTable('Avatars', 'avatar');
        yield utils.queryInterface.renameTable('BlacklistedVideos', 'videoBlacklist');
        yield utils.queryInterface.renameTable('Jobs', 'job');
        yield utils.queryInterface.renameTable('OAuthClients', 'oAuthClient');
        yield utils.queryInterface.renameTable('OAuthTokens', 'oAuthToken');
        yield utils.queryInterface.renameTable('Servers', 'server');
        yield utils.queryInterface.renameTable('Tags', 'tag');
        yield utils.queryInterface.renameTable('Users', 'user');
        yield utils.queryInterface.renameTable('VideoAbuses', 'videoAbuse');
        yield utils.queryInterface.renameTable('VideoChannels', 'videoChannel');
        yield utils.queryInterface.renameTable('VideoChannelShares', 'videoChannelShare');
        yield utils.queryInterface.renameTable('VideoFiles', 'videoFile');
        yield utils.queryInterface.renameTable('VideoShares', 'videoShare');
        yield utils.queryInterface.renameTable('VideoTags', 'videoTag');
        yield utils.queryInterface.renameTable('Videos', 'video');
    });
}
exports.up = up;
function down(options) {
    throw new Error('Not implemented.');
}
exports.down = down;
