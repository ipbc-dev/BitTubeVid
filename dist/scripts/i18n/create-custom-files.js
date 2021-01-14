"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const path_1 = require("path");
const register_ts_paths_1 = require("../../server/helpers/register-ts-paths");
const constants_1 = require("../../server/initializers/constants");
const i18n_1 = require("../../shared/core-utils/i18n");
register_ts_paths_1.registerTSPaths();
const videojs = require(path_1.join(__dirname, '../../../client/src/locale/videojs.en-US.json'));
const playerKeys = {
    'Quality': 'Quality',
    'Auto': 'Auto',
    'Speed': 'Speed',
    'Subtitles/CC': 'Subtitles/CC',
    'peers': 'peers',
    'peer': 'peer',
    'Go to the video page': 'Go to the video page',
    'Settings': 'Settings',
    'Watching this video may reveal your IP address to others.': 'Watching this video may reveal your IP address to others.',
    'Copy the video URL': 'Copy the video URL',
    'Copy the video URL at the current time': 'Copy the video URL at the current time',
    'Copy embed code': 'Copy embed code',
    'Copy magnet URI': 'Copy magnet URI',
    'Total downloaded: ': 'Total downloaded: ',
    'Total uploaded: ': 'Total uploaded: ',
    'From servers: ': 'From servers: ',
    'From peers: ': 'From peers: ',
    'Normal mode': 'Normal mode',
    'Theater mode': 'Theater mode'
};
Object.assign(playerKeys, videojs);
const serverKeys = {};
lodash_1.values(constants_1.VIDEO_CATEGORIES)
    .concat(lodash_1.values(constants_1.VIDEO_LICENCES))
    .concat(lodash_1.values(constants_1.VIDEO_PRIVACIES))
    .concat(lodash_1.values(constants_1.VIDEO_STATES))
    .concat(lodash_1.values(constants_1.VIDEO_IMPORT_STATES))
    .concat(lodash_1.values(constants_1.VIDEO_PLAYLIST_PRIVACIES))
    .concat(lodash_1.values(constants_1.VIDEO_PLAYLIST_TYPES))
    .concat([
    'This video does not exist.',
    'We cannot fetch the video. Please try again later.',
    'Sorry',
    'This video is not available because the remote instance is not responding.',
    'This playlist does not exist',
    'We cannot fetch the playlist. Please try again later.',
    'Playlist: {1}',
    'By {1}',
    'Unavailable video'
])
    .forEach(v => { serverKeys[v] = v; });
Object.assign(serverKeys, {
    Misc: 'Misc',
    Unknown: 'Unknown'
});
const languageKeys = {};
const languages = constants_1.buildLanguages();
Object.keys(languages).forEach(k => { languageKeys[languages[k]] = languages[k]; });
Object.assign(serverKeys, languageKeys);
writeAll().catch(err => {
    console.error(err);
    process.exit(-1);
});
function writeAll() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const localePath = path_1.join(__dirname, '../../../client/src/locale');
        yield fs_extra_1.writeJSON(path_1.join(localePath, 'player.en-US.json'), playerKeys, { spaces: 4 });
        yield fs_extra_1.writeJSON(path_1.join(localePath, 'server.en-US.json'), serverKeys, { spaces: 4 });
        for (const key of Object.keys(i18n_1.I18N_LOCALES)) {
            const playerJsonPath = path_1.join(localePath, `player.${key}.json`);
            const translatedPlayer = require(playerJsonPath);
            const newTranslatedPlayer = Object.assign({}, playerKeys, translatedPlayer);
            yield fs_extra_1.writeJSON(playerJsonPath, newTranslatedPlayer, { spaces: 4 });
            const serverJsonPath = path_1.join(localePath, `server.${key}.json`);
            const translatedServer = require(serverJsonPath);
            const newTranslatedServer = Object.assign({}, serverKeys, translatedServer);
            yield fs_extra_1.writeJSON(serverJsonPath, newTranslatedServer, { spaces: 4 });
        }
    });
}
